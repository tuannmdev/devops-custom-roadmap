import { createServerClient } from "@/lib/supabase";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, BookOpen, Trophy } from "lucide-react";

export const metadata = {
  title: "Browse Roadmaps - DevOps Learning Platform",
  description: "Explore our comprehensive DevOps learning roadmaps",
};

export default async function RoadmapsPage() {
  const supabase = await createServerClient();

  // Fetch all published roadmaps
  const { data: roadmaps } = await supabase
    .from("roadmaps")
    .select("*")
    .eq("is_published", true)
    .order("difficulty_level", { ascending: true });

  // Get current user to check enrollment status
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in, fetch their enrollments
  let enrolledRoadmapIds: string[] = [];
  if (user) {
    const { data: enrollments } = await supabase
      .from("user_roadmaps")
      .select("roadmap_id")
      .eq("user_id", user.id);

    enrolledRoadmapIds = enrollments?.map((e) => e.roadmap_id) || [];
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "foundation-1":
        return "bg-green-100 text-green-800";
      case "foundation-2":
        return "bg-blue-100 text-blue-800";
      case "advanced":
        return "bg-orange-100 text-orange-800";
      case "expert":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case "foundation-1":
        return "Foundation Level 1";
      case "foundation-2":
        return "Foundation Level 2";
      default:
        return level.charAt(0).toUpperCase() + level.slice(1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Learning Roadmaps</h1>
              <p className="text-gray-600 mt-2">
                Choose your path and start your DevOps learning journey
              </p>
            </div>
            {user && (
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Back to Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Roadmaps Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {roadmaps && roadmaps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmaps.map((roadmap: any) => {
              const isEnrolled = enrolledRoadmapIds.includes(roadmap.id);

              return (
                <Card key={roadmap.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={getDifficultyColor(roadmap.difficulty_level)}>
                        {getDifficultyLabel(roadmap.difficulty_level)}
                      </Badge>
                      {roadmap.is_featured && (
                        <Badge variant="secondary">Featured</Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">{roadmap.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {roadmap.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-grow flex flex-col justify-between">
                    <div className="space-y-3 mb-4">
                      {/* Stats */}
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {roadmap.estimated_weeks} weeks • {roadmap.estimated_hours} hours
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <BookOpen className="w-4 h-4 mr-2" />
                        {roadmap.total_modules} modules • {roadmap.total_topics} topics
                      </div>

                      {roadmap.total_enrollments > 0 && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Trophy className="w-4 h-4 mr-2" />
                          {roadmap.total_enrollments} students enrolled
                        </div>
                      )}
                    </div>

                    {/* CTA Button */}
                    <div className="mt-auto">
                      <Link
                        href={`/roadmaps/${roadmap.id}`}
                        className={`block w-full text-center px-4 py-2 rounded-md font-medium transition-colors ${
                          isEnrolled
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {isEnrolled ? "Continue Learning" : "View Details"}
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No roadmaps available yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
