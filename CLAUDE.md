# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **DevOps Learning Management System** - a full-stack application that provides structured learning paths (roadmaps) for DevOps education, with automated content aggregation from AWS official sources. The platform tracks user progress, provides hands-on labs, and includes community features.

**Key Differentiator**: Automated content crawling and AI-powered quality analysis using Claude Code + MCP (Model Context Protocol) skills to aggregate 50,000+ AWS learning resources with zero manual curation.

## Tech Stack

### Frontend & Backend
- **Next.js 14** with App Router (full-stack framework)
- **TypeScript** for type safety
- **React 18** with Server Components
- **TailwindCSS** + **Radix UI** (Shadcn/UI) for components
- **NextAuth.js** for authentication
- **Zustand** for client state, **SWR/TanStack Query** for server state

### Database & Infrastructure
- **Supabase** (PostgreSQL + Auth + Storage + Real-time)
- **Vercel** for deployment (serverless functions)
- **GitHub Actions** for scheduled content crawling
- **Anthropic Claude API** for AI content analysis

### Content Automation
- **Claude Code CLI** for orchestration
- **MCP Skills** (Python-based) for crawling AWS content sources
- **BeautifulSoup**, **feedparser**, **YouTube Data API v3**

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Supabase      │    │ Content Crawler │
│   (Vercel)      │◄──►│   PostgreSQL    │◄──►│ (GitHub Actions)│
│  Frontend + API │    │   Auth + RLS    │    │  MCP Skills     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
  User Interface          Row Level Security      Claude AI Analysis
  Server Components       Real-time Updates       Content Quality Scoring
```

### Data Flow
1. **Content Ingestion**: MCP skills crawl AWS docs, blogs, YouTube (daily via GitHub Actions)
2. **AI Processing**: Claude analyzes content quality, difficulty, categorization
3. **Storage**: Structured data stored in Supabase with full-text search indexes
4. **Serving**: Next.js Server Components fetch and render content
5. **Tracking**: User progress tracked in real-time via Supabase subscriptions
6. **Updates**: New content automatically integrated into learning paths

## Database Schema Overview

The database is organized into several key domains:

### User Management
- `user_profiles` - Extended user info with gamification (XP, streaks, preferences)
- `user_roadmaps` - Enrollment tracking with progress percentages
- `user_progress` - Topic-level completion status, time spent, scores
- `user_achievements` - Gamification badges and milestones

### Content Structure
- `roadmaps` - Learning paths (e.g., "DevOps Foundation L1", "AWS Solutions Architect")
- `modules` - Sections within roadmaps (e.g., "Docker Fundamentals", "CI/CD Pipelines")
- `topics` - Individual learning units (e.g., "Docker Multi-stage Builds")
- `learning_content` - Actual content (markdown, videos, labs, quizzes)

### AWS Content Repository
- `aws_services` - Registry of AWS services with metadata
- `aws_content_sources` - Crawling sources config (URLs, schedules, rate limits)
- `aws_content` - Crawled content with AI-analyzed quality scores, difficulty levels, topic tags
  - Includes quality metrics: `technical_depth`, `practical_value`, `clarity_score`, `up_to_dateness`
  - Full-text search vector (`search_vector`) for fast content discovery
  - Semantic tagging with `aws_services[]`, `topics[]`, `categories[]`

### Community Features
- `submissions` - User lab submissions with file uploads, GitHub repo links
- `discussions` - Q&A threads with upvotes, solutions marking
- `resources` - Additional community-curated learning materials

**Important**: All tables use Row Level Security (RLS) policies. User data is private to the owning user; published content is public.

## AWS Content Crawling System

This is a critical component requiring specialized knowledge:

### MCP Skills (Python modules in `crawling/mcp_servers/`)

1. **aws_docs_crawler** - Crawls docs.aws.amazon.com via sitemap parsing
   - Service-specific filtering (EC2, S3, Lambda, etc.)
   - Rate limiting: 1 req/sec
   - Incremental updates (only changed content)

2. **aws_blogs_crawler** - Crawls AWS blog RSS feeds (19 categories)
   - Categories: Architecture, DevOps, Security, Containers, Database, etc.
   - Trending topic analysis
   - Author and publication date extraction

3. **aws_youtube_crawler** - Uses YouTube Data API v3
   - Key playlists: re:Invent, "This is My Architecture", AWS Training
   - Automatic transcript extraction via youtube-transcript-api
   - API quota management (10,000 requests/day limit)

4. **content_processor** - AI-powered content analysis
   - Anthropic Claude API integration
   - Quality scoring (0-1 scale across multiple dimensions)
   - Difficulty classification, AWS service extraction, summary generation
   - Batch processing with configurable quality thresholds

### Orchestration (`crawling/orchestrator/aws_content_orchestrator.py`)

Main operations:
- `daily-update`: Crawl last 24 hours (100-300 items)
- `full-crawl`: Comprehensive crawl of all sources (1000+ items)
- `process-content`: AI analysis of unprocessed content batches

Runs via GitHub Actions:
- Daily at 2 AM UTC
- Weekly full crawl on Sundays at 4 AM UTC

### MCP Configuration

MCP servers are configured in `.mcp/config.json` with environment variables:
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` - Database access
- `ANTHROPIC_API_KEY` - AI content analysis
- `YOUTUBE_API_KEY` - Video metadata and transcripts
- `GITHUB_TOKEN` - Repository access

## Development Workflow

### Project Structure (When Implemented)
```
app/
├── (auth)/          # Auth route group (signin, signup)
├── (dashboard)/     # Protected dashboard routes
├── roadmap/[id]/    # Dynamic roadmap learning interface
├── api/             # API routes (Next.js serverless functions)
│   ├── auth/
│   ├── roadmaps/
│   └── user/
└── layout.tsx

components/
├── ui/              # Radix UI primitives (button, card, progress, tabs)
├── auth/            # Authentication components
├── dashboard/       # Dashboard-specific components
├── roadmap/         # Learning interface components
└── common/          # Shared components

lib/
├── supabase.ts      # Supabase client (SSR-compatible)
├── auth.ts          # NextAuth configuration
├── utils.ts         # Utility functions
└── types.ts         # TypeScript type definitions

crawling/
├── mcp_servers/     # Individual MCP skills (Python)
├── orchestrator/    # Main orchestration logic
└── config/          # Crawling configuration files
```

### Key Commands (When Project is Implemented)

**Local Development:**
```bash
npm run dev          # Start Next.js dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check
npm run type-check   # TypeScript type checking
```

**Database:**
```bash
# Run in Supabase SQL Editor:
# - database/supabase-schema.sql (full schema + RLS policies)
# - database/seed-data.sql (sample roadmaps and content)
```

**Content Crawling (Local Testing):**
```bash
# Test individual crawlers
claude-code "Use aws-docs-crawler to get AWS services list"
claude-code "Use aws-blogs-crawler to crawl recent AWS blogs from last 7 days"
claude-code "Use aws-youtube-crawler to crawl recent AWS videos from last 14 days"

# Run orchestrator
claude-code crawling/orchestrator/aws_content_orchestrator.py --operation daily-update
```

## Important Implementation Notes

### Authentication Flow
- NextAuth.js session management with Supabase adapter
- Support both email/password and Google OAuth
- Auto-create `user_profiles` record via database trigger on signup
- Protected routes use middleware to check session

### Content Rendering
- Learning content stored as markdown in `learning_content.content`
- Use markdown-to-JSX library for rendering (syntax highlighting, embedded components)
- Support for interactive elements: quizzes (JSONB), labs, file attachments

### Progress Tracking
- Real-time updates via Supabase subscriptions
- Automatic streak calculation using database function `update_user_streak()`
- XP awards based on completion, difficulty, and submission quality

### File Uploads
- Use Supabase Storage for user submissions
- Bucket structure: `submissions/{user_id}/{submission_id}/`
- Also support GitHub repo URLs and live demo URLs

### Performance Optimization
- Database indexes on all foreign keys, search vectors, and filter columns
- Next.js Server Components for initial page loads (reduced client JS)
- API route caching where appropriate
- Image optimization via `next/image`

### Zero-Cost Infrastructure Target
- **Vercel Free Tier**: 100GB bandwidth/month (supports ~10K users)
- **Supabase Free Tier**: 500MB database, 50K monthly active users
- **GitHub Actions Free**: 2,000 minutes/month (sufficient for daily crawls)
- **Only cost**: Anthropic Claude API (~$5-10/month for AI analysis, optional)

## MCP Skills Development

When creating or modifying MCP skills:

1. **Rate Limiting**: Always respect source rate limits
   - AWS Docs: 1 req/sec
   - YouTube API: 10,000 requests/day quota
   - RSS feeds: No strict limits but be respectful

2. **Error Handling**: Implement exponential backoff for API failures

3. **Content Deduplication**: Check `aws_content.url` before inserting

4. **Quality Filtering**: Only store content with `quality_score > 0.5` (configurable)

5. **Incremental Updates**: Use `last_crawled` timestamp to avoid re-processing

6. **Logging**: Comprehensive logging to `aws_crawling_{timestamp}.log`

## Security Considerations

- **RLS Policies**: All user data tables have RLS enabled - users can only access their own data
- **Service Role Key**: Only use `SUPABASE_SERVICE_ROLE_KEY` in server-side code or MCP skills, never client-side
- **Input Validation**: Use Zod schemas for all API route inputs
- **File Uploads**: Validate file types and sizes before storage
- **API Rate Limiting**: Implement rate limiting for public API routes

## Target Capacity

- **Users**: 1,000+ concurrent users on free tiers
- **Content**: 50,000+ AWS learning resources
- **Updates**: 100-300 new items/day automatically
- **Performance**: < 2s page load, < 500ms API response, < 100ms database queries

## Deployment

- **Frontend + API**: Deploy to Vercel via GitHub integration (automatic on push to main)
- **Database**: Supabase project in Southeast Asia (Singapore) region
- **Environment Variables**: Set in Vercel dashboard (all environments: Production, Preview, Development)
- **Domain**: Optional custom domain via Vercel (requires Pro plan)
- **Monitoring**: Vercel Analytics (built-in), Supabase Dashboard for database health

## Vietnamese Language Context

The target audience is Vietnamese developers learning DevOps. While the UI can be in English, consider:
- Vietnamese examples and use cases
- Timezone defaults to 'Asia/Ho_Chi_Minh'
- Currency in VND when discussing costs
- Documentation can reference Vietnamese companies and infrastructure patterns
