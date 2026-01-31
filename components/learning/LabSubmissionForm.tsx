"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  Github,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { uploadFile, validateFile, formatFileSize, getFileExtensionInfo } from "@/lib/storage";

interface LabSubmissionFormProps {
  topicId: string;
  onSubmitSuccess?: () => void;
}

export function LabSubmissionForm({ topicId, onSubmitSuccess }: LabSubmissionFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [githubUrl, setGithubUrl] = useState("");
  const [liveDemoUrl, setLiveDemoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    // Validate each file
    for (const file of selectedFiles) {
      const validation = validateFile(file, {
        maxSize: 10 * 1024 * 1024, // 10MB
      });

      if (!validation.valid) {
        setError(validation.error || "Invalid file");
        return;
      }
    }

    setFiles((prev) => [...prev, ...selectedFiles]);
    setError(null);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(false);
    setError(null);
    setUploadProgress(0);

    try {
      // Validate: at least one submission method
      if (files.length === 0 && !githubUrl && !liveDemoUrl) {
        throw new Error("Please provide at least one: file, GitHub repo, or live demo URL");
      }

      // Upload files to Supabase Storage
      const uploadedFiles: Array<{ name: string; url: string; size: number }> = [];

      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setUploadProgress(((i + 1) / files.length) * 50); // First 50% for uploads

          try {
            const { url } = await uploadFile(file, "submissions", "lab-files");
            uploadedFiles.push({
              name: file.name,
              url,
              size: file.size,
            });
          } catch (uploadError) {
            throw new Error(`Failed to upload ${file.name}: ${uploadError}`);
          }
        }
      }

      setUploadProgress(60);

      // Create submission via API
      const response = await fetch("/api/user/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic_id: topicId,
          github_repo_url: githubUrl || null,
          live_demo_url: liveDemoUrl || null,
          description: description || null,
          files: uploadedFiles.length > 0 ? uploadedFiles : null,
        }),
      });

      setUploadProgress(80);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to submit lab");
      }

      setUploadProgress(100);
      setSuccess(true);

      // Reset form
      setTimeout(() => {
        setFiles([]);
        setGithubUrl("");
        setLiveDemoUrl("");
        setDescription("");
        setSuccess(false);
        setUploadProgress(0);

        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit lab");
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalFileSize = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Submit Your Lab Work
        </CardTitle>
        <CardDescription>
          Upload files, share your GitHub repo, or provide a live demo link
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="files">Upload Files (Optional)</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
              <input
                id="files"
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={isSubmitting}
              />
              <label htmlFor="files" className="cursor-pointer">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click to upload files</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Max 10MB per file. Multiple files allowed.
                </p>
              </label>
            </div>

            {/* Selected Files */}
            {files.length > 0 && (
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{files.length} file(s) selected</span>
                  <span className="text-muted-foreground">{formatFileSize(totalFileSize)}</span>
                </div>

                {files.map((file, index) => {
                  const fileInfo = getFileExtensionInfo(file.name);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-2xl">{fileInfo.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* GitHub Repo URL */}
          <div className="space-y-2">
            <Label htmlFor="github-url" className="flex items-center gap-2">
              <Github className="h-4 w-4" />
              GitHub Repository URL (Optional)
            </Label>
            <Input
              id="github-url"
              type="url"
              placeholder="https://github.com/username/repository"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Live Demo URL */}
          <div className="space-y-2">
            <Label htmlFor="demo-url" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Live Demo URL (Optional)
            </Label>
            <Input
              id="demo-url"
              type="url"
              placeholder="https://your-demo.vercel.app"
              value={liveDemoUrl}
              onChange={(e) => setLiveDemoUrl(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe your implementation, challenges faced, and what you learned..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Upload Progress */}
          {isSubmitting && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Success Message */}
          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Lab submitted successfully! Great work! 🎉
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Submit Lab
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
