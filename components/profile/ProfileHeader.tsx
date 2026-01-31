"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Upload, Mail, Calendar } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface ProfileHeaderProps {
  user: User;
  profile: any;
  level: number;
  progressToNextLevel: number;
}

export function ProfileHeader({ user, profile, level, progressToNextLevel }: ProfileHeaderProps) {
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be less than 2MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("File must be an image");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setAvatarUrl(data.avatarUrl);
        // Refresh page to update avatar everywhere
        window.location.reload();
      } else {
        alert(data.error || "Failed to upload avatar");
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      alert("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = () => {
    const name = profile?.full_name || user.email || "User";
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getLevelColor = () => {
    if (level >= 10) return "from-purple-500 to-pink-500";
    if (level >= 5) return "from-blue-500 to-cyan-500";
    return "from-green-500 to-emerald-500";
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="relative group">
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
              <AvatarImage src={avatarUrl} alt={profile?.full_name || user.email || ""} />
              <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/20 to-primary/40">
                {getInitials()}
              </AvatarFallback>
            </Avatar>

            {/* Upload overlay */}
            <label
              htmlFor="avatar-upload"
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {isUploading ? (
                <div className="text-white text-sm">Uploading...</div>
              ) : (
                <Upload className="h-8 w-8 text-white" />
              )}
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={isUploading}
              />
            </label>

            {/* Level Badge */}
            <div
              className={`absolute -bottom-2 -right-2 bg-gradient-to-r ${getLevelColor()} text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg`}
            >
              Lv {level}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold">
              {profile?.full_name || "User"}
            </h1>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-2 mt-2 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{user.email}</span>
              </div>
              {profile?.created_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    Joined {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Level Progress */}
            <div className="mt-4 max-w-md">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium">Level {level}</span>
                <span className="text-muted-foreground">
                  {progressToNextLevel.toFixed(0)}% to Level {level + 1}
                </span>
              </div>
              <Progress value={progressToNextLevel} className="h-3" />
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
              {profile?.role === "admin" && (
                <Badge variant="destructive" className="gap-1">
                  🛡️ Admin
                </Badge>
              )}
              {(profile?.current_streak || 0) >= 7 && (
                <Badge variant="secondary" className="gap-1">
                  🔥 On Fire ({profile.current_streak} days)
                </Badge>
              )}
              {(profile?.total_xp || 0) >= 5000 && (
                <Badge variant="secondary" className="gap-1">
                  ⭐ Expert Learner
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
