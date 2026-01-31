import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("email, role")
      .eq("user_id", user.id)
      .single();

    const isAdmin = profile?.role === "admin" || profile?.email?.includes("admin");

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const processed = searchParams.get("processed");
    const minQuality = searchParams.get("minQuality");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build query
    let query = supabase
      .from("aws_content")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    // Apply filters
    if (type && type !== "all") {
      query = query.eq("content_type", type);
    }

    if (processed && processed !== "all") {
      query = query.eq("is_processed", processed === "true");
    }

    if (minQuality) {
      const minQualityNum = parseFloat(minQuality);
      if (!isNaN(minQualityNum)) {
        query = query.gte("overall_quality_score", minQualityNum);
      }
    }

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    // Execute query
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching content:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch content",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error("Error in content fetch:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
