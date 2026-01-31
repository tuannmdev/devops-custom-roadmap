# AWS Content Crawling System

Automated content aggregation system that crawls AWS official sources (documentation, blogs, YouTube) and uses Claude AI for intelligent content analysis and quality scoring.

## 🎯 Overview

This system automatically:
- **Crawls** AWS documentation, blogs, and YouTube videos
- **Analyzes** content quality using Claude AI
- **Scores** content across multiple dimensions (technical depth, practical value, clarity, relevance)
- **Categorizes** content by AWS services, topics, and difficulty levels
- **Generates** AI summaries and key takeaways
- **Stores** everything in Supabase with full-text search

**Target**: 50,000+ AWS learning resources with zero manual curation.

## 📁 Directory Structure

```
crawling/
├── crawlers/              # Individual crawlers
│   ├── aws_docs_crawler.py       # AWS Documentation crawler
│   ├── aws_blogs_crawler.py      # AWS Blogs RSS crawler
│   └── aws_youtube_crawler.py    # YouTube API crawler
├── processors/            # Content processors
│   └── content_processor.py      # Claude AI analyzer
├── shared/                # Shared utilities
│   └── utils.py          # Common functions
├── orchestrator.py        # Main coordinator
├── requirements.txt       # Python dependencies
├── logs/                  # Crawl logs (auto-created)
└── README.md             # This file
```

## 🚀 Quick Start

### ⭐ Recommended: Use Admin Dashboard (Visual UI)

The easiest way to manage crawling operations is through the **Admin Dashboard**:

1. Start the Next.js application:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:3000/admin/crawling`

3. Use the visual interface to:
   - **Trigger crawl operations** with a single click
   - **Paste custom URLs** (blog posts, videos, playlists)
   - **Review crawled content** with filters and quality scores
   - **Monitor progress** in real-time

📖 **See [ADMIN_DASHBOARD.md](../ADMIN_DASHBOARD.md) for complete documentation**

### Alternative: Command-Line Interface

For automation or server-side execution, use the CLI:

#### 1. Install Dependencies

```bash
cd crawling
pip install -r requirements.txt
```

#### 2. Configure Environment Variables

Create `.env` file in the project root (or set environment variables):

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
ANTHROPIC_API_KEY=sk-ant-...

# Required for YouTube crawling
YOUTUBE_API_KEY=AIza...

# Optional
GITHUB_TOKEN=ghp_...
```

#### 3. Run Your First Crawl

```bash
# Daily incremental update (recommended for testing)
python orchestrator.py --operation daily-update

# Process existing unprocessed content
python orchestrator.py --operation process-content --batch-size 10

# Full comprehensive crawl (use sparingly)
python orchestrator.py --operation full-crawl --max-items 100
```

## 📋 Operations

### Daily Update (Recommended)

Crawls recent content from the last 1-14 days:

```bash
python orchestrator.py --operation daily-update
```

**What it does:**
- AWS Blogs: Last 7 days (4 key categories)
- YouTube: Last 14 days (2 key playlists)
- AWS Docs: Last 7 days (5 core services)
- AI Processing: 50 items batch

**Typical results:** 100-300 new items/day
**Duration:** 10-20 minutes
**API costs:** ~$1-2 (Anthropic)

### Full Crawl

Comprehensive crawl of all sources:

```bash
python orchestrator.py --operation full-crawl --max-items 1000
```

**What it does:**
- AWS Blogs: All 19 categories, all time
- YouTube: 7 playlists, up to 1000 videos each
- AWS Docs: All services, up to 1000 pages
- AI Processing: 200 items batch

**Typical results:** 5,000-10,000 items
**Duration:** 2-4 hours
**API costs:** ~$20-50 (Anthropic + YouTube)

**⚠️ Use sparingly:** Run once for initial setup, then rely on daily updates.

### Process Content Only

Process existing unprocessed content with Claude AI:

```bash
python orchestrator.py \
  --operation process-content \
  --batch-size 100 \
  --quality-threshold 0.6
```

**Options:**
- `--batch-size`: Number of items to process (default: 100)
- `--quality-threshold`: Minimum quality score 0.0-1.0 (default: 0.5)

## 🤖 Individual Crawlers

### AWS Documentation Crawler

```bash
python crawlers/aws_docs_crawler.py \
  --services ec2 s3 lambda \
  --days-back 7 \
  --max-pages 100
```

**Options:**
- `--services`: AWS services to crawl (default: all)
- `--days-back`: Days to look back (0 = all time)
- `--max-pages`: Maximum pages to crawl

**Rate limit:** 1 request/second

### AWS Blogs Crawler

```bash
python crawlers/aws_blogs_crawler.py \
  --categories devops architecture containers \
  --days-back 30 \
  --full-content
```

**Options:**
- `--categories`: Blog categories (default: all)
  - Available: devops, architecture, security, containers, database, compute, etc.
- `--days-back`: Days to look back (0 = all time)
- `--full-content`: Fetch full article content (slower)

**Available categories:** architecture, devops, security, containers, database, compute, networking, storage, big-data, machine-learning, mobile, developer, opensource, aws-news, startups, public-sector, apn, gametech, iot

### AWS YouTube Crawler

```bash
python crawlers/aws_youtube_crawler.py \
  --playlists reinvent aws-devops \
  --days-back 30 \
  --max-videos 50 \
  --no-transcripts
```

**Options:**
- `--playlists`: Playlist keys (default: all)
  - Available: reinvent, this-is-my-architecture, aws-training, aws-devops, aws-containers
- `--days-back`: Days to look back (0 = all time)
- `--max-videos`: Max videos per playlist
- `--no-transcripts`: Skip transcript fetching

**API quota:** YouTube Data API has 10,000 requests/day limit

### Content Processor

```bash
python processors/content_processor.py \
  --batch-size 50 \
  --quality-threshold 0.6 \
  --content-types blog_post video \
  --model claude-3-haiku-20240307
```

**Options:**
- `--batch-size`: Items to process
- `--quality-threshold`: Min quality score
- `--content-types`: Filter by type (blog_post, video, documentation)
- `--model`: Claude model
  - `claude-3-haiku-20240307` (fast, cheap)
  - `claude-3-sonnet-20240229` (balanced)
  - `claude-3-opus-20240229` (best quality, expensive)
- `--reprocess`: Reprocess low-quality content

## 📊 Quality Scoring

Claude AI analyzes content across 4 dimensions (0.0-1.0):

| Dimension | Description |
|-----------|-------------|
| **Technical Depth** | How deep/advanced the technical concepts are |
| **Practical Value** | How useful/applicable the content is |
| **Clarity Score** | How clear and well-explained the content is |
| **Up-to-dateness** | How current and relevant the content is |

**Overall Quality Score** = Average of all dimensions

Content below the quality threshold is flagged but still stored.

## 🔄 Automation with GitHub Actions

The system runs automatically via GitHub Actions:

### Schedules

- **Daily Update**: 2 AM UTC (Monday-Saturday)
- **Weekly Full Crawl**: 4 AM UTC (Sunday)

### Manual Trigger

Run manually from GitHub Actions tab:
1. Go to repository → Actions
2. Select "Daily AWS Content Crawl"
3. Click "Run workflow"
4. Choose operation and parameters

### Required Secrets

Configure in Repository Settings → Secrets:

```
SUPABASE_URL
SUPABASE_SERVICE_KEY
ANTHROPIC_API_KEY
YOUTUBE_API_KEY
```

## 📈 Expected Costs

### Daily Update (Production)

| Service | Usage | Cost/Day | Cost/Month |
|---------|-------|----------|------------|
| Anthropic Claude | ~50-100 requests/day | $0.50-$1.00 | $15-$30 |
| YouTube Data API | ~20-50 requests/day | Free (10K/day limit) | $0 |
| Supabase | Storage + API calls | Free tier | $0 |
| GitHub Actions | ~15-30 min/day | Free tier | $0 |
| **Total** | | **$0.50-$1.00** | **$15-$30** |

### Full Crawl (One-time setup)

| Service | Usage | Cost |
|---------|-------|------|
| Anthropic Claude | 1,000-2,000 requests | $5-$20 |
| YouTube Data API | 500-1,000 requests | Free |
| **Total** | | **$5-$20** |

**Note:** Use Haiku model (`claude-3-haiku-20240307`) for cost efficiency. It's 20x cheaper than Opus with good quality.

## 🛠️ Development

### Project Setup

```bash
# Install development dependencies
pip install -r requirements.txt

# Run tests (if implemented)
pytest tests/

# Format code
black crawlers/ processors/ orchestrator.py

# Lint code
flake8 crawlers/ processors/ orchestrator.py
```

### Adding a New Crawler

1. Create file in `crawlers/` (e.g., `aws_tutorials_crawler.py`)
2. Implement crawler class following existing patterns
3. Add import to `crawlers/__init__.py`
4. Integrate into `orchestrator.py`
5. Update this README

### Customizing Claude Prompts

Edit `processors/content_processor.py` → `analyze_content()` method:

```python
prompt = f"""Analyze this AWS DevOps learning content...
[Modify prompt here]
"""
```

## 🐛 Troubleshooting

### "No module named 'crawlers'"

```bash
# Ensure you're in the crawling directory
cd crawling
python orchestrator.py --operation daily-update
```

### "Missing environment variable: ANTHROPIC_API_KEY"

```bash
# Create .env file in project root
echo "ANTHROPIC_API_KEY=sk-ant-..." >> ../.env

# Or set environment variable
export ANTHROPIC_API_KEY=sk-ant-...
```

### YouTube API Quota Exceeded

- Limit: 10,000 requests/day
- Solution: Reduce `--max-videos` or skip transcripts with `--no-transcripts`
- Reset: Quota resets at midnight Pacific Time (PT)

### Supabase "RLS policy violation"

- Ensure you're using `SUPABASE_SERVICE_KEY` (not anon key)
- Service key bypasses RLS policies

### Low Quality Scores

- Adjust `--quality-threshold` (lower threshold)
- Or reprocess with better model:
  ```bash
  python processors/content_processor.py --model claude-3-sonnet-20240229 --reprocess
  ```

## 📝 Logs

All crawl operations log to `logs/` directory:

```
logs/
├── crawl_20240115_020000.log
├── crawl_20240116_020000.log
└── ...
```

Logs include:
- Detailed progress for each crawler
- Error messages and stack traces
- Statistics summaries
- API call counts

**Retention:** GitHub Actions keeps logs for 7 days (configurable)

## 🔐 Security

- **Never commit** `.env` file or API keys
- Use **environment variables** or **GitHub Secrets** for production
- **Service role key** should only be used server-side
- **Rate limiting** is implemented to respect API limits
- **Input sanitization** prevents SQL injection and XSS

## 📚 API References

- [Anthropic Claude API](https://docs.anthropic.com/claude/reference)
- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- [Supabase Python Client](https://supabase.com/docs/reference/python)
- [BeautifulSoup Documentation](https://www.crummy.com/software/BeautifulSoup/bs4/doc/)
- [Feedparser Documentation](https://pythonhosted.org/feedparser/)

## 🤝 Contributing

Contributions welcome! Areas for improvement:

- [ ] Add more AWS content sources (AWS Workshops, AWS Skill Builder)
- [ ] Implement content deduplication across sources
- [ ] Add support for other cloud providers (Azure, GCP)
- [ ] Improve AI prompts for better categorization
- [ ] Add unit tests and integration tests
- [ ] Implement error recovery and retry logic
- [ ] Add Slack/Discord notifications for failures

## 📄 License

Same as main project.

## 🆘 Support

- Issues: GitHub Issues
- Docs: See main project README and CLAUDE.md
- Logs: Check `logs/` directory for detailed error messages
