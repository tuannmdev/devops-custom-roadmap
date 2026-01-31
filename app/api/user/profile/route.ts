import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      full_name,
      daily_goal_minutes,
      timezone,
      preferred_language,
    } = body;

    // Validate inputs
    if (daily_goal_minutes !== undefined) {
      const goal = parseInt(daily_goal_minutes);
      if (isNaN(goal) || goal < 10 || goal > 480) {
        return NextResponse.json(
          { error: "Daily goal must be between 10 and 480 minutes" },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (full_name !== undefined) updates.full_name = full_name.trim();
    if (daily_goal_minutes !== undefined) updates.daily_goal_minutes = parseInt(daily_goal_minutes);
    if (timezone !== undefined) updates.timezone = timezone;
    if (preferred_language !== undefined) updates.preferred_language = preferred_language;

    // Update profile
    const { data, error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Profile update error:", error);
      return NextResponse.json(
        {
          error: "Failed to update profile",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: data,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
