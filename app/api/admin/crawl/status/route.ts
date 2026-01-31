import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// Import the activeCrawls map from the start endpoint
// In production, use a shared state manager (Redis, database, etc.)
let activeCrawls: Map<string, any>;

// Lazy load to avoid circular dependency issues
const getActiveCrawls = async () => {
  if (!activeCrawls) {
    const startModule = await import("../start/route");
    activeCrawls = startModule.activeCrawls;
  }
  return activeCrawls;
};

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

    // Get job ID from query params
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "Missing jobId parameter" },
        { status: 400 }
      );
    }

    // Get crawl status
    const crawls = await getActiveCrawls();
    const crawlJob = crawls.get(jobId);

    if (!crawlJob) {
      return NextResponse.json(
        { error: "Job not found or expired" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      jobId: crawlJob.jobId,
      operation: crawlJob.operation,
      status: crawlJob.status,
      progress: crawlJob.progress,
      message: crawlJob.message,
      stats: crawlJob.stats,
      error: crawlJob.error,
    });
  } catch (error) {
    console.error("Error fetching crawl status:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
