"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, PlayCircle, Database, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

interface CrawlStatus {
  isRunning: boolean;
  operation: string | null;
  progress: number;
  message: string;
  stats?: {
    total_processed: number;
    successful: number;
    failed: number;
    duplicates: number;
  };
}

export function CrawlControlPanel() {
  const [status, setStatus] = useState<CrawlStatus>({
    isRunning: false,
    operation: null,
    progress: 0,
    message: "",
  });
  const [logs, setLogs] = useState<string[]>([]);

  const startCrawl = async (operation: "daily-update" | "full-crawl" | "process-content") => {
    try {
      setStatus({
        isRunning: true,
        operation,
        progress: 0,
        message: `Starting ${operation}...`,
      });
      setLogs([`[${new Date().toLocaleTimeString()}] Starting ${operation}...`]);

      const response = await fetch("/api/admin/crawl/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start crawl: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Poll for status updates
        pollCrawlStatus(data.jobId);
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (error) {
      setStatus({
        isRunning: false,
        operation: null,
        progress: 0,
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
      setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ERROR: ${error}`]);
    }
  };

  const pollCrawlStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/admin/crawl/status?jobId=${jobId}`);
        const data = await response.json();

        if (data.status === "completed") {
          clearInterval(interval);
          setStatus({
            isRunning: false,
            operation: null,
            progress: 100,
            message: "Crawl completed successfully!",
            stats: data.stats,
          });
          setLogs((prev) => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] Crawl completed!`,
            `Total: ${data.stats?.total_processed || 0} | Success: ${data.stats?.successful || 0} | Failed: ${data.stats?.failed || 0}`,
          ]);
        } else if (data.status === "failed") {
          clearInterval(interval);
          setStatus({
            isRunning: false,
            operation: null,
            progress: 0,
            message: `Crawl failed: ${data.error}`,
          });
          setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ERROR: ${data.error}`]);
        } else if (data.status === "running") {
          setStatus((prev) => ({
            ...prev,
            progress: data.progress || 50,
            message: data.message || "Crawling in progress...",
          }));
          if (data.message) {
            setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${data.message}`]);
          }
        }
      } catch (error) {
        clearInterval(interval);
        setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Polling error: ${error}`]);
      }
    }, 2000); // Poll every 2 seconds
  };

  return (
    <div className="space-y-6">
      {/* Status Alert */}
      {status.message && (
        <Alert variant={status.isRunning ? "default" : status.message.includes("Error") ? "destructive" : "default"}>
          {status.isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : status.message.includes("Error") ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}

      {/* Progress Bar */}
      {status.isRunning && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              {status.operation} in progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={status.progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">{status.progress}% complete</p>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      {status.stats && (
        <Card>
          <CardHeader>
            <CardTitle>Crawl Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{status.stats.total_processed}</div>
                <div className="text-sm text-muted-foreground">Total Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{status.stats.successful}</div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{status.stats.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{status.stats.duplicates}</div>
                <div className="text-sm text-muted-foreground">Duplicates</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Crawl Operations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Daily Update */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Daily Update
            </CardTitle>
            <CardDescription>
              Crawl recent content from the last 7-14 days
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">AWS Blogs:</span>
                <span>Last 7 days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">YouTube:</span>
                <span>Last 14 days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">AWS Docs:</span>
                <span>Last 7 days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected:</span>
                <Badge variant="secondary">100-300 items</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <Badge variant="secondary">10-20 min</Badge>
              </div>
            </div>
            <Button
              onClick={() => startCrawl("daily-update")}
              disabled={status.isRunning}
              className="w-full"
            >
              {status.isRunning && status.operation === "daily-update" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Start Daily Update
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Full Crawl */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Full Crawl
            </CardTitle>
            <CardDescription>
              Comprehensive crawl of all sources
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">AWS Blogs:</span>
                <span>All categories</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">YouTube:</span>
                <span>All playlists</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">AWS Docs:</span>
                <span>All services</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected:</span>
                <Badge variant="secondary">5K-10K items</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <Badge variant="destructive">2-4 hours</Badge>
              </div>
            </div>
            <Button
              onClick={() => startCrawl("full-crawl")}
              disabled={status.isRunning}
              variant="outline"
              className="w-full"
            >
              {status.isRunning && status.operation === "full-crawl" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Start Full Crawl
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Process Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Process Content
            </CardTitle>
            <CardDescription>
              AI analysis of unprocessed content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Batch size:</span>
                <span>100 items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Model:</span>
                <span>Claude 3 Haiku</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quality threshold:</span>
                <span>0.5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected:</span>
                <Badge variant="secondary">~100 items</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <Badge variant="secondary">5-10 min</Badge>
              </div>
            </div>
            <Button
              onClick={() => startCrawl("process-content")}
              disabled={status.isRunning}
              variant="secondary"
              className="w-full"
            >
              {status.isRunning && status.operation === "process-content" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Process Content
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Operation Logs</CardTitle>
            <CardDescription>Real-time crawl activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 font-mono text-xs p-4 rounded-md h-64 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
