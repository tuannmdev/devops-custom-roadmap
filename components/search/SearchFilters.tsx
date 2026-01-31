"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

const CONTENT_TYPES = [
  { value: "all", label: "All Types" },
  { value: "blog_post", label: "Blog Posts" },
  { value: "video", label: "Videos" },
  { value: "documentation", label: "Documentation" },
];

const DIFFICULTY_LEVELS = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const AWS_SERVICES = [
  "ec2",
  "s3",
  "lambda",
  "rds",
  "dynamodb",
  "ecs",
  "eks",
  "vpc",
  "cloudformation",
  "cloudwatch",
  "iam",
  "api-gateway",
  "sns",
  "sqs",
  "route53",
];

export function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(true);

  const currentType = searchParams.get("type") || "all";
  const currentDifficulty = searchParams.get("difficulty") || "all";
  const currentServices = searchParams.get("services")?.split(",").filter(Boolean) || [];
  const currentMinQuality = searchParams.get("minQuality") || "";
  const currentQuery = searchParams.get("q") || "";

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change
    params.delete("page");

    router.push(`/search?${params.toString()}`);
  };

  const toggleService = (service: string) => {
    const services = currentServices.includes(service)
      ? currentServices.filter((s) => s !== service)
      : [...currentServices, service];

    updateFilters({
      services: services.length > 0 ? services.join(",") : null,
    });
  };

  const clearAllFilters = () => {
    router.push(`/search${currentQuery ? `?q=${encodeURIComponent(currentQuery)}` : ""}`);
  };

  const hasActiveFilters =
    currentType !== "all" ||
    currentDifficulty !== "all" ||
    currentServices.length > 0 ||
    currentMinQuality !== "";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <SlidersHorizontal className="h-5 w-5" />
            Filters
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Collapse" : "Expand"}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Content Type */}
          <div className="space-y-2">
            <Label htmlFor="content-type">Content Type</Label>
            <Select
              value={currentType}
              onValueChange={(value) => updateFilters({ type: value })}
            >
              <SelectTrigger id="content-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty Level */}
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select
              value={currentDifficulty}
              onValueChange={(value) => updateFilters({ difficulty: value })}
            >
              <SelectTrigger id="difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTY_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Min Quality Score */}
          <div className="space-y-2">
            <Label htmlFor="min-quality">
              Min Quality Score
              {currentMinQuality && (
                <span className="ml-2 text-muted-foreground">
                  ({(parseFloat(currentMinQuality) * 100).toFixed(0)}%)
                </span>
              )}
            </Label>
            <Input
              id="min-quality"
              type="number"
              min="0"
              max="1"
              step="0.1"
              placeholder="0.0 - 1.0"
              value={currentMinQuality}
              onChange={(e) =>
                updateFilters({ minQuality: e.target.value || null })
              }
            />
          </div>

          {/* AWS Services */}
          <div className="space-y-2">
            <Label>AWS Services</Label>
            <div className="flex flex-wrap gap-2">
              {AWS_SERVICES.map((service) => (
                <Badge
                  key={service}
                  variant={
                    currentServices.includes(service) ? "default" : "outline"
                  }
                  className="cursor-pointer hover:bg-primary/90"
                  onClick={() => toggleService(service)}
                >
                  {service.toUpperCase()}
                  {currentServices.includes(service) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground mb-2">
                Active Filters:
              </div>
              <div className="flex flex-wrap gap-2">
                {currentType !== "all" && (
                  <Badge variant="secondary">
                    Type: {CONTENT_TYPES.find((t) => t.value === currentType)?.label}
                  </Badge>
                )}
                {currentDifficulty !== "all" && (
                  <Badge variant="secondary">
                    Difficulty: {DIFFICULTY_LEVELS.find((d) => d.value === currentDifficulty)?.label}
                  </Badge>
                )}
                {currentMinQuality && (
                  <Badge variant="secondary">
                    Min Quality: {(parseFloat(currentMinQuality) * 100).toFixed(0)}%
                  </Badge>
                )}
                {currentServices.length > 0 && (
                  <Badge variant="secondary">
                    {currentServices.length} service{currentServices.length > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
