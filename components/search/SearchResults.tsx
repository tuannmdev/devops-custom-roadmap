"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, Video, BookOpen, Calendar, TrendingUp } from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  url: string;
  description: string | null;
  ai_summary: string | null;
  content_type: "blog_post" | "video" | "documentation";
  source: string;
  author: string | null;
  published_date: string;
  difficulty_level: string | null;
  overall_quality_score: number | null;
  technical_depth: number | null;
  practical_value: number | null;
  clarity_score: number | null;
  up_to_dateness: number | null;
  aws_services: string[] | null;
  topics: string[] | null;
  video_duration_seconds: number | null;
  video_views: number | null;
}

interface SearchResultsProps {
  results: SearchResult[];
  isLoading?: boolean;
}

export function SearchResults({ results, isLoading }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-5/6 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No results found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search query or filters
          </p>
        </CardContent>
      </Card>
    );
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "blog_post":
        return <FileText className="h-5 w-5" />;
      case "video":
        return <Video className="h-5 w-5" />;
      case "documentation":
        return <BookOpen className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case "blog_post":
        return "Blog Post";
      case "video":
        return "Video";
      case "documentation":
        return "Documentation";
      default:
        return type;
    }
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

  const getQualityColor = (score: number | null) => {
    if (!score) return "outline";
    if (score >= 0.8) return "default";
    if (score >= 0.6) return "secondary";
    return "outline";
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const formatViews = (views: number | null) => {
    if (!views) return null;
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`;
    }
    return `${views} views`;
  };

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <Card key={result.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {getContentTypeIcon(result.content_type)}
                    <Badge variant="outline">
                      {getContentTypeLabel(result.content_type)}
                    </Badge>
                  </div>
                  {result.difficulty_level && (
                    <Badge variant={getDifficultyColor(result.difficulty_level)}>
                      {result.difficulty_level}
                    </Badge>
                  )}
                  {result.overall_quality_score !== null && (
                    <Badge variant={getQualityColor(result.overall_quality_score)}>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {(result.overall_quality_score * 100).toFixed(0)}%
                    </Badge>
                  )}
                </div>

                <CardTitle className="text-xl">
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    {result.title}
                  </a>
                </CardTitle>

                <CardDescription className="flex items-center gap-4 text-sm">
                  {result.author && <span>{result.author}</span>}
                  {result.published_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(result.published_date).toLocaleDateString()}
                    </span>
                  )}
                  {result.content_type === "video" && result.video_duration_seconds && (
                    <span>{formatDuration(result.video_duration_seconds)}</span>
                  )}
                  {result.content_type === "video" && result.video_views && (
                    <span>{formatViews(result.video_views)}</span>
                  )}
                </CardDescription>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(result.url, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* AI Summary or Description */}
            {result.ai_summary && (
              <p className="text-sm">{result.ai_summary}</p>
            )}
            {!result.ai_summary && result.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {result.description}
              </p>
            )}

            {/* Quality Metrics */}
            {result.overall_quality_score !== null && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {result.technical_depth !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Technical:</span>
                    <span className="font-medium">
                      {(result.technical_depth * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
                {result.practical_value !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Practical:</span>
                    <span className="font-medium">
                      {(result.practical_value * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
                {result.clarity_score !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Clarity:</span>
                    <span className="font-medium">
                      {(result.clarity_score * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
                {result.up_to_dateness !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current:</span>
                    <span className="font-medium">
                      {(result.up_to_dateness * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* AWS Services */}
            {result.aws_services && result.aws_services.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {result.aws_services.slice(0, 8).map((service) => (
                  <Badge key={service} variant="secondary" className="text-xs">
                    {service.toUpperCase()}
                  </Badge>
                ))}
                {result.aws_services.length > 8 && (
                  <Badge variant="secondary" className="text-xs">
                    +{result.aws_services.length - 8} more
                  </Badge>
                )}
              </div>
            )}

            {/* Topics */}
            {result.topics && result.topics.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {result.topics.slice(0, 5).map((topic, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {topic}
                  </Badge>
                ))}
                {result.topics.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{result.topics.length - 5} topics
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
