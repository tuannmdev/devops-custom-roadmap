import { createServerClient } from "@/lib/supabase";
import { notFound, redirect } from "next/navigation";
import { RoadmapSidebar } from "@/components/roadmap/RoadmapSidebar";
import { TopicContent } from "@/components/roadmap/TopicContent";
import { LabSubmissionForm } from "@/components/learning/LabSubmissionForm";
import { SubmissionHistory } from "@/components/learning/SubmissionHistory";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import Link from "next/link";

interface TopicPageProps {
  params: Promise<{ roadmapId: string; topicId: string }>;
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { roadmapId, topicId } = await params;
  const supabase = await createServerClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/signin");
  }

  // Check enrollment
  const { data: enrollment } = await supabase
    .from("user_roadmaps")
    .select("*")
    .eq("user_id", user.id)
    .eq("roadmap_id", roadmapId)
    .single();

  if (!enrollment) {
    redirect(`/roadmaps/${roadmapId}`);
  }

  // Get roadmap details
  const { data: roadmap } = await supabase
    .from("roadmaps")
    .select("id, title, description")
    .eq("id", roadmapId)
    .single();

  if (!roadmap) {
    notFound();
  }

  // Get current topic
  const { data: topic } = await supabase
    .from("topics")
    .select("*")
    .eq("id", topicId)
    .eq("roadmap_id", roadmapId)
    .single();

  if (!topic) {
    notFound();
  }

  // Get topic content
  const { data: content } = await supabase
    .from("learning_content")
    .select("*")
    .eq("topic_id", topicId)
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Get all modules with topics and progress
  const { data: modules } = await supabase
    .from("modules")
    .select(`
      id,
      title,
      description,
      order_index,
      estimated_hours,
      topics (
        id,
        title,
        topic_type,
        estimated_minutes,
        order_index,
        module_id
      )
    `)
    .eq("roadmap_id", roadmapId)
    .order("order_index", { ascending: true });

  // Get user progress for all topics
  const { data: userProgress } = await supabase
    .from("user_progress")
    .select("topic_id, is_completed")
    .eq("user_id", user.id);

  const progressMap = new Map(
    userProgress?.map((p) => [p.topic_id, p.is_completed]) || []
  );

  // Enrich modules with completion status
  const enrichedModules =
    modules?.map((module) => ({
      ...module,
      topics: module.topics.map((t: any) => ({
        ...t,
        is_completed: progressMap.get(t.id) || false,
        is_locked: false, // TODO: Implement sequential locking logic
      })),
    })) || [];

  // Calculate overall progress
  const allTopics = enrichedModules.flatMap((m) => m.topics);
  const completedCount = allTopics.filter((t) => t.is_completed).length;
  const overallProgress =
    allTopics.length > 0 ? Math.round((completedCount / allTopics.length) * 100) : 0;

  // Find previous and next topics
  const findPreviousAndNext = () => {
    for (let i = 0; i < enrichedModules.length; i++) {
      const module = enrichedModules[i];
      const topicIndex = module.topics.findIndex((t) => t.id === topicId);

      if (topicIndex !== -1) {
        // Found current topic
        let previousTopic = null;
        let nextTopic = null;

        // Check for previous topic in same module
        if (topicIndex > 0) {
          previousTopic = module.topics[topicIndex - 1];
        } else if (i > 0) {
          // Check previous module
          const prevModule = enrichedModules[i - 1];
          if (prevModule.topics.length > 0) {
            previousTopic = prevModule.topics[prevModule.topics.length - 1];
          }
        }

        // Check for next topic in same module
        if (topicIndex < module.topics.length - 1) {
          nextTopic = module.topics[topicIndex + 1];
        } else if (i < enrichedModules.length - 1) {
          // Check next module
          const nextModule = enrichedModules[i + 1];
          if (nextModule.topics.length > 0) {
            nextTopic = nextModule.topics[0];
          }
        }

        return { previousTopic, nextTopic };
      }
    }
    return { previousTopic: null, nextTopic: null };
  };

  const { previousTopic, nextTopic } = findPreviousAndNext();

  // Check if current topic is completed
  const isCompleted = progressMap.get(topicId) || false;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <RoadmapSidebar
        roadmapId={roadmapId}
        roadmapTitle={roadmap.title}
        modules={enrichedModules}
        progress={overallProgress}
        currentTopicId={topicId}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-8">
          {/* Tabs */}
          <Tabs defaultValue="content" className="space-y-6">
            <TabsList>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="lab">Lab Submission</TabsTrigger>
            </TabsList>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-6">
              {/* Topic Content */}
              <TopicContent topic={topic} content={content} />
            </TabsContent>

            {/* Lab Tab */}
            <TabsContent value="lab" className="space-y-6">
              <LabSubmissionForm topicId={topicId} />
              <SubmissionHistory topicId={topicId} />
            </TabsContent>
          </Tabs>

          {/* Navigation Actions */}
          <div className="mt-8 flex items-center justify-between border-t pt-6">
            <div>
              {previousTopic ? (
                <Link href={`/roadmap/${roadmapId}/topic/${previousTopic.id}`}>
                  <Button variant="outline">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous: {previousTopic.title}
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" disabled>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>

            <form action={`/api/progress/complete`} method="POST">
              <input type="hidden" name="topicId" value={topicId} />
              <input type="hidden" name="roadmapId" value={roadmapId} />
              <Button
                type="submit"
                variant={isCompleted ? "secondary" : "default"}
                disabled={isCompleted}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Completed
                  </>
                ) : (
                  "Mark as Complete"
                )}
              </Button>
            </form>

            <div>
              {nextTopic ? (
                <Link href={`/roadmap/${roadmapId}/topic/${nextTopic.id}`}>
                  <Button>
                    Next: {nextTopic.title}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Button disabled>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
