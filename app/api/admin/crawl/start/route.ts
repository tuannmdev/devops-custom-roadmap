import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { spawn } from "child_process";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Store active crawl jobs in memory (in production, use Redis or database)
const activeCrawls = new Map<string, {
  jobId: string;
  operation: string;
  status: "running" | "completed" | "failed";
  progress: number;
  message: string;
  stats?: any;
  error?: string;
}>();

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

    // Parse request body
    const body = await request.json();
    const { operation } = body;

    if (!operation || !["daily-update", "full-crawl", "process-content"].includes(operation)) {
      return NextResponse.json(
        { error: "Invalid operation. Must be: daily-update, full-crawl, or process-content" },
        { status: 400 }
      );
    }

    // Generate unique job ID
    const jobId = uuidv4();

    // Initialize job status
    activeCrawls.set(jobId, {
      jobId,
      operation,
      status: "running",
      progress: 0,
      message: `Starting ${operation}...`,
    });

    // Spawn Python orchestrator process
    const crawlingDir = path.join(process.cwd(), "crawling");
    const pythonProcess = spawn("python", [
      "orchestrator.py",
      "--operation",
      operation,
    ], {
      cwd: crawlingDir,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: "1", // Disable Python output buffering
      },
    });

    // Handle stdout
    pythonProcess.stdout.on("data", (data) => {
      const message = data.toString().trim();
      console.log(`[${jobId}] ${message}`);

      const crawlJob = activeCrawls.get(jobId);
      if (crawlJob) {
        // Parse progress from logs (you can enhance this)
        if (message.includes("Crawling AWS Blogs")) {
          crawlJob.progress = 25;
          crawlJob.message = "Crawling AWS Blogs...";
        } else if (message.includes("Crawling AWS YouTube")) {
          crawlJob.progress = 50;
          crawlJob.message = "Crawling YouTube videos...";
        } else if (message.includes("Crawling AWS Documentation")) {
          crawlJob.progress = 75;
          crawlJob.message = "Crawling AWS Documentation...";
        } else if (message.includes("Processing content")) {
          crawlJob.progress = 90;
          crawlJob.message = "Processing content with AI...";
        }
        activeCrawls.set(jobId, crawlJob);
      }
    });

    // Handle stderr
    pythonProcess.stderr.on("data", (data) => {
      const errorMessage = data.toString().trim();
      console.error(`[${jobId}] ERROR: ${errorMessage}`);
    });

    // Handle process completion
    pythonProcess.on("close", (code) => {
      const crawlJob = activeCrawls.get(jobId);
      if (crawlJob) {
        if (code === 0) {
          crawlJob.status = "completed";
          crawlJob.progress = 100;
          crawlJob.message = "Crawl completed successfully!";
          // TODO: Parse actual stats from Python output
          crawlJob.stats = {
            total_processed: 0,
            successful: 0,
            failed: 0,
            duplicates: 0,
          };
        } else {
          crawlJob.status = "failed";
          crawlJob.progress = 0;
          crawlJob.message = "Crawl failed";
          crawlJob.error = `Process exited with code ${code}`;
        }
        activeCrawls.set(jobId, crawlJob);
      }

      // Clean up after 10 minutes
      setTimeout(() => {
        activeCrawls.delete(jobId);
      }, 10 * 60 * 1000);
    });

    return NextResponse.json({
      success: true,
      jobId,
      message: `Started ${operation} operation`,
    });
  } catch (error) {
    console.error("Error starting crawl:", error);
    return NextResponse.json(
      {
        error: "Failed to start crawl",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Export activeCrawls for status endpoint
export { activeCrawls };
