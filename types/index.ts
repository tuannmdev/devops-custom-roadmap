// Core application types

export interface UserProfile {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  email: string | null;
  experienceLevel: "beginner" | "intermediate" | "advanced";
  currentPosition: string | null;
  yearsOfExperience: number;
  programmingLanguages: string[];
  learningStyle: string | null;
  dailyGoalMinutes: number;
  timezone: string;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
  isActive: boolean;
}

export interface Roadmap {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  longDescription: string | null;
  difficultyLevel: "foundation-1" | "foundation-2" | "advanced" | "expert";
  category: string | null;
  subcategory: string | null;
  estimatedWeeks: number | null;
  estimatedHours: number | null;
  prerequisites: string[];
  learningObjectives: string[];
  careerOutcomes: string[];
  totalModules: number;
  totalTopics: number;
  isPublished: boolean;
  isFeatured: boolean;
  createdBy: string | null;
  coverImage: string | null;
  totalEnrollments: number;
  averageCompletionRate: number;
  averageRating: number;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  roadmapId: string;
  title: string;
  description: string | null;
  learningObjectives: string[];
  orderIndex: number;
  estimatedHours: number | null;
  prerequisites: string[];
  requiredSkills: string[];
  moduleType: "standard" | "project" | "assessment";
  createdAt: string;
}

export interface Topic {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  topicType: "theory" | "practice" | "project" | "quiz" | "lab";
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number | null;
  hasPrerequisites: boolean;
  prerequisiteTopics: string[];
  hasLab: boolean;
  hasQuiz: boolean;
  hasSubmission: boolean;
  createdAt: string;
}

export interface LearningContent {
  id: string;
  topicId: string;
  contentType: "article" | "video" | "tutorial" | "lab" | "quiz";
  title: string;
  content: string | null;
  externalUrl: string | null;
  videoUrl: string | null;
  videoDuration: number | null;
  fileAttachments: any;
  practiceRequirements: any;
  deliverables: string[];
  quizQuestions: any;
  contentSource: string | null;
  sourceUrl: string | null;
  lastUpdated: string;
  createdAt: string;
}

export interface UserRoadmap {
  id: string;
  userId: string;
  roadmapId: string;
  status: "enrolled" | "in_progress" | "completed" | "paused";
  enrolledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  pausedAt: string | null;
  currentModuleId: string | null;
  currentTopicId: string | null;
  progressPercentage: number;
  totalTopics: number;
  completedTopics: number;
  totalTimeMinutes: number;
  targetCompletionDate: string | null;
  dailyTimeGoal: number;
}

export interface UserProgress {
  id: string;
  userId: string;
  topicId: string;
  status: "not_started" | "in_progress" | "completed" | "skipped";
  startedAt: string | null;
  completedAt: string | null;
  lastAccessed: string;
  timeSpentMinutes: number;
  estimatedTimeMinutes: number | null;
  attempts: number;
  score: number | null;
  maxScore: number | null;
  personalNotes: string | null;
  bookmarked: boolean;
  difficultyRating: number | null;
}

export interface Achievement {
  id: string;
  userId: string;
  achievementType: string;
  achievementName: string;
  description: string | null;
  achievedAt: string;
  metadata: any;
  xpAwarded: number;
  badgeIcon: string | null;
  badgeColor: string | null;
  isVisible: boolean;
  isFeatured: boolean;
}

export interface DashboardStats {
  totalXp: number;
  currentStreak: number;
  completedTopics: number;
  totalTimeMinutes: number;
  enrolledRoadmaps: number;
  achievements: number;
}

export interface ActivityFeedItem {
  id: string;
  type: "topic_completed" | "achievement_earned" | "roadmap_enrolled" | "submission_made";
  title: string;
  description: string;
  timestamp: string;
  metadata: any;
}
