"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Link as LinkIcon, FileText, Video, List, CheckCircle2, AlertCircle } from "lucide-react";

interface CrawlResult {
  success: boolean;
  message: string;
  data?: any;
}

export function CustomUrlCrawler() {
  const [blogUrl, setBlogUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [playlistUrl, setPlaylistUrl] = useState("");

  const [blogLoading, setBlogLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [playlistLoading, setPlaylistLoading] = useState(false);

  const [blogResult, setBlogResult] = useState<CrawlResult | null>(null);
  const [videoResult, setVideoResult] = useState<CrawlResult | null>(null);
  const [playlistResult, setPlaylistResult] = useState<CrawlResult | null>(null);

  const crawlBlogPost = async () => {
    if (!blogUrl.trim()) {
      setBlogResult({ success: false, message: "Please enter a blog URL" });
      return;
    }

    setBlogLoading(true);
    setBlogResult(null);

    try {
      const response = await fetch("/api/admin/crawl/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "blog", url: blogUrl }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setBlogResult({
          success: true,
          message: `Successfully crawled: ${data.data?.title || "Blog post"}`,
          data: data.data,
        });
        setBlogUrl("");
      } else {
        setBlogResult({
          success: false,
          message: data.error || "Failed to crawl blog post",
        });
      }
    } catch (error) {
      setBlogResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setBlogLoading(false);
    }
  };

  const crawlVideo = async () => {
    if (!videoUrl.trim()) {
      setVideoResult({ success: false, message: "Please enter a video URL" });
      return;
    }

    setVideoLoading(true);
    setVideoResult(null);

    try {
      const response = await fetch("/api/admin/crawl/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "video", url: videoUrl }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setVideoResult({
          success: true,
          message: `Successfully crawled: ${data.data?.title || "Video"}`,
          data: data.data,
        });
        setVideoUrl("");
      } else {
        setVideoResult({
          success: false,
          message: data.error || "Failed to crawl video",
        });
      }
    } catch (error) {
      setVideoResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setVideoLoading(false);
    }
  };

  const crawlPlaylist = async () => {
    if (!playlistUrl.trim()) {
      setPlaylistResult({ success: false, message: "Please enter a playlist URL" });
      return;
    }

    setPlaylistLoading(true);
    setPlaylistResult(null);

    try {
      const response = await fetch("/api/admin/crawl/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "playlist", url: playlistUrl }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPlaylistResult({
          success: true,
          message: `Successfully crawled ${data.data?.videoCount || 0} videos from playlist`,
          data: data.data,
        });
        setPlaylistUrl("");
      } else {
        setPlaylistResult({
          success: false,
          message: data.error || "Failed to crawl playlist",
        });
      }
    } catch (error) {
      setPlaylistResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setPlaylistLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Blog Post Crawler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Crawl AWS Blog Post
          </CardTitle>
          <CardDescription>
            Paste a link to an individual AWS blog post to crawl and analyze it
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="blog-url">Blog Post URL</Label>
            <div className="flex gap-2">
              <Input
                id="blog-url"
                type="url"
                placeholder="https://aws.amazon.com/blogs/..."
                value={blogUrl}
                onChange={(e) => setBlogUrl(e.target.value)}
                disabled={blogLoading}
              />
              <Button
                onClick={crawlBlogPost}
                disabled={blogLoading}
                className="min-w-[120px]"
              >
                {blogLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Crawling...
                  </>
                ) : (
                  <>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Crawl
                  </>
                )}
              </Button>
            </div>
          </div>

          {blogResult && (
            <Alert variant={blogResult.success ? "default" : "destructive"}>
              {blogResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{blogResult.message}</AlertDescription>
            </Alert>
          )}

          {blogResult?.success && blogResult.data && (
            <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
              <div><strong>Title:</strong> {blogResult.data.title}</div>
              <div><strong>Author:</strong> {blogResult.data.author || "N/A"}</div>
              <div><strong>Published:</strong> {new Date(blogResult.data.published_date).toLocaleDateString()}</div>
              {blogResult.data.tags && blogResult.data.tags.length > 0 && (
                <div><strong>Tags:</strong> {blogResult.data.tags.join(", ")}</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* YouTube Video Crawler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Crawl YouTube Video
          </CardTitle>
          <CardDescription>
            Paste a YouTube video URL to crawl metadata and transcript
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-url">YouTube Video URL</Label>
            <div className="flex gap-2">
              <Input
                id="video-url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                disabled={videoLoading}
              />
              <Button
                onClick={crawlVideo}
                disabled={videoLoading}
                className="min-w-[120px]"
              >
                {videoLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Crawling...
                  </>
                ) : (
                  <>
                    <Video className="mr-2 h-4 w-4" />
                    Crawl
                  </>
                )}
              </Button>
            </div>
          </div>

          {videoResult && (
            <Alert variant={videoResult.success ? "default" : "destructive"}>
              {videoResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{videoResult.message}</AlertDescription>
            </Alert>
          )}

          {videoResult?.success && videoResult.data && (
            <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
              <div><strong>Title:</strong> {videoResult.data.title}</div>
              <div><strong>Channel:</strong> {videoResult.data.channel_title || "N/A"}</div>
              <div><strong>Duration:</strong> {videoResult.data.duration || "N/A"}</div>
              <div><strong>Views:</strong> {videoResult.data.view_count?.toLocaleString() || "N/A"}</div>
              <div><strong>Transcript:</strong> {videoResult.data.has_transcript ? "✓ Available" : "✗ Not available"}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* YouTube Playlist Crawler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            Crawl YouTube Playlist
          </CardTitle>
          <CardDescription>
            Paste a YouTube playlist URL to crawl all videos in the playlist
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playlist-url">YouTube Playlist URL</Label>
            <div className="flex gap-2">
              <Input
                id="playlist-url"
                type="url"
                placeholder="https://www.youtube.com/playlist?list=..."
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                disabled={playlistLoading}
              />
              <Button
                onClick={crawlPlaylist}
                disabled={playlistLoading}
                className="min-w-[120px]"
              >
                {playlistLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Crawling...
                  </>
                ) : (
                  <>
                    <List className="mr-2 h-4 w-4" />
                    Crawl
                  </>
                )}
              </Button>
            </div>
          </div>

          {playlistResult && (
            <Alert variant={playlistResult.success ? "default" : "destructive"}>
              {playlistResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{playlistResult.message}</AlertDescription>
            </Alert>
          )}

          {playlistResult?.success && playlistResult.data && (
            <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
              <div><strong>Playlist Title:</strong> {playlistResult.data.playlist_title || "N/A"}</div>
              <div><strong>Videos Crawled:</strong> {playlistResult.data.videoCount || 0}</div>
              <div><strong>Channel:</strong> {playlistResult.data.channel_title || "N/A"}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>Blog Posts:</strong> Copy the full URL from any AWS blog post (e.g., Architecture, DevOps, Security blogs)</p>
          <p>• <strong>Videos:</strong> Copy the URL from a YouTube video page (youtu.be or youtube.com/watch formats supported)</p>
          <p>• <strong>Playlists:</strong> Copy the URL from a YouTube playlist page (must include list= parameter)</p>
          <p>• All crawled content will be automatically processed with AI quality analysis</p>
          <p>• Duplicate URLs will be detected and skipped automatically</p>
        </CardContent>
      </Card>
    </div>
  );
}
