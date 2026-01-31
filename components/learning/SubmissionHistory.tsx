"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Github,
  ExternalLink,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Download,
} from "lucide-react";
import { formatFileSize, getFileExtensionInfo } from "@/lib/storage";

interface Submission {
  id: string;
  topic_id: string;
  github_repo_url: string | null;
  live_demo_url: string | null;
  description: string | null;
  files: Array<{ name: string; url: string; size: number }> | null;
  status: "pending" | "approved" | "rejected";
  review_feedback: string | null;
  reviewed_at: string | null;
  submitted_at: string;
}

interface SubmissionHistoryProps {
  topicId: string;
}

export function SubmissionHistory({ topicId }: SubmissionHistoryProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, [topicId]);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/user/submissions?topicId=${topicId}`);
      const data = await response.json();

      if (data.success) {
        setSubmissions(data.submissions);
      } else {
        setError(data.error || "Failed to fetch submissions");
      }
    } catch (err) {
      setError("Failed to fetch submissions");
      console.error("Submission fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-4">Loading submissions...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
          <p className="text-muted-foreground">
            Submit your lab work to get feedback and track your progress
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Your Submissions ({submissions.length})
        </h3>
        <Button size="sm" variant="outline" onClick={fetchSubmissions}>
          Refresh
        </Button>
      </div>

      {submissions.map((submission) => (
        <Card key={submission.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                  <Badge variant={getStatusVariant(submission.status)} className="gap-1">
                    {getStatusIcon(submission.status)}
                    {submission.status}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {new Date(submission.submitted_at).toLocaleTimeString()}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Description */}
            {submission.description && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description:</p>
                <p className="text-sm">{submission.description}</p>
              </div>
            )}

            {/* Files */}
            {submission.files && submission.files.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Uploaded Files ({submission.files.length}):
                </p>
                <div className="space-y-2">
                  {submission.files.map((file, index) => {
                    const fileInfo = getFileExtensionInfo(file.name);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{fileInfo.icon}</span>
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(file.url, "_blank")}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Links */}
            <div className="flex flex-wrap gap-2">
              {submission.github_repo_url && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(submission.github_repo_url!, "_blank")}
                >
                  <Github className="h-4 w-4 mr-2" />
                  View on GitHub
                </Button>
              )}

              {submission.live_demo_url && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(submission.live_demo_url!, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Live Demo
                </Button>
              )}
            </div>

            {/* Review Feedback */}
            {submission.status !== "pending" && submission.review_feedback && (
              <Alert
                variant={submission.status === "approved" ? "default" : "destructive"}
                className={
                  submission.status === "approved"
                    ? "bg-green-50 border-green-200"
                    : ""
                }
              >
                {submission.status === "approved" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription
                  className={
                    submission.status === "approved" ? "text-green-600" : ""
                  }
                >
                  <p className="font-semibold mb-1">Review Feedback:</p>
                  <p>{submission.review_feedback}</p>
                  {submission.reviewed_at && (
                    <p className="text-xs mt-2 opacity-70">
                      Reviewed on{" "}
                      {new Date(submission.reviewed_at).toLocaleDateString()}
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Pending Status */}
            {submission.status === "pending" && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Your submission is pending review. You'll receive feedback soon!
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
