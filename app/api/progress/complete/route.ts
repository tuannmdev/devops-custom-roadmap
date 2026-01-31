import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const topicId = formData.get("topicId") as string;
    const roadmapId = formData.get("roadmapId") as string;

    if (!topicId || !roadmapId) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // Verify topic belongs to roadmap
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .select("id, roadmap_id")
      .eq("id", topicId)
      .eq("roadmap_id", roadmapId)
      .single();

    if (topicError || !topic) {
      return NextResponse.json({ error: "Topic not found." }, { status: 404 });
    }

    // Check if user is enrolled
    const { data: enrollment } = await supabase
      .from("user_roadmaps")
      .select("id")
      .eq("user_id", user.id)
      .eq("roadmap_id", roadmapId)
      .single();

    if (!enrollment) {
      return NextResponse.json(
        { error: "You are not enrolled in this roadmap." },
        { status: 403 }
      );
    }

    // Check if progress record exists
    const { data: existingProgress } = await supabase
      .from("user_progress")
      .select("id, is_completed")
      .eq("user_id", user.id)
      .eq("topic_id", topicId)
      .maybeSingle();

    if (existingProgress) {
      // Update existing progress
      const { error: updateError } = await supabase
        .from("user_progress")
        .update({
          is_completed: true,
          completion_date: new Date().toISOString(),
        })
        .eq("id", existingProgress.id);

      if (updateError) {
        console.error("Error updating progress:", updateError);
        return NextResponse.json(
          { error: "Failed to update progress." },
          { status: 500 }
        );
      }
    } else {
      // Create new progress record
      const { error: insertError } = await supabase
        .from("user_progress")
        .insert({
          user_id: user.id,
          topic_id: topicId,
          is_completed: true,
          completion_date: new Date().toISOString(),
          time_spent_minutes: 0,
        });

      if (insertError) {
        console.error("Error creating progress:", insertError);
        return NextResponse.json(
          { error: "Failed to create progress." },
          { status: 500 }
        );
      }
    }

    // Calculate and update roadmap progress
    // Get all topics in the roadmap
    const { data: allTopics } = await supabase
      .from("topics")
      .select("id")
      .eq("roadmap_id", roadmapId);

    // Get completed topics count
    const { data: completedTopics } = await supabase
      .from("user_progress")
      .select("topic_id")
      .eq("user_id", user.id)
      .eq("is_completed", true)
      .in(
        "topic_id",
        allTopics?.map((t) => t.id) || []
      );

    const totalTopics = allTopics?.length || 0;
    const completedCount = completedTopics?.length || 0;
    const progressPercentage =
      totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

    // Update user_roadmaps progress
    await supabase
      .from("user_roadmaps")
      .update({
        progress_percentage: progressPercentage,
        last_accessed: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("roadmap_id", roadmapId);

    // Redirect back to the topic page
    return NextResponse.redirect(
      new URL(`/roadmap/${roadmapId}/topic/${topicId}`, request.url)
    );
  } catch (error) {
    console.error("Progress completion error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
