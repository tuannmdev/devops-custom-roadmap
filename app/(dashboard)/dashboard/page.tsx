import { createServerClient } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Dashboard - DevOps Learning Platform",
  description: "Your DevOps learning dashboard",
};

export default async function DashboardPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  // Fetch enrolled roadmaps
  const { data: enrolledRoadmaps } = await supabase
    .from("user_roadmaps")
    .select(`
      *,
      roadmaps (
        id,
        title,
        description,
        difficulty_level,
        total_topics
      )
    `)
    .eq("user_id", user?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {profile?.username || "Learner"}!
        </h1>
        <p className="text-gray-600 mt-2">
          Continue your DevOps learning journey
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total XP</CardDescription>
            <CardTitle className="text-3xl">{profile?.total_xp || 0}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Streak</CardDescription>
            <CardTitle className="text-3xl">{profile?.current_streak || 0} days</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Enrolled Roadmaps</CardDescription>
            <CardTitle className="text-3xl">{enrolledRoadmaps?.length || 0}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Experience Level</CardDescription>
            <CardTitle className="text-xl capitalize">
              {profile?.experience_level || "Beginner"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Enrolled Roadmaps */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Your Roadmaps</h2>
        {enrolledRoadmaps && enrolledRoadmaps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledRoadmaps.map((enrollment: any) => (
              <Card key={enrollment.id}>
                <CardHeader>
                  <CardTitle>{enrollment.roadmaps.title}</CardTitle>
                  <CardDescription>
                    {enrollment.roadmaps.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">
                        {enrollment.progress_percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${enrollment.progress_percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>
                        {enrollment.completed_topics} / {enrollment.total_topics} topics
                      </span>
                      <span className="capitalize">{enrollment.status}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-gray-500">
                <p className="mb-4">You haven&apos;t enrolled in any roadmaps yet.</p>
                <a
                  href="/roadmaps"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Browse Roadmaps
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
