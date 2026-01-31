"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ExternalLink, FileText, Video, BookOpen, Filter, RefreshCw } from "lucide-react";

interface AWSContent {
  id: string;
  title: string;
  url: string;
  content_type: "blog_post" | "video" | "documentation";
  source: string;
  published_date: string;
  is_processed: boolean;
  overall_quality_score: number | null;
  difficulty_level: string | null;
  technical_depth: number | null;
  practical_value: number | null;
  clarity_score: number | null;
  up_to_dateness: number | null;
  ai_summary: string | null;
  aws_services: string[] | null;
  topics: string[] | null;
  created_at: string;
}

export function CrawledContentReview() {
  const [content, setContent] = useState<AWSContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    contentType: "all",
    processedStatus: "all",
    minQuality: "",
    search: "",
  });

  const fetchContent = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.contentType !== "all") params.append("type", filters.contentType);
      if (filters.processedStatus !== "all") params.append("processed", filters.processedStatus);
      if (filters.minQuality) params.append("minQuality", filters.minQuality);
      if (filters.search) params.append("search", filters.search);

      const response = await fetch(`/api/admin/content/latest?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setContent(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch content:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "blog_post":
        return <FileText className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "documentation":
        return <BookOpen className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getQualityColor = (score: number | null) => {
    if (!score) return "secondary";
    if (score >= 0.8) return "default"; // green
    if (score >= 0.6) return "secondary"; // yellow
    return "destructive"; // red
  };

  const getDifficultyColor = (level: string | null) => {
    switch (level) {
      case "beginner":
        return "default";
      case "intermediate":
        return "secondary";
      case "advanced":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="content-type">Content Type</Label>
              <Select
                value={filters.contentType}
                onValueChange={(value) => setFilters({ ...filters, contentType: value })}
              >
                <SelectTrigger id="content-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="blog_post">Blog Posts</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="processed-status">Processing Status</Label>
              <Select
                value={filters.processedStatus}
                onValueChange={(value) => setFilters({ ...filters, processedStatus: value })}
              >
                <SelectTrigger id="processed-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Processed</SelectItem>
                  <SelectItem value="false">Unprocessed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min-quality">Min Quality Score</Label>
              <Input
                id="min-quality"
                type="number"
                min="0"
                max="1"
                step="0.1"
                placeholder="0.0 - 1.0"
                value={filters.minQuality}
                onChange={(e) => setFilters({ ...filters, minQuality: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                type="text"
                placeholder="Search title..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={fetchContent} size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
            <Button
              onClick={() => {
                setFilters({
                  contentType: "all",
                  processedStatus: "all",
                  minQuality: "",
                  search: "",
                });
              }}
              variant="outline"
              size="sm"
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Crawled Content</CardTitle>
          <CardDescription>
            {content.length} items found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : content.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No content found. Try adjusting your filters or run a crawl operation.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead className="min-w-[300px]">Title</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {content.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getContentTypeIcon(item.content_type)}
                          <span className="text-xs">{item.content_type.replace("_", " ")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium line-clamp-2">{item.title}</div>
                          {item.ai_summary && (
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {item.ai_summary}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.source}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(item.published_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {item.is_processed && item.overall_quality_score !== null ? (
                          <div className="space-y-1">
                            <Badge variant={getQualityColor(item.overall_quality_score)}>
                              {(item.overall_quality_score * 100).toFixed(0)}%
                            </Badge>
                            <div className="text-xs text-muted-foreground space-y-0.5">
                              <div>Tech: {item.technical_depth?.toFixed(2) || "N/A"}</div>
                              <div>Practical: {item.practical_value?.toFixed(2) || "N/A"}</div>
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline">Not processed</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.difficulty_level ? (
                          <Badge variant={getDifficultyColor(item.difficulty_level)}>
                            {item.difficulty_level}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.aws_services && item.aws_services.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.aws_services.slice(0, 3).map((service) => (
                              <Badge key={service} variant="secondary" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                            {item.aws_services.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{item.aws_services.length - 3}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(item.url, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
