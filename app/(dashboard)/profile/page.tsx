import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Flame, BookOpen, Target } from "lucide-react";

export const metadata = {
  title: "Profile - DevOps Learning Platform",
  description: "Manage your profile and settings",
};

export default async function ProfilePage() {
  const supabase = await createServerClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/signin?redirectTo=/profile");
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Fetch enrolled roadmaps with progress
  const { data: enrolledRoadmaps } = await supabase
    .from("user_roadmaps")
    .select(`
      *,
      roadmaps (
        id,
        title,
        difficulty_level,
        estimated_hours
      )
    `)
    .eq("user_id", user.id)
    .order("last_accessed", { ascending: false });

  // Fetch achievements
  const { data: achievements } = await supabase
    .from("user_achievements")
    .select("*")
    .eq("user_id", user.id)
    .order("earned_at", { ascending: false });

  // Fetch completed topics count
  const { count: completedTopicsCount } = await supabase
    .from("user_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_completed", true);

  // Calculate experience level
  const totalXP = profile?.total_xp || 0;
  const level = Math.floor(totalXP / 1000) + 1;
  const xpForNextLevel = level * 1000;
  const xpInCurrentLevel = totalXP % 1000;
  const progressToNextLevel = (xpInCurrentLevel / 1000) * 100;

  return (
    <div className="container mx-auto py-8 px-4">
      <ProfileHeader
        user={user}
        profile={profile}
        level={level}
        progressToNextLevel={progressToNextLevel}
      />

      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Stats Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalXP.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {(1000 - xpInCurrentLevel).toLocaleString()} XP to level {level + 1}
            </p>
            <Progress value={progressToNextLevel} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.current_streak || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Longest: {profile?.longest_streak || 0} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Topics Completed</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTopicsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {enrolledRoadmaps?.length || 0} roadmaps
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Goal</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.daily_goal_minutes || 30}</div>
            <p className="text-xs text-muted-foreground mt-1">minutes per day</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mt-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ProfileStats
              profile={profile}
              enrolledRoadmaps={enrolledRoadmaps}
              completedTopicsCount={completedTopicsCount || 0}
            />
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Enrolled Roadmaps</CardTitle>
                <CardDescription>
                  Track your progress across all learning paths
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {enrolledRoadmaps && enrolledRoadmaps.length > 0 ? (
                  enrolledRoadmaps.map((enrollment: any) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold">{enrollment.roadmaps?.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{enrollment.roadmaps?.difficulty_level}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {enrollment.roadmaps?.estimated_hours}h
                          </span>
                        </div>
                        <div className="mt-2">
                          <Progress value={enrollment.progress_percentage} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {enrollment.progress_percentage}% complete
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No enrolled roadmaps yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>
                  Badges and milestones you've earned
                </CardDescription>
              </CardHeader>
              <CardContent>
                {achievements && achievements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {achievements.map((achievement: any) => (
                      <div
                        key={achievement.id}
                        className="flex items-center gap-4 p-4 border rounded-lg"
                      >
                        <div className="text-3xl">{achievement.icon || "🏆"}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{achievement.achievement_type}</h4>
                          <p className="text-xs text-muted-foreground">
                            {new Date(achievement.earned_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No achievements yet - keep learning!
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <ProfileSettings user={user} profile={profile} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
