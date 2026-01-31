"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface EnrollButtonProps {
  roadmapId: string;
  isEnrolled: boolean;
}

export function EnrollButton({ roadmapId, isEnrolled }: EnrollButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleEnroll = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/roadmaps/${roadmapId}/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to enroll");
      }

      // Success - redirect to the learning interface
      router.push(`/roadmap/${roadmapId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    router.push(`/roadmap/${roadmapId}`);
  };

  if (isEnrolled) {
    return (
      <Button size="lg" onClick={handleContinue}>
        Continue Learning
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        onClick={handleEnroll}
        disabled={isLoading}
        className="w-full sm:w-auto"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enrolling...
          </>
        ) : (
          "Enroll Now"
        )}
      </Button>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
