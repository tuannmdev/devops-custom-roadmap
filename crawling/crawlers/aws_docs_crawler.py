"""
AWS Documentation Crawler
Crawls docs.aws.amazon.com via sitemap parsing with service-specific filtering
"""
import requests
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Set
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
import xml.etree.ElementTree as ET
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


class AWSDocsCrawler:
    """Crawler for AWS official documentation"""

    BASE_URL = "https://docs.aws.amazon.com"
    SITEMAP_URL = "https://docs.aws.amazon.com/sitemap_index.xml"
    RATE_LIMIT_DELAY = 1.0  # 1 request per second

    def __init__(self, services: Optional[List[str]] = None):
        """
        Initialize AWS Docs Crawler

        Args:
            services: List of AWS service names to filter (e.g., ["ec2", "s3", "lambda"])
                     If None, crawls all services
        """
        self.logger = setup_logger("aws_docs_crawler")
        self.supabase = get_supabase_client()
        self.services = services
        self.stats = CrawlerStats()
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })

    def get_sitemap_urls(self) -> List[str]:
        """
        Fetch all sitemap URLs from sitemap index

        Returns:
            List of sitemap URLs
        """
        self.logger.info(f"Fetching sitemap index from {self.SITEMAP_URL}")

        try:
            response = self.session.get(self.SITEMAP_URL, timeout=30)
            response.raise_for_status()

            root = ET.fromstring(response.content)
            namespace = {"ns": "http://www.sitemaps.org/schemas/sitemap/0.9"}

            sitemap_urls = []
            for sitemap in root.findall(".//ns:sitemap/ns:loc", namespace):
                url = sitemap.text
                if url:
                    # Filter by service if specified
                    if self.services:
                        if any(f"/{service}/" in url.lower() for service in self.services):
                            sitemap_urls.append(url)
                    else:
                        sitemap_urls.append(url)

            self.logger.info(f"Found {len(sitemap_urls)} sitemap URLs")
            return sitemap_urls

        except Exception as e:
            self.logger.error(f"Error fetching sitemap index: {e}")
            return []

    def parse_sitemap(self, sitemap_url: str, days_back: int = 1) -> List[Dict]:
        """
        Parse individual sitemap and extract URLs

        Args:
            sitemap_url: URL of the sitemap to parse
            days_back: Only return URLs modified in last N days (0 = all)

        Returns:
            List of dictionaries with url and last_modified
        """
        self.logger.info(f"Parsing sitemap: {sitemap_url}")

        try:
            response = self.session.get(sitemap_url, timeout=30)
            response.raise_for_status()

            root = ET.fromstring(response.content)
            namespace = {"ns": "http://www.sitemaps.org/schemas/sitemap/0.9"}

            cutoff_date = None
            if days_back > 0:
                cutoff_date = datetime.utcnow() - timedelta(days=days_back)

            urls = []
            for url_elem in root.findall(".//ns:url", namespace):
                loc = url_elem.find("ns:loc", namespace)
                lastmod = url_elem.find("ns:lastmod", namespace)

                if loc is not None and loc.text:
                    url = loc.text
                    last_modified = None

                    if lastmod is not None and lastmod.text:
                        try:
                            last_modified = datetime.fromisoformat(
                                lastmod.text.replace("Z", "+00:00")
                            )
                        except:
                            pass

                    # Filter by date if specified
                    if cutoff_date and last_modified:
                        if last_modified < cutoff_date:
                            continue

                    urls.append({
                        "url": url,
                        "last_modified": last_modified.isoformat() if last_modified else None
                    })

            self.logger.info(f"Extracted {len(urls)} URLs from sitemap")
            return urls

        except Exception as e:
            self.logger.error(f"Error parsing sitemap {sitemap_url}: {e}")
            return []

    def scrape_page_content(self, url: str) -> Optional[Dict]:
        """
        Scrape content from AWS documentation page

        Args:
            url: URL to scrape

        Returns:
            Dictionary with scraped content or None if failed
        """
        try:
            time.sleep(self.RATE_LIMIT_DELAY)  # Rate limiting

            response = self.session.get(url, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, "lxml")

            # Extract title
            title = None
            title_elem = soup.find("h1") or soup.find("title")
            if title_elem:
                title = sanitize_text(title_elem.get_text())

            # Extract main content
            content_div = soup.find("div", {"id": "main-content"}) or soup.find("main")
            content = ""
            if content_div:
                # Remove script and style tags
                for tag in content_div(["script", "style", "nav"]):
                    tag.decompose()
                content = sanitize_text(content_div.get_text())

            # Extract description from meta tags
            description = ""
            meta_desc = soup.find("meta", {"name": "description"})
            if meta_desc and meta_desc.get("content"):
                description = sanitize_text(meta_desc.get("content"))

            # Extract keywords
            keywords = []
            meta_keywords = soup.find("meta", {"name": "keywords"})
            if meta_keywords and meta_keywords.get("content"):
                keywords = [k.strip() for k in meta_keywords.get("content").split(",")]

            # Detect AWS service from URL
            aws_services = self._detect_aws_services(url, title or "", content)

            return {
                "url": url,
                "title": title or "Untitled",
                "description": description,
                "content": content[:50000],  # Limit content size
                "keywords": keywords,
                "aws_services": aws_services,
                "source_type": "documentation",
                "content_type": "documentation",
            }

        except Exception as e:
            self.logger.error(f"Error scraping {url}: {e}")
            return None

    def _detect_aws_services(self, url: str, title: str, content: str) -> List[str]:
        """
        Detect AWS services mentioned in URL, title, or content

        Args:
            url: Page URL
            title: Page title
            content: Page content

        Returns:
            List of AWS service names
        """
        # Common AWS service patterns
        service_patterns = {
            "ec2": ["Amazon EC2", "Elastic Compute Cloud"],
            "s3": ["Amazon S3", "Simple Storage Service"],
            "lambda": ["AWS Lambda", "Lambda function"],
            "rds": ["Amazon RDS", "Relational Database Service"],
            "dynamodb": ["Amazon DynamoDB", "DynamoDB"],
            "cloudformation": ["AWS CloudFormation", "CloudFormation"],
            "ecs": ["Amazon ECS", "Elastic Container Service"],
            "eks": ["Amazon EKS", "Elastic Kubernetes Service"],
            "vpc": ["Amazon VPC", "Virtual Private Cloud"],
            "iam": ["AWS IAM", "Identity and Access Management"],
            "cloudwatch": ["Amazon CloudWatch", "CloudWatch"],
            "sns": ["Amazon SNS", "Simple Notification Service"],
            "sqs": ["Amazon SQS", "Simple Queue Service"],
        }

        detected = set()

        # Check URL
        url_lower = url.lower()
        for service, patterns in service_patterns.items():
            if f"/{service}/" in url_lower:
                detected.add(service)

        # Check title and content (first 1000 chars)
        text = (title + " " + content[:1000]).lower()
        for service, patterns in service_patterns.items():
            for pattern in patterns:
                if pattern.lower() in text:
                    detected.add(service)

        return list(detected)

    def save_to_database(self, content: Dict) -> bool:
        """
        Save scraped content to Supabase

        Args:
            content: Content dictionary

        Returns:
            True if successful, False otherwise
        """
        try:
            # Check for duplicates
            if is_duplicate_url(self.supabase, content["url"]):
                self.logger.debug(f"Skipping duplicate URL: {content['url']}")
                self.stats.increment_duplicates()
                return False

            # Prepare data for insertion
            data = {
                "url": content["url"],
                "title": content["title"],
                "description": content.get("description", ""),
                "content": content.get("content", ""),
                "author": "AWS Documentation",
                "published_date": content.get("last_modified"),
                "source_type": "documentation",
                "content_type": "documentation",
                "aws_services": content.get("aws_services", []),
                "topics": content.get("keywords", []),
                "categories": ["documentation"],
                "is_processed": False,
                "crawled_at": get_current_timestamp(),
            }

            result = self.supabase.table("aws_content").insert(data).execute()

            if result.data:
                self.logger.info(f"Saved: {content['title']}")
                self.stats.increment_successful()
                return True
            else:
                self.stats.increment_failed()
                return False

        except Exception as e:
            self.logger.error(f"Error saving to database: {e}")
            self.stats.increment_failed()
            return False

    def crawl(self, days_back: int = 1, max_pages: int = 100) -> Dict:
        """
        Main crawl method

        Args:
            days_back: Only crawl pages modified in last N days (0 = all)
            max_pages: Maximum number of pages to crawl

        Returns:
            Statistics dictionary
        """
        self.logger.info("Starting AWS Documentation crawl")
        self.logger.info(f"Days back: {days_back}, Max pages: {max_pages}")

        if self.services:
            self.logger.info(f"Filtering services: {', '.join(self.services)}")

        # Get sitemap URLs
        sitemap_urls = self.get_sitemap_urls()

        if not sitemap_urls:
            self.logger.error("No sitemaps found, aborting")
            return self.stats.get_summary()

        all_urls = []

        # Parse sitemaps
        for sitemap_url in sitemap_urls[:10]:  # Limit to first 10 sitemaps for MVP
            urls = self.parse_sitemap(sitemap_url, days_back)
            all_urls.extend(urls)

            if len(all_urls) >= max_pages:
                break

        all_urls = all_urls[:max_pages]
        self.logger.info(f"Total URLs to crawl: {len(all_urls)}")

        # Crawl pages
        for item in all_urls:
            self.stats.increment_processed()

            self.logger.info(
                f"Processing {self.stats.total_processed}/{len(all_urls)}: {item['url']}"
            )

            content = self.scrape_page_content(item["url"])

            if content:
                content["last_modified"] = item.get("last_modified")
                self.save_to_database(content)

        # Print summary
        self.stats.print_summary(self.logger)

        return self.stats.get_summary()


def main():
    """CLI entry point"""
    import argparse

    parser = argparse.ArgumentParser(description="AWS Documentation Crawler")
    parser.add_argument(
        "--services",
        nargs="+",
        help="AWS services to crawl (e.g., ec2 s3 lambda)"
    )
    parser.add_argument(
        "--days-back",
        type=int,
        default=1,
        help="Only crawl pages modified in last N days (0 = all)"
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=100,
        help="Maximum number of pages to crawl"
    )

    args = parser.parse_args()

    crawler = AWSDocsCrawler(services=args.services)
    crawler.crawl(days_back=args.days_back, max_pages=args.max_pages)


if __name__ == "__main__":
    main()
