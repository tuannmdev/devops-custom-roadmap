import { createServerClient } from "@/lib/supabase";
import { notFound, redirect } from "next/navigation";

interface RoadmapLearningPageProps {
  params: Promise<{ roadmapId: string }>;
}

export default async function RoadmapLearningPage({
  params,
}: RoadmapLearningPageProps) {
  const { roadmapId } = await params;
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

  // Get the first incomplete topic or the first topic
  const { data: modules } = await supabase
    .from("modules")
    .select(`
      id,
      topics (
        id,
        order_index
      )
    `)
    .eq("roadmap_id", roadmapId)
    .order("order_index", { ascending: true });

  if (!modules || modules.length === 0) {
    notFound();
  }

  // Find first topic across all modules
  let firstTopicId = null;
  for (const module of modules) {
    if (module.topics && module.topics.length > 0) {
      const sortedTopics = module.topics.sort(
        (a: any, b: any) => a.order_index - b.order_index
      );
      firstTopicId = sortedTopics[0].id;
      break;
    }
  }

  if (!firstTopicId) {
    notFound();
  }

  // Redirect to the first topic
  redirect(`/roadmap/${roadmapId}/topic/${firstTopicId}`);
}
