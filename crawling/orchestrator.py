"""
AWS Content Crawling Orchestrator
Coordinates all crawlers and processors for automated content aggregation
"""
import argparse
import json
from datetime import datetime
from typing import Dict, List, Optional
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from crawlers import AWSDocsCrawler, AWSBlogsCrawler, AWSYouTubeCrawler
from processors import ContentProcessor
from shared import setup_logger, format_duration


class CrawlingOrchestrator:
    """Main orchestrator for AWS content crawling pipeline"""

    def __init__(self):
        """Initialize orchestrator"""
        self.logger = setup_logger(
            "orchestrator",
            log_file=f"logs/crawl_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        )
        self.results = {}

    def run_daily_update(
        self,
        process_content: bool = True,
        quality_threshold: float = 0.5
    ) -> Dict:
        """
        Run daily incremental update (last 24 hours of content)

        Args:
            process_content: Whether to run AI processing
            quality_threshold: Minimum quality score for content

        Returns:
            Results dictionary
        """
        self.logger.info("="*80)
        self.logger.info("STARTING DAILY UPDATE")
        self.logger.info("="*80)

        start_time = datetime.now()

        # 1. Crawl AWS Blogs (last 7 days to catch weekend posts)
        self.logger.info("\n[1/4] Crawling AWS Blogs...")
        try:
            blog_crawler = AWSBlogsCrawler(
                categories=["devops", "architecture", "containers", "compute"]
            )
            blog_results = blog_crawler.crawl(days_back=7, fetch_full_content=False)
            self.results["blogs"] = blog_results
        except Exception as e:
            self.logger.error(f"Blogs crawler failed: {e}")
            self.results["blogs"] = {"error": str(e)}

        # 2. Crawl AWS YouTube (last 14 days)
        self.logger.info("\n[2/4] Crawling AWS YouTube...")
        try:
            youtube_crawler = AWSYouTubeCrawler()
            youtube_results = youtube_crawler.crawl(
                playlists=["aws-devops", "aws-tutorials"],
                days_back=14,
                max_videos_per_playlist=20,
                fetch_transcripts=True
            )
            self.results["youtube"] = youtube_results
        except Exception as e:
            self.logger.error(f"YouTube crawler failed: {e}")
            self.results["youtube"] = {"error": str(e)}

        # 3. Crawl AWS Documentation (last 7 days, limited)
        self.logger.info("\n[3/4] Crawling AWS Documentation...")
        try:
            docs_crawler = AWSDocsCrawler(
                services=["ec2", "s3", "lambda", "ecs", "cloudformation"]
            )
            docs_results = docs_crawler.crawl(days_back=7, max_pages=50)
            self.results["docs"] = docs_results
        except Exception as e:
            self.logger.error(f"Docs crawler failed: {e}")
            self.results["docs"] = {"error": str(e)}

        # 4. Process content with Claude AI
        if process_content:
            self.logger.info("\n[4/4] Processing content with Claude AI...")
            try:
                processor = ContentProcessor(model="claude-3-haiku-20240307")
                processing_results = processor.process_batch(
                    batch_size=50,
                    quality_threshold=quality_threshold
                )
                self.results["processing"] = processing_results
            except Exception as e:
                self.logger.error(f"Content processing failed: {e}")
                self.results["processing"] = {"error": str(e)}
        else:
            self.logger.info("\n[4/4] Skipping content processing (disabled)")

        # Calculate total duration
        duration = (datetime.now() - start_time).total_seconds()

        # Print final summary
        self._print_summary(duration)

        return self.results

    def run_full_crawl(
        self,
        max_items_per_source: int = 500,
        process_content: bool = True
    ) -> Dict:
        """
        Run comprehensive crawl of all sources

        Args:
            max_items_per_source: Maximum items to crawl per source
            process_content: Whether to run AI processing

        Returns:
            Results dictionary
        """
        self.logger.info("="*80)
        self.logger.info("STARTING FULL CRAWL")
        self.logger.info("="*80)

        start_time = datetime.now()

        # 1. Crawl ALL AWS Blogs categories
        self.logger.info("\n[1/4] Crawling ALL AWS Blogs...")
        try:
            blog_crawler = AWSBlogsCrawler()  # All categories
            blog_results = blog_crawler.crawl(days_back=0, fetch_full_content=False)
            self.results["blogs"] = blog_results
        except Exception as e:
            self.logger.error(f"Blogs crawler failed: {e}")
            self.results["blogs"] = {"error": str(e)}

        # 2. Crawl ALL AWS YouTube playlists
        self.logger.info("\n[2/4] Crawling ALL AWS YouTube...")
        try:
            youtube_crawler = AWSYouTubeCrawler()
            youtube_results = youtube_crawler.crawl(
                playlists=None,  # All playlists
                days_back=0,
                max_videos_per_playlist=max_items_per_source,
                fetch_transcripts=True
            )
            self.results["youtube"] = youtube_results
        except Exception as e:
            self.logger.error(f"YouTube crawler failed: {e}")
            self.results["youtube"] = {"error": str(e)}

        # 3. Crawl AWS Documentation (all services)
        self.logger.info("\n[3/4] Crawling AWS Documentation...")
        try:
            docs_crawler = AWSDocsCrawler(services=None)  # All services
            docs_results = docs_crawler.crawl(
                days_back=0,
                max_pages=max_items_per_source
            )
            self.results["docs"] = docs_results
        except Exception as e:
            self.logger.error(f"Docs crawler failed: {e}")
            self.results["docs"] = {"error": str(e)}

        # 4. Process content
        if process_content:
            self.logger.info("\n[4/4] Processing content with Claude AI...")
            try:
                processor = ContentProcessor()
                # Process in larger batches for full crawl
                processing_results = processor.process_batch(
                    batch_size=200,
                    quality_threshold=0.5
                )
                self.results["processing"] = processing_results
            except Exception as e:
                self.logger.error(f"Content processing failed: {e}")
                self.results["processing"] = {"error": str(e)}

        duration = (datetime.now() - start_time).total_seconds()
        self._print_summary(duration)

        return self.results

    def run_processing_only(
        self,
        batch_size: int = 100,
        quality_threshold: float = 0.5
    ) -> Dict:
        """
        Run AI processing on unprocessed content

        Args:
            batch_size: Number of items to process
            quality_threshold: Minimum quality score

        Returns:
            Results dictionary
        """
        self.logger.info("="*80)
        self.logger.info("STARTING CONTENT PROCESSING")
        self.logger.info("="*80)

        start_time = datetime.now()

        try:
            processor = ContentProcessor()
            results = processor.process_batch(
                batch_size=batch_size,
                quality_threshold=quality_threshold
            )
            self.results["processing"] = results
        except Exception as e:
            self.logger.error(f"Content processing failed: {e}")
            self.results["processing"] = {"error": str(e)}

        duration = (datetime.now() - start_time).total_seconds()
        self._print_summary(duration)

        return self.results

    def _print_summary(self, duration: float):
        """
        Print execution summary

        Args:
            duration: Total execution time in seconds
        """
        self.logger.info("\n" + "="*80)
        self.logger.info("ORCHESTRATOR EXECUTION SUMMARY")
        self.logger.info("="*80)

        total_processed = 0
        total_successful = 0
        total_failed = 0
        total_duplicates = 0

        for source, results in self.results.items():
            if isinstance(results, dict) and "error" not in results:
                self.logger.info(f"\n{source.upper()}:")
                self.logger.info(f"  Processed: {results.get('total_processed', 0)}")
                self.logger.info(f"  Successful: {results.get('successful', 0)}")
                self.logger.info(f"  Failed: {results.get('failed', 0)}")
                self.logger.info(f"  Duplicates: {results.get('duplicates', 0)}")

                total_processed += results.get('total_processed', 0)
                total_successful += results.get('successful', 0)
                total_failed += results.get('failed', 0)
                total_duplicates += results.get('duplicates', 0)
            else:
                self.logger.error(f"\n{source.upper()}: ERROR")

        self.logger.info("\n" + "-"*80)
        self.logger.info("TOTALS:")
        self.logger.info(f"  Total Processed: {total_processed}")
        self.logger.info(f"  Total Successful: {total_successful}")
        self.logger.info(f"  Total Failed: {total_failed}")
        self.logger.info(f"  Total Duplicates: {total_duplicates}")
        self.logger.info(f"  Total Duration: {format_duration(int(duration))}")
        self.logger.info("="*80 + "\n")


def main():
    """CLI entry point"""
    parser = argparse.ArgumentParser(
        description="AWS Content Crawling Orchestrator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Daily incremental update
  python orchestrator.py --operation daily-update

  # Full comprehensive crawl
  python orchestrator.py --operation full-crawl

  # Process unprocessed content only
  python orchestrator.py --operation process-content --batch-size 100

  # Daily update without AI processing
  python orchestrator.py --operation daily-update --no-process
        """
    )

    parser.add_argument(
        "--operation",
        required=True,
        choices=["daily-update", "full-crawl", "process-content"],
        help="Operation to perform"
    )
    parser.add_argument(
        "--no-process",
        action="store_true",
        help="Skip AI content processing"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=100,
        help="Batch size for processing (default: 100)"
    )
    parser.add_argument(
        "--quality-threshold",
        type=float,
        default=0.5,
        help="Minimum quality score 0.0-1.0 (default: 0.5)"
    )
    parser.add_argument(
        "--max-items",
        type=int,
        default=500,
        help="Max items per source for full crawl (default: 500)"
    )

    args = parser.parse_args()

    # Create logs directory
    os.makedirs("logs", exist_ok=True)

    # Run orchestrator
    orchestrator = CrawlingOrchestrator()

    if args.operation == "daily-update":
        orchestrator.run_daily_update(
            process_content=not args.no_process,
            quality_threshold=args.quality_threshold
        )
    elif args.operation == "full-crawl":
        orchestrator.run_full_crawl(
            max_items_per_source=args.max_items,
            process_content=not args.no_process
        )
    elif args.operation == "process-content":
        orchestrator.run_processing_only(
            batch_size=args.batch_size,
            quality_threshold=args.quality_threshold
        )


if __name__ == "__main__":
    main()
