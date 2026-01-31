"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Lock, BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Topic {
  id: string;
  title: string;
  topic_type: string;
  estimated_minutes: number;
  is_completed?: boolean;
  is_locked?: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  estimated_hours: number;
  topics: Topic[];
}

interface RoadmapSidebarProps {
  roadmapId: string;
  roadmapTitle: string;
  modules: Module[];
  progress: number;
  currentTopicId?: string;
}

export function RoadmapSidebar({
  roadmapId,
  roadmapTitle,
  modules,
  progress,
  currentTopicId,
}: RoadmapSidebarProps) {
  const pathname = usePathname();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(modules.map((m) => m.id))
  );

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const getTopicTypeColor = (type: string) => {
    switch (type) {
      case "lesson":
        return "info";
      case "lab":
        return "warning";
      case "quiz":
        return "secondary";
      case "project":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <div className="w-80 bg-white border-r h-screen overflow-y-auto sticky top-0">
      <div className="p-6 border-b">
        <Link
          href="/dashboard"
          className="text-sm text-gray-600 hover:text-gray-900 mb-3 inline-block"
        >
          ← Back to Dashboard
        </Link>
        <h2 className="font-semibold text-lg mb-3">{roadmapTitle}</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Overall Progress</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="p-4">
        <div className="space-y-2">
          {modules
            .sort((a, b) => a.order_index - b.order_index)
            .map((module, moduleIndex) => {
              const isExpanded = expandedModules.has(module.id);
              const completedTopics = module.topics.filter((t) => t.is_completed).length;
              const totalTopics = module.topics.length;
              const moduleProgress =
                totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

              return (
                <div key={module.id} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 text-left">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="font-medium text-sm">
                        {moduleIndex + 1}. {module.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {completedTopics}/{totalTopics}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-2 bg-white">
                      {module.topics
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((topic, topicIndex) => {
                          const isActive = currentTopicId === topic.id;
                          const isLocked = topic.is_locked;

                          return (
                            <Link
                              key={topic.id}
                              href={
                                isLocked
                                  ? "#"
                                  : `/roadmap/${roadmapId}/topic/${topic.id}`
                              }
                              className={cn(
                                "block px-3 py-2 rounded-md text-sm transition-colors",
                                isActive &&
                                  "bg-blue-50 text-blue-700 font-medium",
                                !isActive &&
                                  !isLocked &&
                                  "text-gray-700 hover:bg-gray-50",
                                isLocked &&
                                  "text-gray-400 cursor-not-allowed opacity-50"
                              )}
                              onClick={(e) => {
                                if (isLocked) e.preventDefault();
                              }}
                            >
                              <div className="flex items-start gap-2">
                                <div className="flex-shrink-0 mt-0.5">
                                  {topic.is_completed ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  ) : isLocked ? (
                                    <Lock className="w-4 h-4" />
                                  ) : (
                                    <Circle className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="truncate">{topic.title}</span>
                                    <Badge
                                      variant={getTopicTypeColor(topic.topic_type)}
                                      className="text-xs flex-shrink-0"
                                    >
                                      {topic.topic_type}
                                    </Badge>
                                  </div>
                                  {topic.estimated_minutes && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {topic.estimated_minutes} min
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
