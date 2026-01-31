"""
Content Processor with Claude AI
Analyzes AWS content for quality, difficulty, topics, and generates summaries
"""
import json
from typing import Dict, List, Optional
from anthropic import Anthropic
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared import (
    setup_logger,
    get_supabase_client,
    get_anthropic_api_key,
    get_current_timestamp,
    CrawlerStats,
)


class ContentProcessor:
    """AI-powered content processor using Claude"""

    # Quality dimensions
    QUALITY_DIMENSIONS = [
        "technical_depth",
        "practical_value",
        "clarity_score",
        "up_to_dateness",
    ]

    def __init__(self, model: str = "claude-3-haiku-20240307"):
        """
        Initialize Content Processor

        Args:
            model: Claude model to use (haiku for cost efficiency)
        """
        self.logger = setup_logger("content_processor")
        self.supabase = get_supabase_client()
        self.stats = CrawlerStats()

        # Initialize Anthropic client
        api_key = get_anthropic_api_key()
        self.client = Anthropic(api_key=api_key)
        self.model = model

        self.logger.info(f"Using model: {model}")

    def analyze_content(self, content_item: Dict) -> Optional[Dict]:
        """
        Analyze content using Claude AI

        Args:
            content_item: Content dictionary from database

        Returns:
            Analysis results dictionary or None
        """
        title = content_item.get("title", "")
        description = content_item.get("description", "")
        content = content_item.get("content", "")
        content_type = content_item.get("content_type", "")

        # Prepare content for analysis (limit size)
        analysis_text = f"""Title: {title}

Description: {description}

Content: {content[:4000]}"""

        prompt = f"""Analyze this AWS DevOps learning content and provide a structured assessment.

{analysis_text}

Please provide your analysis in the following JSON format:
{{
  "summary": "A concise 2-3 sentence summary of the main topic",
  "difficulty_level": "beginner|intermediate|advanced",
  "quality_scores": {{
    "technical_depth": 0.0-1.0,
    "practical_value": 0.0-1.0,
    "clarity_score": 0.0-1.0,
    "up_to_dateness": 0.0-1.0
  }},
  "aws_services": ["service1", "service2"],
  "topics": ["topic1", "topic2", "topic3"],
  "categories": ["category1", "category2"],
  "key_takeaways": ["takeaway1", "takeaway2", "takeaway3"],
  "target_audience": "Brief description of who would benefit most",
  "estimated_reading_time": minutes as integer
}}

Quality score definitions:
- technical_depth: How deep/advanced the technical concepts are (0=superficial, 1=very deep)
- practical_value: How practically useful/applicable the content is (0=theoretical only, 1=highly practical)
- clarity_score: How clear and well-explained the content is (0=confusing, 1=very clear)
- up_to_dateness: How current and relevant the content is (0=outdated, 1=very current)

Respond ONLY with valid JSON, no additional text."""

        try:
            self.logger.debug(f"Analyzing: {title}")

            # Call Claude API
            message = self.client.messages.create(
                model=self.model,
                max_tokens=2048,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            # Extract response
            response_text = message.content[0].text

            # Parse JSON response
            analysis = json.loads(response_text)

            # Calculate overall quality score
            quality_scores = analysis.get("quality_scores", {})
            overall_quality = sum(quality_scores.values()) / len(quality_scores) if quality_scores else 0

            analysis["overall_quality_score"] = overall_quality

            self.logger.info(
                f"Analyzed: {title} | "
                f"Quality: {overall_quality:.2f} | "
                f"Difficulty: {analysis.get('difficulty_level', 'unknown')}"
            )

            return analysis

        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse JSON response: {e}")
            self.logger.debug(f"Response: {response_text if 'response_text' in locals() else 'N/A'}")
            return None
        except Exception as e:
            self.logger.error(f"Error analyzing content: {e}")
            return None

    def update_content_with_analysis(
        self,
        content_id: str,
        analysis: Dict
    ) -> bool:
        """
        Update content record with analysis results

        Args:
            content_id: Content ID in database
            analysis: Analysis results dictionary

        Returns:
            True if successful, False otherwise
        """
        try:
            # Prepare update data
            update_data = {
                "ai_summary": analysis.get("summary"),
                "difficulty_level": analysis.get("difficulty_level"),
                "technical_depth": analysis.get("quality_scores", {}).get("technical_depth"),
                "practical_value": analysis.get("quality_scores", {}).get("practical_value"),
                "clarity_score": analysis.get("quality_scores", {}).get("clarity_score"),
                "up_to_dateness": analysis.get("quality_scores", {}).get("up_to_dateness"),
                "quality_score": analysis.get("overall_quality_score"),
                "topics": analysis.get("topics", []),
                "categories": analysis.get("categories", []),
                "key_takeaways": analysis.get("key_takeaways", []),
                "target_audience": analysis.get("target_audience"),
                "estimated_reading_time": analysis.get("estimated_reading_time"),
                "is_processed": True,
                "processed_at": get_current_timestamp(),
            }

            # Merge AWS services (don't override existing ones)
            new_services = analysis.get("aws_services", [])
            if new_services:
                # Get existing services
                result = self.supabase.table("aws_content").select("aws_services").eq("id", content_id).execute()
                if result.data and result.data[0]:
                    existing_services = result.data[0].get("aws_services", [])
                    # Merge and deduplicate
                    merged_services = list(set(existing_services + new_services))
                    update_data["aws_services"] = merged_services

            # Update database
            result = self.supabase.table("aws_content").update(update_data).eq("id", content_id).execute()

            if result.data:
                self.stats.increment_successful()
                return True
            else:
                self.stats.increment_failed()
                return False

        except Exception as e:
            self.logger.error(f"Error updating content {content_id}: {e}")
            self.stats.increment_failed()
            return False

    def process_batch(
        self,
        batch_size: int = 10,
        quality_threshold: float = 0.5,
        content_types: Optional[List[str]] = None
    ) -> Dict:
        """
        Process a batch of unprocessed content

        Args:
            batch_size: Number of items to process
            quality_threshold: Minimum quality score to keep (0.0-1.0)
            content_types: Filter by content types (e.g., ["blog_post", "video"])

        Returns:
            Statistics dictionary
        """
        self.logger.info(f"Processing batch of {batch_size} items")
        self.logger.info(f"Quality threshold: {quality_threshold}")

        # Fetch unprocessed content
        query = self.supabase.table("aws_content").select("*").eq("is_processed", False)

        if content_types:
            query = query.in_("content_type", content_types)

        query = query.limit(batch_size)
        result = query.execute()

        items = result.data or []
        self.logger.info(f"Found {len(items)} unprocessed items")

        if not items:
            self.logger.info("No items to process")
            return self.stats.get_summary()

        # Process each item
        for item in items:
            self.stats.increment_processed()

            self.logger.info(
                f"Processing {self.stats.total_processed}/{len(items)}: {item.get('title', 'Untitled')}"
            )

            # Analyze content
            analysis = self.analyze_content(item)

            if not analysis:
                self.stats.increment_failed()
                continue

            # Check quality threshold
            quality_score = analysis.get("overall_quality_score", 0)
            if quality_score < quality_threshold:
                self.logger.warning(
                    f"Quality below threshold ({quality_score:.2f} < {quality_threshold}), "
                    f"marking as processed but low quality"
                )
                # Still mark as processed but flag low quality
                self.supabase.table("aws_content").update({
                    "is_processed": True,
                    "quality_score": quality_score,
                    "processed_at": get_current_timestamp(),
                }).eq("id", item["id"]).execute()
                self.stats.increment_failed()
                continue

            # Update with analysis
            success = self.update_content_with_analysis(item["id"], analysis)

        # Print summary
        self.stats.print_summary(self.logger)

        return self.stats.get_summary()

    def reprocess_low_quality(self, quality_threshold: float = 0.5, batch_size: int = 10) -> Dict:
        """
        Reprocess content that was marked as low quality

        Args:
            quality_threshold: New quality threshold
            batch_size: Number of items to process

        Returns:
            Statistics dictionary
        """
        self.logger.info(f"Reprocessing low quality content (threshold: {quality_threshold})")

        # Fetch low quality content
        result = self.supabase.table("aws_content").select("*").eq(
            "is_processed", True
        ).lt("quality_score", quality_threshold).limit(batch_size).execute()

        items = result.data or []
        self.logger.info(f"Found {len(items)} low quality items")

        if not items:
            return self.stats.get_summary()

        # Process each item
        for item in items:
            self.stats.increment_processed()

            analysis = self.analyze_content(item)
            if analysis:
                self.update_content_with_analysis(item["id"], analysis)

        self.stats.print_summary(self.logger)
        return self.stats.get_summary()


def main():
    """CLI entry point"""
    import argparse

    parser = argparse.ArgumentParser(description="AWS Content Processor with Claude AI")
    parser.add_argument(
        "--batch-size",
        type=int,
        default=10,
        help="Number of items to process"
    )
    parser.add_argument(
        "--quality-threshold",
        type=float,
        default=0.5,
        help="Minimum quality score (0.0-1.0)"
    )
    parser.add_argument(
        "--content-types",
        nargs="+",
        help="Filter by content types (e.g., blog_post video documentation)"
    )
    parser.add_argument(
        "--model",
        default="claude-3-haiku-20240307",
        help="Claude model to use"
    )
    parser.add_argument(
        "--reprocess",
        action="store_true",
        help="Reprocess low quality content"
    )

    args = parser.parse_args()

    processor = ContentProcessor(model=args.model)

    if args.reprocess:
        processor.reprocess_low_quality(args.quality_threshold, args.batch_size)
    else:
        processor.process_batch(
            batch_size=args.batch_size,
            quality_threshold=args.quality_threshold,
            content_types=args.content_types
        )


if __name__ == "__main__":
    main()
