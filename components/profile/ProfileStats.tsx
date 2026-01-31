import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, TrendingUp } from "lucide-react";

interface ProfileStatsProps {
  profile: any;
  enrolledRoadmaps: any[];
  completedTopicsCount: number;
}

export function ProfileStats({
  profile,
  enrolledRoadmaps,
  completedTopicsCount,
}: ProfileStatsProps) {
  const activeRoadmaps = enrolledRoadmaps?.filter(
    (r: any) => r.status === "active"
  ).length || 0;

  const completedRoadmaps = enrolledRoadmaps?.filter(
    (r: any) => r.status === "completed"
  ).length || 0;

  const averageProgress =
    enrolledRoadmaps && enrolledRoadmaps.length > 0
      ? enrolledRoadmaps.reduce((sum: number, r: any) => sum + (r.progress_percentage || 0), 0) /
        enrolledRoadmaps.length
      : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Learning Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Learning Stats
          </CardTitle>
          <CardDescription>Your learning journey overview</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Active Roadmaps</span>
            <span className="text-2xl font-bold">{activeRoadmaps}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Completed Roadmaps</span>
            <span className="text-2xl font-bold">{completedRoadmaps}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Topics Completed</span>
            <span className="text-2xl font-bold">{completedTopicsCount}</span>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Average Progress</span>
              <span className="text-sm text-muted-foreground">
                {averageProgress.toFixed(0)}%
              </span>
            </div>
            <Progress value={averageProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Gamification Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Achievements
          </CardTitle>
          <CardDescription>Your gaming progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total XP</span>
            <span className="text-2xl font-bold">{(profile?.total_xp || 0).toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Current Streak</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{profile?.current_streak || 0}</span>
              <Badge variant="secondary" className="gap-1">
                🔥
              </Badge>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Longest Streak</span>
            <span className="text-2xl font-bold">{profile?.longest_streak || 0}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Last Active</span>
            <span className="text-sm font-medium">
              {profile?.last_active_at
                ? new Date(profile.last_active_at).toLocaleDateString()
                : "Never"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Learning Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Learning Goals
          </CardTitle>
          <CardDescription>Your daily learning targets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Daily Goal</span>
            <span className="text-2xl font-bold">{profile?.daily_goal_minutes || 30} min</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Timezone</span>
            <span className="text-sm font-medium">{profile?.timezone || "UTC"}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Preferred Language</span>
            <span className="text-sm font-medium">{profile?.preferred_language || "English"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Roadmaps</CardTitle>
          <CardDescription>Your recently accessed learning paths</CardDescription>
        </CardHeader>
        <CardContent>
          {enrolledRoadmaps && enrolledRoadmaps.length > 0 ? (
            <div className="space-y-3">
              {enrolledRoadmaps.slice(0, 3).map((enrollment: any) => (
                <div key={enrollment.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{enrollment.roadmaps?.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {enrollment.progress_percentage}% complete
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {enrollment.roadmaps?.difficulty_level}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No recent activity
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
