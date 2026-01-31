"""
AWS Blogs Crawler
Crawls AWS blog RSS feeds across multiple categories
"""
import feedparser
import requests
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared import (
    setup_logger,
    get_supabase_client,
    is_duplicate_url,
    sanitize_text,
    get_current_timestamp,
    CrawlerStats,
)


class AWSBlogsCrawler:
    """Crawler for AWS official blogs"""

    # AWS Blog RSS Feeds by category
    BLOG_FEEDS = {
        "architecture": "https://aws.amazon.com/blogs/architecture/feed/",
        "devops": "https://aws.amazon.com/blogs/devops/feed/",
        "security": "https://aws.amazon.com/blogs/security/feed/",
        "containers": "https://aws.amazon.com/blogs/containers/feed/",
        "database": "https://aws.amazon.com/blogs/database/feed/",
        "compute": "https://aws.amazon.com/blogs/compute/feed/",
        "networking": "https://aws.amazon.com/blogs/networking-and-content-delivery/feed/",
        "storage": "https://aws.amazon.com/blogs/storage/feed/",
        "big-data": "https://aws.amazon.com/blogs/big-data/feed/",
        "machine-learning": "https://aws.amazon.com/blogs/machine-learning/feed/",
        "mobile": "https://aws.amazon.com/blogs/mobile/feed/",
        "developer": "https://aws.amazon.com/blogs/developer/feed/",
        "opensource": "https://aws.amazon.com/blogs/opensource/feed/",
        "aws-news": "https://aws.amazon.com/blogs/aws/feed/",
        "startups": "https://aws.amazon.com/blogs/startups/feed/",
        "public-sector": "https://aws.amazon.com/blogs/publicsector/feed/",
        "apn": "https://aws.amazon.com/blogs/apn/feed/",
        "gametech": "https://aws.amazon.com/blogs/gametech/feed/",
        "iot": "https://aws.amazon.com/blogs/iot/feed/",
    }

    def __init__(self, categories: Optional[List[str]] = None):
        """
        Initialize AWS Blogs Crawler

        Args:
            categories: List of blog categories to crawl
                       If None, crawls all categories
        """
        self.logger = setup_logger("aws_blogs_crawler")
        self.supabase = get_supabase_client()
        self.categories = categories or list(self.BLOG_FEEDS.keys())
        self.stats = CrawlerStats()
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })

    def fetch_feed(self, category: str, feed_url: str, days_back: int = 7) -> List[Dict]:
        """
        Fetch and parse RSS feed

        Args:
            category: Blog category name
            feed_url: RSS feed URL
            days_back: Only return entries from last N days (0 = all)

        Returns:
            List of blog post dictionaries
        """
        self.logger.info(f"Fetching feed: {category} ({feed_url})")

        try:
            feed = feedparser.parse(feed_url)

            if feed.bozo:
                self.logger.warning(f"Feed parsing warning for {category}: {feed.bozo_exception}")

            cutoff_date = None
            if days_back > 0:
                cutoff_date = datetime.utcnow() - timedelta(days=days_back)

            posts = []

            for entry in feed.entries:
                # Parse published date
                published_date = None
                if hasattr(entry, "published_parsed") and entry.published_parsed:
                    published_date = datetime(*entry.published_parsed[:6])
                elif hasattr(entry, "updated_parsed") and entry.updated_parsed:
                    published_date = datetime(*entry.updated_parsed[:6])

                # Filter by date
                if cutoff_date and published_date:
                    if published_date < cutoff_date:
                        continue

                # Extract data
                title = sanitize_text(entry.get("title", "Untitled"))
                link = entry.get("link", "")
                description = sanitize_text(entry.get("summary", ""))
                author = entry.get("author", "AWS Team")

                # Extract tags/categories
                tags = []
                if hasattr(entry, "tags"):
                    tags = [sanitize_text(tag.term) for tag in entry.tags if hasattr(tag, "term")]

                posts.append({
                    "title": title,
                    "url": link,
                    "description": description,
                    "author": author,
                    "published_date": published_date.isoformat() if published_date else None,
                    "category": category,
                    "tags": tags,
                })

            self.logger.info(f"Found {len(posts)} posts in {category}")
            return posts

        except Exception as e:
            self.logger.error(f"Error fetching feed {category}: {e}")
            return []

    def scrape_full_content(self, url: str) -> Optional[str]:
        """
        Scrape full article content from blog post URL

        Args:
            url: Blog post URL

        Returns:
            Full article content or None
        """
        try:
            time.sleep(0.5)  # Rate limiting

            response = self.session.get(url, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, "lxml")

            # AWS blog posts typically use <article> or specific div classes
            content_elem = (
                soup.find("article") or
                soup.find("div", {"class": "blog-post-content"}) or
                soup.find("div", {"id": "post-body"}) or
                soup.find("main")
            )

            if content_elem:
                # Remove script, style, nav, footer
                for tag in content_elem(["script", "style", "nav", "footer", "aside"]):
                    tag.decompose()

                content = sanitize_text(content_elem.get_text())
                return content[:50000]  # Limit size

            return None

        except Exception as e:
            self.logger.error(f"Error scraping content from {url}: {e}")
            return None

    def detect_aws_services(self, title: str, description: str, tags: List[str]) -> List[str]:
        """
        Detect AWS services mentioned in post

        Args:
            title: Post title
            description: Post description
            tags: Post tags

        Returns:
            List of AWS service names
        """
        service_keywords = {
            "ec2": ["EC2", "Elastic Compute"],
            "s3": ["S3", "Simple Storage"],
            "lambda": ["Lambda", "serverless function"],
            "rds": ["RDS", "Relational Database"],
            "dynamodb": ["DynamoDB"],
            "ecs": ["ECS", "Elastic Container Service"],
            "eks": ["EKS", "Elastic Kubernetes"],
            "vpc": ["VPC", "Virtual Private Cloud"],
            "cloudformation": ["CloudFormation", "IaC"],
            "cloudwatch": ["CloudWatch", "monitoring"],
            "iam": ["IAM", "Identity and Access"],
        }

        text = (title + " " + description + " " + " ".join(tags)).lower()
        detected = set()

        for service, keywords in service_keywords.items():
            for keyword in keywords:
                if keyword.lower() in text:
                    detected.add(service)

        return list(detected)

    def save_to_database(self, post: Dict, full_content: Optional[str] = None) -> bool:
        """
        Save blog post to Supabase

        Args:
            post: Post dictionary
            full_content: Full article content (optional)

        Returns:
            True if successful, False otherwise
        """
        try:
            # Check for duplicates
            if is_duplicate_url(self.supabase, post["url"]):
                self.logger.debug(f"Skipping duplicate URL: {post['url']}")
                self.stats.increment_duplicates()
                return False

            # Detect AWS services
            aws_services = self.detect_aws_services(
                post["title"],
                post["description"],
                post.get("tags", [])
            )

            # Prepare data
            data = {
                "url": post["url"],
                "title": post["title"],
                "description": post["description"],
                "content": full_content or post["description"],
                "author": post.get("author", "AWS Team"),
                "published_date": post.get("published_date"),
                "source_type": "blog",
                "content_type": "blog_post",
                "aws_services": aws_services,
                "topics": post.get("tags", []),
                "categories": [post["category"]],
                "is_processed": False,
                "crawled_at": get_current_timestamp(),
            }

            result = self.supabase.table("aws_content").insert(data).execute()

            if result.data:
                self.logger.info(f"Saved: {post['title']}")
                self.stats.increment_successful()
                return True
            else:
                self.stats.increment_failed()
                return False

        except Exception as e:
            self.logger.error(f"Error saving to database: {e}")
            self.stats.increment_failed()
            return False

    def crawl(self, days_back: int = 7, fetch_full_content: bool = False) -> Dict:
        """
        Main crawl method

        Args:
            days_back: Only crawl posts from last N days (0 = all)
            fetch_full_content: Whether to scrape full article content

        Returns:
            Statistics dictionary
        """
        self.logger.info("Starting AWS Blogs crawl")
        self.logger.info(f"Categories: {', '.join(self.categories)}")
        self.logger.info(f"Days back: {days_back}, Fetch full content: {fetch_full_content}")

        all_posts = []

        # Fetch feeds
        for category in self.categories:
            if category not in self.BLOG_FEEDS:
                self.logger.warning(f"Unknown category: {category}")
                continue

            feed_url = self.BLOG_FEEDS[category]
            posts = self.fetch_feed(category, feed_url, days_back)
            all_posts.extend(posts)

        self.logger.info(f"Total posts to process: {len(all_posts)}")

        # Process posts
        for post in all_posts:
            self.stats.increment_processed()

            self.logger.info(
                f"Processing {self.stats.total_processed}/{len(all_posts)}: {post['title']}"
            )

            full_content = None
            if fetch_full_content:
                full_content = self.scrape_full_content(post["url"])

            self.save_to_database(post, full_content)

        # Print summary
        self.stats.print_summary(self.logger)

        return self.stats.get_summary()


def main():
    """CLI entry point"""
    import argparse
    import json

    parser = argparse.ArgumentParser(description="AWS Blogs Crawler")
    parser.add_argument(
        "--categories",
        nargs="+",
        help="Blog categories to crawl (e.g., devops architecture containers)"
    )
    parser.add_argument(
        "--days-back",
        type=int,
        default=7,
        help="Only crawl posts from last N days (0 = all)"
    )
    parser.add_argument(
        "--full-content",
        action="store_true",
        help="Fetch full article content (slower)"
    )
    parser.add_argument(
        "--url",
        type=str,
        help="Crawl a single blog post URL"
    )

    args = parser.parse_args()

    # Single URL mode
    if args.url:
        logger = setup_logger("aws_blogs_crawler")
        supabase = get_supabase_client()
        session = requests.Session()
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })

        try:
            # Scrape the blog post
            response = session.get(args.url, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, "lxml")

            # Extract metadata
            title = soup.find("h1").get_text() if soup.find("h1") else "Untitled"
            title = sanitize_text(title)

            # Extract content
            content_elem = (
                soup.find("article") or
                soup.find("div", {"class": "blog-post-content"}) or
                soup.find("div", {"id": "post-body"}) or
                soup.find("main")
            )

            content = ""
            if content_elem:
                for tag in content_elem(["script", "style", "nav", "footer", "aside"]):
                    tag.decompose()
                content = sanitize_text(content_elem.get_text())[:50000]

            # Extract published date from meta tags
            published_date = None
            date_meta = soup.find("meta", {"property": "article:published_time"})
            if date_meta and date_meta.get("content"):
                published_date = date_meta.get("content")

            # Extract author
            author_meta = soup.find("meta", {"name": "author"})
            author = author_meta.get("content") if author_meta else "AWS Team"

            # Determine category from URL
            category = "general"
            for cat in AWSBlogsCrawler.BLOG_FEEDS.keys():
                if cat in args.url:
                    category = cat
                    break

            # Save to database
            crawler = AWSBlogsCrawler()
            post = {
                "title": title,
                "url": args.url,
                "description": content[:500] if content else "",
                "author": author,
                "published_date": published_date,
                "category": category,
                "tags": [],
            }

            success = crawler.save_to_database(post, content)

            # Output JSON result
            result = {
                "title": title,
                "url": args.url,
                "author": author,
                "published_date": published_date,
                "category": category,
                "success": success,
            }
            print(json.dumps(result))

        except Exception as e:
            logger.error(f"Error crawling URL: {e}")
            print(json.dumps({"success": False, "error": str(e)}))

    # Normal batch mode
    else:
        crawler = AWSBlogsCrawler(categories=args.categories)
        crawler.crawl(days_back=args.days_back, fetch_full_content=args.full_content)


if __name__ == "__main__":
    main()
