import { createServerClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, BookOpen, Target, Award, ChevronRight } from "lucide-react";
import { EnrollButton } from "@/components/roadmap/EnrollButton";

interface RoadmapDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RoadmapDetailPage({ params }: RoadmapDetailPageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  // Fetch roadmap details
  const { data: roadmap, error } = await supabase
    .from("roadmaps")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (error || !roadmap) {
    notFound();
  }

  // Fetch modules with topics
  const { data: modules } = await supabase
    .from("modules")
    .select(`
      *,
      topics (
        id,
        title,
        description,
        order_index,
        topic_type,
        difficulty_level,
        estimated_minutes
      )
    `)
    .eq("roadmap_id", id)
    .order("order_index", { ascending: true });

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user is enrolled
  let enrollment = null;
  if (user) {
    const { data } = await supabase
      .from("user_roadmaps")
      .select("*")
      .eq("user_id", user.id)
      .eq("roadmap_id", id)
      .single();

    enrollment = data;
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "foundation-1":
        return "success";
      case "foundation-2":
        return "info";
      case "advanced":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-4">
            <Link
              href="/roadmaps"
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
            >
              <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
              Back to Roadmaps
            </Link>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge variant={getDifficultyColor(roadmap.difficulty_level)}>
                  {roadmap.difficulty_level}
                </Badge>
                {roadmap.is_featured && <Badge variant="secondary">Featured</Badge>}
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                {roadmap.title}
              </h1>

              <p className="text-xl text-gray-600 mb-6">{roadmap.description}</p>

              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-2" />
                  <span>
                    {roadmap.estimated_weeks} weeks • {roadmap.estimated_hours} hours
                  </span>
                </div>

                <div className="flex items-center text-gray-600">
                  <BookOpen className="w-5 h-5 mr-2" />
                  <span>
                    {roadmap.total_modules} modules • {roadmap.total_topics} topics
                  </span>
                </div>

                {roadmap.total_enrollments > 0 && (
                  <div className="flex items-center text-gray-600">
                    <Award className="w-5 h-5 mr-2" />
                    <span>{roadmap.total_enrollments} students enrolled</span>
                  </div>
                )}
              </div>
            </div>

            {/* Enroll Button */}
            <div className="ml-6">
              {user ? (
                <div className="space-y-3">
                  {enrollment && (
                    <>
                      <Badge className="bg-green-100 text-green-800 px-4 py-2">
                        Enrolled
                      </Badge>
                      <div className="text-sm text-gray-600">
                        Progress: {enrollment.progress_percentage}%
                      </div>
                    </>
                  )}
                  <EnrollButton roadmapId={id} isEnrolled={!!enrollment} />
                </div>
              ) : (
                <Link href="/signin">
                  <Button size="lg">Sign In to Enroll</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Long Description */}
            {roadmap.long_description && (
              <Card>
                <CardHeader>
                  <CardTitle>About This Roadmap</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-line">
                    {roadmap.long_description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Learning Objectives */}
            {roadmap.learning_objectives && roadmap.learning_objectives.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    What You&apos;ll Learn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {roadmap.learning_objectives.map((objective: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="text-gray-700">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Modules Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Course Curriculum</CardTitle>
                <CardDescription>
                  {roadmap.total_modules} modules • {roadmap.total_topics} topics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {modules?.map((module: any, index: number) => (
                    <div
                      key={module.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg">
                          Module {index + 1}: {module.title}
                        </h3>
                        {module.estimated_hours && (
                          <Badge variant="outline">
                            {module.estimated_hours}h
                          </Badge>
                        )}
                      </div>

                      {module.description && (
                        <p className="text-gray-600 text-sm mb-3">
                          {module.description}
                        </p>
                      )}

                      {/* Topics List */}
                      {module.topics && module.topics.length > 0 && (
                        <div className="space-y-1 mt-3 pl-4 border-l-2 border-gray-200">
                          {module.topics
                            .sort((a: any, b: any) => a.order_index - b.order_index)
                            .map((topic: any) => (
                              <div
                                key={topic.id}
                                className="text-sm text-gray-600 flex items-center justify-between py-1"
                              >
                                <span className="flex items-center">
                                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2" />
                                  {topic.title}
                                </span>
                                {topic.estimated_minutes && (
                                  <span className="text-xs text-gray-400">
                                    {topic.estimated_minutes}min
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Prerequisites */}
            {roadmap.prerequisites && roadmap.prerequisites.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Prerequisites</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {roadmap.prerequisites.map((prereq: string, index: number) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start">
                        <span className="text-gray-400 mr-2">•</span>
                        {prereq}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Career Outcomes */}
            {roadmap.career_outcomes && roadmap.career_outcomes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Career Outcomes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    After completing this roadmap, you&apos;ll be ready for:
                  </p>
                  <ul className="space-y-2">
                    {roadmap.career_outcomes.map((outcome: string, index: number) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start">
                        <Award className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                        {outcome}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
