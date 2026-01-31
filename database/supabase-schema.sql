-- =============================================
-- DevOps Learning Platform - Database Schema
-- =============================================
-- This schema creates all tables, indexes, RLS policies, and functions
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USER MANAGEMENT TABLES
-- =============================================

-- User Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    email VARCHAR(255) UNIQUE,

    -- Profile information
    experience_level VARCHAR(50) DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
    current_position VARCHAR(100),
    years_of_experience INTEGER DEFAULT 0,
    programming_languages TEXT[] DEFAULT '{}',

    -- Learning preferences
    learning_style VARCHAR(50),
    daily_goal_minutes INTEGER DEFAULT 60,
    timezone VARCHAR(100) DEFAULT 'Asia/Ho_Chi_Minh',

    -- Gamification
    total_xp INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,

    -- Metadata
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- User Roadmap Enrollments
CREATE TABLE IF NOT EXISTS public.user_roadmaps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    roadmap_id UUID NOT NULL, -- References will be added after roadmaps table

    -- Enrollment status
    status VARCHAR(50) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'paused')),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    paused_at TIMESTAMP WITH TIME ZONE,

    -- Current position
    current_module_id UUID,
    current_topic_id UUID,

    -- Progress metrics
    progress_percentage INTEGER DEFAULT 0,
    total_topics INTEGER DEFAULT 0,
    completed_topics INTEGER DEFAULT 0,
    total_time_minutes INTEGER DEFAULT 0,

    -- Goals
    target_completion_date DATE,
    daily_time_goal INTEGER DEFAULT 60,

    UNIQUE(user_id, roadmap_id)
);

-- Topic-Level Progress Tracking
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    topic_id UUID NOT NULL, -- References will be added after topics table

    -- Progress status
    status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Time tracking
    time_spent_minutes INTEGER DEFAULT 0,
    estimated_time_minutes INTEGER,

    -- Performance metrics
    attempts INTEGER DEFAULT 0,
    score INTEGER,
    max_score INTEGER,

    -- Learning notes
    personal_notes TEXT,
    bookmarked BOOLEAN DEFAULT false,
    difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),

    UNIQUE(user_id, topic_id)
);

-- User Achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,

    -- Achievement details
    achievement_type VARCHAR(100) NOT NULL,
    achievement_name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Achievement data
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,

    -- Gamification
    xp_awarded INTEGER DEFAULT 0,
    badge_icon VARCHAR(100),
    badge_color VARCHAR(50),

    -- Visibility
    is_visible BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false
);

-- =============================================
-- 2. CONTENT MANAGEMENT TABLES
-- =============================================

-- Learning Roadmaps
CREATE TABLE IF NOT EXISTS public.roadmaps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Basic information
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    long_description TEXT,

    -- Categorization
    difficulty_level VARCHAR(50) NOT NULL CHECK (difficulty_level IN ('foundation-1', 'foundation-2', 'advanced', 'expert')),
    category VARCHAR(100),
    subcategory VARCHAR(100),

    -- Metrics
    estimated_weeks INTEGER,
    estimated_hours INTEGER,

    -- Prerequisites
    prerequisites TEXT[] DEFAULT '{}',
    learning_objectives TEXT[] DEFAULT '{}',
    career_outcomes TEXT[] DEFAULT '{}',

    -- Content structure
    total_modules INTEGER DEFAULT 0,
    total_topics INTEGER DEFAULT 0,

    -- Publishing
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.user_profiles(id),

    -- SEO
    meta_title VARCHAR(255),
    meta_description VARCHAR(500),
    cover_image TEXT,

    -- Tracking
    total_enrollments INTEGER DEFAULT 0,
    average_completion_rate FLOAT DEFAULT 0,
    average_rating FLOAT DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Roadmap Modules
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    roadmap_id UUID REFERENCES public.roadmaps(id) ON DELETE CASCADE NOT NULL,

    -- Content
    title VARCHAR(255) NOT NULL,
    description TEXT,
    learning_objectives TEXT[] DEFAULT '{}',

    -- Structure
    order_index INTEGER NOT NULL,
    estimated_hours INTEGER,

    -- Prerequisites
    prerequisites TEXT[] DEFAULT '{}',
    required_skills TEXT[] DEFAULT '{}',

    -- Module type
    module_type VARCHAR(50) DEFAULT 'standard' CHECK (module_type IN ('standard', 'project', 'assessment')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Learning Topics
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,

    -- Content
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Structure
    order_index INTEGER NOT NULL,

    -- Topic classification
    topic_type VARCHAR(50) CHECK (topic_type IN ('theory', 'practice', 'project', 'quiz', 'lab')),
    difficulty_level VARCHAR(50) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),

    -- Time estimation
    estimated_minutes INTEGER,

    -- Requirements
    has_prerequisites BOOLEAN DEFAULT false,
    prerequisite_topics UUID[] DEFAULT '{}',

    -- Features
    has_lab BOOLEAN DEFAULT false,
    has_quiz BOOLEAN DEFAULT false,
    has_submission BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Learning Content Details
CREATE TABLE IF NOT EXISTS public.learning_content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE NOT NULL,

    -- Content details
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('article', 'video', 'tutorial', 'lab', 'quiz')),
    title VARCHAR(255) NOT NULL,
    content TEXT,

    -- External resources
    external_url TEXT,
    video_url TEXT,
    video_duration INTEGER,

    -- File attachments
    file_attachments JSONB,

    -- Interactive elements
    practice_requirements JSONB,
    deliverables TEXT[] DEFAULT '{}',
    quiz_questions JSONB,

    -- Content metadata
    content_source VARCHAR(100),
    source_url TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 3. AWS CONTENT TABLES
-- =============================================

-- AWS Services Registry
CREATE TABLE IF NOT EXISTS public.aws_services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Service identification
    service_key VARCHAR(100) NOT NULL UNIQUE,
    service_name VARCHAR(100) NOT NULL,
    official_name TEXT,

    -- Categorization
    service_category VARCHAR(100),
    service_subcategory VARCHAR(100),

    -- Information
    description TEXT,
    launch_date DATE,

    -- Documentation
    official_url TEXT,
    documentation_url TEXT,
    pricing_url TEXT,

    -- Learning integration
    learning_priority INTEGER DEFAULT 5,
    beginner_friendly BOOLEAN DEFAULT false,

    -- Metadata
    icon_url TEXT,
    color_hex VARCHAR(7),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AWS Content Sources
CREATE TABLE IF NOT EXISTS public.aws_content_sources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Source identification
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('docs', 'blog', 'video', 'github', 'whitepaper')),
    source_name VARCHAR(100) NOT NULL,
    source_url TEXT NOT NULL,

    -- Crawling configuration
    crawl_frequency_hours INTEGER DEFAULT 24,
    last_crawled TIMESTAMP WITH TIME ZONE,
    next_crawl TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,

    -- Source metadata
    api_endpoint TEXT,
    rss_feed_url TEXT,
    sitemap_url TEXT,

    -- Quality metrics
    average_content_quality FLOAT DEFAULT 0.5,
    total_content_items INTEGER DEFAULT 0,

    -- Rate limiting
    requests_per_minute INTEGER DEFAULT 10,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AWS Content Repository
CREATE TABLE IF NOT EXISTS public.aws_content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Source tracking
    source_id UUID REFERENCES public.aws_content_sources(id),
    aws_service_id UUID REFERENCES public.aws_services(id),

    -- Content identification
    title TEXT NOT NULL,
    slug VARCHAR(500),
    content TEXT,
    excerpt TEXT,

    -- URLs and metadata
    url TEXT NOT NULL UNIQUE,
    canonical_url TEXT,
    author TEXT,
    published_date TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE,

    -- Content classification (AI-generated)
    content_type VARCHAR(50),
    difficulty_level VARCHAR(50),
    target_audience VARCHAR(50),

    -- AWS service classification
    aws_services TEXT[] DEFAULT '{}',
    primary_service VARCHAR(100),

    -- Topic classification
    topics TEXT[] DEFAULT '{}',
    categories TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',

    -- Content quality metrics (AI-analyzed)
    quality_score FLOAT,
    technical_depth FLOAT,
    practical_value FLOAT,
    clarity_score FLOAT,
    up_to_dateness FLOAT,

    -- Content structure
    word_count INTEGER,
    reading_time_minutes INTEGER,
    code_examples_count INTEGER,
    has_diagrams BOOLEAN DEFAULT false,
    has_video BOOLEAN DEFAULT false,

    -- Learning integration
    estimated_learning_time INTEGER,
    prerequisites TEXT[] DEFAULT '{}',
    learning_objectives TEXT[] DEFAULT '{}',
    key_takeaways TEXT[] DEFAULT '{}',

    -- AI processing
    ai_processed_at TIMESTAMP WITH TIME ZONE,
    ai_summary TEXT,
    ai_recommended_for TEXT[] DEFAULT '{}',

    -- Engagement metrics
    view_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    rating_average FLOAT DEFAULT 0,
    rating_count INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 4. COMMUNITY TABLES
-- =============================================

-- User Submissions
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Relationships
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE NOT NULL,

    -- Submission details
    submission_type VARCHAR(50) NOT NULL CHECK (submission_type IN ('file', 'github_repo', 'screenshot', 'text', 'video')),
    title VARCHAR(255),
    description TEXT,

    -- Content
    content TEXT,
    file_urls TEXT[] DEFAULT '{}',
    github_repo_url TEXT,
    live_demo_url TEXT,

    -- Review workflow
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'needs_revision', 'rejected')),
    reviewer_id UUID REFERENCES public.user_profiles(id),
    reviewer_feedback TEXT,
    review_score INTEGER CHECK (review_score BETWEEN 1 AND 10),

    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,

    -- Visibility
    is_public BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false
);

-- Topic Discussions
CREATE TABLE IF NOT EXISTS public.discussions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Relationships
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE,

    -- Content
    title VARCHAR(255),
    content TEXT NOT NULL,

    -- Engagement
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,

    -- Moderation
    is_solution BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,

    -- Metadata
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Learning Resources
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Resource details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    url TEXT NOT NULL,

    -- Classification
    resource_type VARCHAR(50) CHECK (resource_type IN ('documentation', 'tutorial', 'video', 'tool', 'book')),
    difficulty_level VARCHAR(50),

    -- Categorization
    tags TEXT[] DEFAULT '{}',
    aws_services TEXT[] DEFAULT '{}',
    topics TEXT[] DEFAULT '{}',

    -- Quality metrics
    vote_score INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,

    -- Source tracking
    added_by UUID REFERENCES public.user_profiles(id),
    source_type VARCHAR(50),
    last_crawled TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Topic-Resource Mapping
CREATE TABLE IF NOT EXISTS public.topic_resources (
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE NOT NULL,
    resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,

    -- Relationship metadata
    relevance_score INTEGER DEFAULT 1 CHECK (relevance_score BETWEEN 1 AND 10),
    resource_order INTEGER,
    is_required BOOLEAN DEFAULT false,

    -- Tracking
    added_by UUID REFERENCES public.user_profiles(id),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY(topic_id, resource_id)
);

-- Add foreign key constraints that were deferred
ALTER TABLE public.user_roadmaps ADD CONSTRAINT fk_user_roadmaps_roadmap
    FOREIGN KEY (roadmap_id) REFERENCES public.roadmaps(id) ON DELETE CASCADE;

ALTER TABLE public.user_roadmaps ADD CONSTRAINT fk_user_roadmaps_module
    FOREIGN KEY (current_module_id) REFERENCES public.modules(id) ON DELETE SET NULL;

ALTER TABLE public.user_roadmaps ADD CONSTRAINT fk_user_roadmaps_topic
    FOREIGN KEY (current_topic_id) REFERENCES public.topics(id) ON DELETE SET NULL;

ALTER TABLE public.user_progress ADD CONSTRAINT fk_user_progress_topic
    FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE CASCADE;

-- =============================================
-- 5. INDEXES FOR PERFORMANCE
-- =============================================

-- User Profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_experience ON public.user_profiles(experience_level);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active);

-- User Roadmaps
CREATE INDEX IF NOT EXISTS idx_user_roadmaps_user_id ON public.user_roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roadmaps_roadmap_id ON public.user_roadmaps(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_user_roadmaps_status ON public.user_roadmaps(status);
CREATE INDEX IF NOT EXISTS idx_user_roadmaps_progress ON public.user_roadmaps(progress_percentage);

-- User Progress
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_topic_id ON public.user_progress(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_status ON public.user_progress(status);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON public.user_progress(completed_at);

-- User Achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON public.user_achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_user_achievements_date ON public.user_achievements(achieved_at);

-- Roadmaps
CREATE INDEX IF NOT EXISTS idx_roadmaps_published ON public.roadmaps(is_published);
CREATE INDEX IF NOT EXISTS idx_roadmaps_difficulty ON public.roadmaps(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_roadmaps_category ON public.roadmaps(category);
CREATE INDEX IF NOT EXISTS idx_roadmaps_featured ON public.roadmaps(is_featured);
CREATE INDEX IF NOT EXISTS idx_roadmaps_slug ON public.roadmaps(slug);

-- Modules
CREATE INDEX IF NOT EXISTS idx_modules_roadmap_id ON public.modules(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_modules_order ON public.modules(roadmap_id, order_index);

-- Topics
CREATE INDEX IF NOT EXISTS idx_topics_module_id ON public.topics(module_id);
CREATE INDEX IF NOT EXISTS idx_topics_order ON public.topics(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_topics_type ON public.topics(topic_type);

-- Learning Content
CREATE INDEX IF NOT EXISTS idx_learning_content_topic_id ON public.learning_content(topic_id);
CREATE INDEX IF NOT EXISTS idx_learning_content_type ON public.learning_content(content_type);
CREATE INDEX IF NOT EXISTS idx_learning_content_source ON public.learning_content(content_source);

-- AWS Services
CREATE INDEX IF NOT EXISTS idx_aws_services_key ON public.aws_services(service_key);
CREATE INDEX IF NOT EXISTS idx_aws_services_category ON public.aws_services(service_category);
CREATE INDEX IF NOT EXISTS idx_aws_services_priority ON public.aws_services(learning_priority);

-- AWS Content Sources
CREATE INDEX IF NOT EXISTS idx_aws_content_sources_type ON public.aws_content_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_aws_content_sources_active ON public.aws_content_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_aws_content_sources_crawl ON public.aws_content_sources(next_crawl);

-- AWS Content
CREATE INDEX IF NOT EXISTS idx_aws_content_service ON public.aws_content(aws_service_id);
CREATE INDEX IF NOT EXISTS idx_aws_content_type ON public.aws_content(content_type);
CREATE INDEX IF NOT EXISTS idx_aws_content_difficulty ON public.aws_content(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_aws_content_quality ON public.aws_content(quality_score);
CREATE INDEX IF NOT EXISTS idx_aws_content_updated ON public.aws_content(last_updated);
CREATE INDEX IF NOT EXISTS idx_aws_content_url ON public.aws_content(url);
CREATE INDEX IF NOT EXISTS idx_aws_content_services ON public.aws_content USING GIN(aws_services);
CREATE INDEX IF NOT EXISTS idx_aws_content_topics ON public.aws_content USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_aws_content_tags ON public.aws_content USING GIN(tags);

-- Full-text search index for AWS content
CREATE INDEX IF NOT EXISTS idx_aws_content_search ON public.aws_content
    USING GIN(to_tsvector('english', title || ' ' || COALESCE(content, '') || ' ' || COALESCE(excerpt, '')));

-- Submissions
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_topic_id ON public.submissions(topic_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_public ON public.submissions(is_public);

-- Discussions
CREATE INDEX IF NOT EXISTS idx_discussions_topic_id ON public.discussions(topic_id);
CREATE INDEX IF NOT EXISTS idx_discussions_user_id ON public.discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_discussions_parent_id ON public.discussions(parent_id);
CREATE INDEX IF NOT EXISTS idx_discussions_solution ON public.discussions(is_solution);

-- Resources
CREATE INDEX IF NOT EXISTS idx_resources_type ON public.resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_difficulty ON public.resources(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_resources_tags ON public.resources USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_resources_verified ON public.resources(is_verified);

-- Topic Resources
CREATE INDEX IF NOT EXISTS idx_topic_resources_topic ON public.topic_resources(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_resources_resource ON public.topic_resources(resource_id);
CREATE INDEX IF NOT EXISTS idx_topic_resources_relevance ON public.topic_resources(relevance_score);

-- =============================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aws_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aws_content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aws_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_resources ENABLE ROW LEVEL SECURITY;

-- User Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- User Roadmaps: Users can view and manage their own enrollments
CREATE POLICY "Users can view own roadmap enrollments" ON public.user_roadmaps
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own roadmap enrollments" ON public.user_roadmaps
    FOR ALL USING (auth.uid() = user_id);

-- User Progress: Users can view and update their own progress
CREATE POLICY "Users can view own progress" ON public.user_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own progress" ON public.user_progress
    FOR ALL USING (auth.uid() = user_id);

-- User Achievements: Users can view their own achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements
    FOR SELECT USING (auth.uid() = user_id);

-- Roadmaps: Published roadmaps are public
CREATE POLICY "Anyone can view published roadmaps" ON public.roadmaps
    FOR SELECT USING (is_published = true);

-- Modules: Public if parent roadmap is published
CREATE POLICY "Anyone can view modules of published roadmaps" ON public.modules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.roadmaps
            WHERE id = modules.roadmap_id AND is_published = true
        )
    );

-- Topics: Public if parent roadmap is published
CREATE POLICY "Anyone can view topics of published roadmaps" ON public.topics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.modules m
            JOIN public.roadmaps r ON r.id = m.roadmap_id
            WHERE m.id = topics.module_id AND r.is_published = true
        )
    );

-- Learning Content: Public if parent roadmap is published
CREATE POLICY "Anyone can view learning content of published roadmaps" ON public.learning_content
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.topics t
            JOIN public.modules m ON m.id = t.module_id
            JOIN public.roadmaps r ON r.id = m.roadmap_id
            WHERE t.id = learning_content.topic_id AND r.is_published = true
        )
    );

-- AWS Services: Public read-only
CREATE POLICY "Anyone can view AWS services" ON public.aws_services
    FOR SELECT USING (true);

-- AWS Content Sources: Public read-only
CREATE POLICY "Anyone can view AWS content sources" ON public.aws_content_sources
    FOR SELECT USING (true);

-- AWS Content: Public read-only
CREATE POLICY "Anyone can view AWS content" ON public.aws_content
    FOR SELECT USING (true);

-- Submissions: Users can view own submissions or public ones
CREATE POLICY "Users can view submissions" ON public.submissions
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can manage own submissions" ON public.submissions
    FOR ALL USING (auth.uid() = user_id);

-- Discussions: Public read, authenticated users can create
CREATE POLICY "Anyone can view discussions" ON public.discussions
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create discussions" ON public.discussions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own discussions" ON public.discussions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own discussions" ON public.discussions
    FOR DELETE USING (auth.uid() = user_id);

-- Resources: Public read-only
CREATE POLICY "Anyone can view resources" ON public.resources
    FOR SELECT USING (true);

-- Topic Resources: Public read-only
CREATE POLICY "Anyone can view topic resources" ON public.topic_resources
    FOR SELECT USING (true);

-- =============================================
-- 7. DATABASE FUNCTIONS
-- =============================================

-- Function to update user streak
CREATE OR REPLACE FUNCTION public.update_user_streak(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    current_streak_val INTEGER;
    last_activity_date DATE;
    today DATE;
BEGIN
    today := CURRENT_DATE;

    -- Get last activity date
    SELECT DATE(MAX(completed_at)) INTO last_activity_date
    FROM public.user_progress
    WHERE user_id = user_uuid AND status = 'completed';

    -- Calculate streak
    IF last_activity_date IS NULL THEN
        current_streak_val := 0;
    ELSIF last_activity_date = today THEN
        -- Activity today, maintain or increase streak
        SELECT current_streak INTO current_streak_val
        FROM public.user_profiles
        WHERE id = user_uuid;

        -- Check if yesterday had activity
        IF EXISTS (
            SELECT 1 FROM public.user_progress
            WHERE user_id = user_uuid
            AND status = 'completed'
            AND DATE(completed_at) = today - INTERVAL '1 day'
        ) THEN
            current_streak_val := current_streak_val + 1;
        ELSE
            current_streak_val := 1;
        END IF;
    ELSIF last_activity_date = today - INTERVAL '1 day' THEN
        -- Activity yesterday, maintain streak
        SELECT current_streak INTO current_streak_val
        FROM public.user_profiles
        WHERE id = user_uuid;
    ELSE
        -- No recent activity, reset streak
        current_streak_val := 0;
    END IF;

    -- Update user profile
    UPDATE public.user_profiles
    SET current_streak = current_streak_val,
        longest_streak = GREATEST(longest_streak, current_streak_val),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = user_uuid;

    RETURN current_streak_val;
END;
$$ LANGUAGE plpgsql;

-- Function to update roadmap progress
CREATE OR REPLACE FUNCTION public.update_roadmap_progress(
    p_user_id UUID,
    p_roadmap_id UUID
)
RETURNS VOID AS $$
DECLARE
    total_topics_count INTEGER;
    completed_topics_count INTEGER;
    progress_pct INTEGER;
BEGIN
    -- Get total topics in roadmap
    SELECT COUNT(t.id) INTO total_topics_count
    FROM public.topics t
    JOIN public.modules m ON m.id = t.module_id
    WHERE m.roadmap_id = p_roadmap_id;

    -- Get completed topics by user
    SELECT COUNT(up.id) INTO completed_topics_count
    FROM public.user_progress up
    JOIN public.topics t ON t.id = up.topic_id
    JOIN public.modules m ON m.id = t.module_id
    WHERE m.roadmap_id = p_roadmap_id
    AND up.user_id = p_user_id
    AND up.status = 'completed';

    -- Calculate percentage
    IF total_topics_count > 0 THEN
        progress_pct := (completed_topics_count * 100) / total_topics_count;
    ELSE
        progress_pct := 0;
    END IF;

    -- Update user_roadmaps
    UPDATE public.user_roadmaps
    SET
        total_topics = total_topics_count,
        completed_topics = completed_topics_count,
        progress_percentage = progress_pct,
        status = CASE
            WHEN progress_pct = 100 THEN 'completed'
            WHEN progress_pct > 0 THEN 'in_progress'
            ELSE status
        END,
        completed_at = CASE
            WHEN progress_pct = 100 THEN CURRENT_TIMESTAMP
            ELSE completed_at
        END
    WHERE user_id = p_user_id AND roadmap_id = p_roadmap_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 8. TRIGGERS
-- =============================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roadmaps_updated_at BEFORE UPDATE ON public.roadmaps
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_aws_services_updated_at BEFORE UPDATE ON public.aws_services
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_aws_content_updated_at BEFORE UPDATE ON public.aws_content
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, username, email, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SCHEMA CREATION COMPLETE
-- =============================================
-- Run this entire file in Supabase SQL Editor
-- Then proceed to seed-data.sql for sample data
