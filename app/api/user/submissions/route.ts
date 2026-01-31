import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// GET - Fetch user submissions for a topic
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get topic ID from query params
    const searchParams = request.nextUrl.searchParams;
    const topicId = searchParams.get("topicId");

    if (!topicId) {
      return NextResponse.json(
        { error: "Missing topicId parameter" },
        { status: 400 }
      );
    }

    // Fetch submissions
    const { data: submissions, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("user_id", user.id)
      .eq("topic_id", topicId)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Submissions fetch error:", error);
      return NextResponse.json(
        {
          error: "Failed to fetch submissions",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      submissions: submissions || [],
    });
  } catch (error) {
    console.error("Submissions fetch error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST - Create a new submission
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { topic_id, github_repo_url, live_demo_url, description, files } = body;

    // Validate required fields
    if (!topic_id) {
      return NextResponse.json(
        { error: "Missing topic_id" },
        { status: 400 }
      );
    }

    // Validate: at least one submission method
    if (
      !github_repo_url &&
      !live_demo_url &&
      (!files || files.length === 0)
    ) {
      return NextResponse.json(
        {
          error: "At least one submission method required (files, GitHub repo, or live demo)",
        },
        { status: 400 }
      );
    }

    // Verify topic exists and user is enrolled in the roadmap
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .select("id, roadmap_id")
      .eq("id", topic_id)
      .single();

    if (topicError || !topic) {
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      );
    }

    // Check if user is enrolled in the roadmap
    const { data: enrollment } = await supabase
      .from("user_roadmaps")
      .select("id")
      .eq("user_id", user.id)
      .eq("roadmap_id", topic.roadmap_id)
      .single();

    if (!enrollment) {
      return NextResponse.json(
        { error: "You must be enrolled in the roadmap to submit labs" },
        { status: 403 }
      );
    }

    // Create submission
    const { data: submission, error: insertError } = await supabase
      .from("submissions")
      .insert({
        user_id: user.id,
        topic_id: topic_id,
        github_repo_url: github_repo_url || null,
        live_demo_url: live_demo_url || null,
        description: description || null,
        files: files || null,
        status: "pending",
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Submission insert error:", insertError);
      return NextResponse.json(
        {
          error: "Failed to create submission",
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    // Award XP for submission (50 XP)
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("total_xp")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      await supabase
        .from("user_profiles")
        .update({
          total_xp: (profile.total_xp || 0) + 50,
          last_active_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }

    return NextResponse.json({
      success: true,
      submission,
      message: "Lab submitted successfully! +50 XP",
    });
  } catch (error) {
    console.error("Submission creation error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
