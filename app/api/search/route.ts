import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const searchParams = request.nextUrl.searchParams;

    // Get search parameters
    const query = searchParams.get("q") || "";
    const contentType = searchParams.get("type");
    const difficulty = searchParams.get("difficulty");
    const services = searchParams.get("services")?.split(",").filter(Boolean);
    const minQuality = searchParams.get("minQuality");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Build base query
    let dbQuery = supabase
      .from("aws_content")
      .select("*", { count: "exact" })
      .eq("is_processed", true)
      .order("overall_quality_score", { ascending: false, nullsFirst: false })
      .order("published_date", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply full-text search if query provided
    if (query.trim()) {
      // Use PostgreSQL full-text search on search_vector column
      dbQuery = dbQuery.textSearch("search_vector", query, {
        type: "websearch",
        config: "english",
      });
    }

    // Apply filters
    if (contentType && contentType !== "all") {
      dbQuery = dbQuery.eq("content_type", contentType);
    }

    if (difficulty && difficulty !== "all") {
      dbQuery = dbQuery.eq("difficulty_level", difficulty);
    }

    if (services && services.length > 0) {
      // Filter by AWS services (array contains)
      dbQuery = dbQuery.contains("aws_services", services);
    }

    if (minQuality) {
      const minQualityNum = parseFloat(minQuality);
      if (!isNaN(minQualityNum)) {
        dbQuery = dbQuery.gte("overall_quality_score", minQualityNum);
      }
    }

    // Execute query
    const { data, error, count } = await dbQuery;

    if (error) {
      console.error("Search error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Search failed",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Calculate pagination metadata
    const totalPages = count ? Math.ceil(count / limit) : 0;
    const hasMore = page < totalPages;

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasMore,
      },
      filters: {
        query,
        contentType,
        difficulty,
        services,
        minQuality,
      },
    });
  } catch (error) {
    console.error("Search error:", error);
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
