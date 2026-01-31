"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface ProfileSettingsProps {
  user: User;
  profile: any;
}

export function ProfileSettings({ user, profile }: ProfileSettingsProps) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    daily_goal_minutes: profile?.daily_goal_minutes || 30,
    timezone: profile?.timezone || "Asia/Ho_Chi_Minh",
    preferred_language: profile?.preferred_language || "en",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setError(data.error || "Failed to update profile");
      }
    } catch (err) {
      setError("Failed to update profile");
      console.error("Profile update error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                type="text"
                placeholder="Enter your full name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) =>
                  setFormData({ ...formData, timezone: value })
                }
              >
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Ho_Chi_Minh">Asia/Ho Chi Minh (UTC+7)</SelectItem>
                  <SelectItem value="Asia/Singapore">Asia/Singapore (UTC+8)</SelectItem>
                  <SelectItem value="Asia/Bangkok">Asia/Bangkok (UTC+7)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Asia/Tokyo (UTC+9)</SelectItem>
                  <SelectItem value="UTC">UTC (UTC+0)</SelectItem>
                  <SelectItem value="America/New_York">America/New York (UTC-5)</SelectItem>
                  <SelectItem value="America/Los_Angeles">America/Los Angeles (UTC-8)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (UTC+0)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Preferred Language</Label>
              <Select
                value={formData.preferred_language}
                onValueChange={(value) =>
                  setFormData({ ...formData, preferred_language: value })
                }
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="vi">Tiếng Việt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  Profile updated successfully!
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Learning Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Preferences</CardTitle>
          <CardDescription>Customize your learning experience</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="daily-goal">Daily Learning Goal (minutes)</Label>
              <Input
                id="daily-goal"
                type="number"
                min="10"
                max="480"
                step="5"
                value={formData.daily_goal_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    daily_goal_minutes: parseInt(e.target.value) || 30,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Set a daily learning goal to build consistency (10-480 minutes)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Recommended Goals</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFormData({ ...formData, daily_goal_minutes: 30 })
                  }
                >
                  30 min
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFormData({ ...formData, daily_goal_minutes: 60 })
                  }
                >
                  1 hour
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFormData({ ...formData, daily_goal_minutes: 120 })
                  }
                >
                  2 hours
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Gamification</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Earn XP by completing topics, maintaining streaks, and achieving milestones
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Complete a topic:</span>
                  <span className="font-medium">+50 XP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">7-day streak:</span>
                  <span className="font-medium">+100 XP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Complete a module:</span>
                  <span className="font-medium">+200 XP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Complete a roadmap:</span>
                  <span className="font-medium">+500 XP</span>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Preferences
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
