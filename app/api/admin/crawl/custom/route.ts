import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { spawn } from "child_process";
import path from "path";

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
    const { type, url } = body;

    if (!type || !url) {
      return NextResponse.json(
        { error: "Missing required fields: type and url" },
        { status: 400 }
      );
    }

    if (!["blog", "video", "playlist"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be: blog, video, or playlist" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Determine which crawler to use
    let crawlerScript: string;
    let args: string[];

    switch (type) {
      case "blog":
        crawlerScript = "crawlers/aws_blogs_crawler.py";
        args = ["--url", url];
        break;
      case "video":
        crawlerScript = "crawlers/aws_youtube_crawler.py";
        args = ["--video-url", url];
        break;
      case "playlist":
        crawlerScript = "crawlers/aws_youtube_crawler.py";
        args = ["--playlist-url", url];
        break;
      default:
        return NextResponse.json(
          { error: "Invalid type" },
          { status: 400 }
        );
    }

    // Execute crawler
    const result = await new Promise<{
      success: boolean;
      data?: any;
      error?: string;
    }>((resolve) => {
      const crawlingDir = path.join(process.cwd(), "crawling");
      const pythonProcess = spawn("python", [crawlerScript, ...args], {
        cwd: crawlingDir,
        env: {
          ...process.env,
          PYTHONUNBUFFERED: "1",
        },
      });

      let stdout = "";
      let stderr = "";

      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
        console.log(`[Custom Crawl] ${data.toString().trim()}`);
      });

      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
        console.error(`[Custom Crawl] ERROR: ${data.toString().trim()}`);
      });

      pythonProcess.on("close", (code) => {
        if (code === 0) {
          // Try to parse JSON output from Python
          try {
            // Look for JSON in the output (Python script should print JSON result)
            const jsonMatch = stdout.match(/\{[\s\S]*\}/);
            const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

            resolve({
              success: true,
              data,
            });
          } catch (e) {
            // If no JSON, just return success
            resolve({
              success: true,
              data: {
                message: "Content crawled successfully",
                output: stdout,
              },
            });
          }
        } else {
          resolve({
            success: false,
            error: stderr || `Process exited with code ${code}`,
          });
        }
      });

      // Timeout after 2 minutes
      setTimeout(() => {
        pythonProcess.kill();
        resolve({
          success: false,
          error: "Crawl timeout after 2 minutes",
        });
      }, 2 * 60 * 1000);
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully crawled ${type}`,
        data: result.data,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Crawl failed",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in custom crawl:", error);
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
