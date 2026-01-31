import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to enroll." },
        { status: 401 }
      );
    }

    // Check if roadmap exists
    const { data: roadmap, error: roadmapError } = await supabase
      .from("roadmaps")
      .select("id, title, is_published")
      .eq("id", id)
      .single();

    if (roadmapError || !roadmap) {
      return NextResponse.json(
        { error: "Roadmap not found." },
        { status: 404 }
      );
    }

    if (!roadmap.is_published) {
      return NextResponse.json(
        { error: "This roadmap is not available for enrollment." },
        { status: 403 }
      );
    }

    // Check if already enrolled
    const { data: existingEnrollment, error: enrollmentCheckError } =
      await supabase
        .from("user_roadmaps")
        .select("id")
        .eq("user_id", user.id)
        .eq("roadmap_id", id)
        .maybeSingle();

    if (enrollmentCheckError) {
      console.error("Error checking enrollment:", enrollmentCheckError);
      return NextResponse.json(
        { error: "Failed to check enrollment status." },
        { status: 500 }
      );
    }

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "You are already enrolled in this roadmap." },
        { status: 400 }
      );
    }

    // Create enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from("user_roadmaps")
      .insert({
        user_id: user.id,
        roadmap_id: id,
        enrollment_date: new Date().toISOString(),
        progress_percentage: 0,
        status: "active",
      })
      .select()
      .single();

    if (enrollError) {
      console.error("Error creating enrollment:", enrollError);
      return NextResponse.json(
        { error: "Failed to enroll in roadmap." },
        { status: 500 }
      );
    }

    // Initialize progress tracking for all topics in this roadmap
    const { data: topics, error: topicsError } = await supabase
      .from("topics")
      .select("id")
      .eq("roadmap_id", id);

    if (!topicsError && topics && topics.length > 0) {
      const progressRecords = topics.map((topic) => ({
        user_id: user.id,
        topic_id: topic.id,
        is_completed: false,
        time_spent_minutes: 0,
      }));

      await supabase.from("user_progress").insert(progressRecords);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Successfully enrolled in roadmap!",
        enrollment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Enrollment error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
