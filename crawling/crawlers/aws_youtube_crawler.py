"""
AWS YouTube Crawler
Crawls AWS YouTube channels and playlists using YouTube Data API v3
Includes automatic transcript extraction
"""
from googleapiclient.discovery import build
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import sys
import os
import re

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared import (
    setup_logger,
    get_supabase_client,
    get_youtube_api_key,
    is_duplicate_url,
    sanitize_text,
    get_current_timestamp,
    CrawlerStats,
)


class AWSYouTubeCrawler:
    """Crawler for AWS YouTube content"""

    # AWS Official Channel ID
    AWS_CHANNEL_ID = "UCd6MoB9NC6uYN2grvUNT-Zg"

    # Key AWS playlists
    PLAYLISTS = {
        "reinvent": "PL2yQDdvlhXf9OtR_NyZCrWrzh_LXlXXEg",  # re:Invent
        "this-is-my-architecture": "PLhr1KZpdzukcOr_6j_zmePaH9cX_lMl_H",
        "aws-training": "PLhr1KZpdzukf1ERxT2lJNIkXm1DF3NlHa",
        "aws-online-tech-talks": "PLhr1KZpdzukeH9gDWNDnm_V_Vp6cqfp1K",
        "aws-tutorials": "PLhr1KZpdzukf0TF2bh4B_k3_OT3FPvr7K",
        "aws-devops": "PLhr1KZpdzukfqGLTAy0Cg23wVFN5JOqHh",
        "aws-containers": "PLhr1KZpdzukdRxs_pGJm-qSy5LayL6W_Y",
    }

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize AWS YouTube Crawler

        Args:
            api_key: YouTube Data API key (uses env var if not provided)
        """
        self.logger = setup_logger("aws_youtube_crawler")
        self.supabase = get_supabase_client()
        self.stats = CrawlerStats()

        # Initialize YouTube API
        self.api_key = api_key or get_youtube_api_key()
        self.youtube = build("youtube", "v3", developerKey=self.api_key)

    def get_playlist_videos(
        self,
        playlist_id: str,
        max_results: int = 50,
        days_back: int = 14
    ) -> List[Dict]:
        """
        Fetch videos from a playlist

        Args:
            playlist_id: YouTube playlist ID
            max_results: Maximum number of videos to fetch
            days_back: Only return videos published in last N days (0 = all)

        Returns:
            List of video dictionaries
        """
        self.logger.info(f"Fetching playlist: {playlist_id}")

        videos = []
        next_page_token = None
        cutoff_date = None

        if days_back > 0:
            cutoff_date = datetime.utcnow() - timedelta(days=days_back)

        try:
            while len(videos) < max_results:
                request = self.youtube.playlistItems().list(
                    part="snippet,contentDetails",
                    playlistId=playlist_id,
                    maxResults=min(50, max_results - len(videos)),
                    pageToken=next_page_token
                )

                response = request.execute()

                for item in response.get("items", []):
                    snippet = item["snippet"]
                    video_id = snippet["resourceId"]["videoId"]

                    # Parse published date
                    published_at = datetime.fromisoformat(
                        snippet["publishedAt"].replace("Z", "+00:00")
                    )

                    # Filter by date
                    if cutoff_date and published_at < cutoff_date:
                        continue

                    videos.append({
                        "video_id": video_id,
                        "title": snippet["title"],
                        "description": snippet.get("description", ""),
                        "published_at": published_at.isoformat(),
                        "thumbnail": snippet["thumbnails"]["high"]["url"],
                        "channel_title": snippet["channelTitle"],
                    })

                next_page_token = response.get("nextPageToken")
                if not next_page_token:
                    break

            self.logger.info(f"Found {len(videos)} videos in playlist")
            return videos

        except Exception as e:
            self.logger.error(f"Error fetching playlist {playlist_id}: {e}")
            return []

    def get_video_details(self, video_id: str) -> Optional[Dict]:
        """
        Fetch detailed information for a video

        Args:
            video_id: YouTube video ID

        Returns:
            Video details dictionary or None
        """
        try:
            request = self.youtube.videos().list(
                part="snippet,contentDetails,statistics",
                id=video_id
            )

            response = request.execute()

            if not response.get("items"):
                return None

            item = response["items"][0]
            snippet = item["snippet"]
            content_details = item["contentDetails"]
            statistics = item["statistics"]

            # Parse duration (ISO 8601 format)
            duration = self._parse_duration(content_details.get("duration", ""))

            return {
                "video_id": video_id,
                "title": snippet["title"],
                "description": snippet.get("description", ""),
                "published_at": snippet["publishedAt"],
                "channel_title": snippet["channelTitle"],
                "tags": snippet.get("tags", []),
                "duration_seconds": duration,
                "view_count": int(statistics.get("viewCount", 0)),
                "like_count": int(statistics.get("likeCount", 0)),
                "thumbnail": snippet["thumbnails"]["high"]["url"],
            }

        except Exception as e:
            self.logger.error(f"Error fetching video {video_id}: {e}")
            return None

    def _parse_duration(self, duration_str: str) -> int:
        """
        Parse ISO 8601 duration to seconds

        Args:
            duration_str: Duration string (e.g., "PT1H23M45S")

        Returns:
            Duration in seconds
        """
        match = re.match(
            r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?",
            duration_str
        )

        if not match:
            return 0

        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)

        return hours * 3600 + minutes * 60 + seconds

    def get_transcript(self, video_id: str) -> Optional[str]:
        """
        Fetch video transcript using youtube-transcript-api

        Args:
            video_id: YouTube video ID

        Returns:
            Full transcript text or None
        """
        try:
            # Try to get English transcript (auto-generated or manual)
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

            # Prefer manually created transcripts
            try:
                transcript = transcript_list.find_manually_created_transcript(["en"])
            except:
                # Fall back to auto-generated
                transcript = transcript_list.find_generated_transcript(["en"])

            # Fetch and combine all transcript segments
            transcript_data = transcript.fetch()
            full_text = " ".join([entry["text"] for entry in transcript_data])

            self.logger.debug(f"Fetched transcript for {video_id} ({len(full_text)} chars)")
            return sanitize_text(full_text)

        except (TranscriptsDisabled, NoTranscriptFound):
            self.logger.debug(f"No transcript available for {video_id}")
            return None
        except Exception as e:
            self.logger.error(f"Error fetching transcript for {video_id}: {e}")
            return None

    def detect_aws_services(self, title: str, description: str, tags: List[str]) -> List[str]:
        """
        Detect AWS services mentioned in video metadata

        Args:
            title: Video title
            description: Video description
            tags: Video tags

        Returns:
            List of AWS service names
        """
        service_keywords = {
            "ec2": ["EC2", "Elastic Compute"],
            "s3": ["S3", "Simple Storage"],
            "lambda": ["Lambda"],
            "rds": ["RDS", "Relational Database"],
            "dynamodb": ["DynamoDB"],
            "ecs": ["ECS", "Container Service"],
            "eks": ["EKS", "Kubernetes"],
            "fargate": ["Fargate"],
            "cloudformation": ["CloudFormation"],
            "cloudwatch": ["CloudWatch"],
            "vpc": ["VPC"],
        }

        text = (title + " " + description + " " + " ".join(tags)).lower()
        detected = set()

        for service, keywords in service_keywords.items():
            for keyword in keywords:
                if keyword.lower() in text:
                    detected.add(service)

        return list(detected)

    def save_to_database(self, video: Dict, transcript: Optional[str] = None) -> bool:
        """
        Save video to Supabase

        Args:
            video: Video dictionary
            transcript: Video transcript (optional)

        Returns:
            True if successful, False otherwise
        """
        try:
            video_url = f"https://www.youtube.com/watch?v={video['video_id']}"

            # Check for duplicates
            if is_duplicate_url(self.supabase, video_url):
                self.logger.debug(f"Skipping duplicate video: {video['title']}")
                self.stats.increment_duplicates()
                return False

            # Detect AWS services
            aws_services = self.detect_aws_services(
                video["title"],
                video["description"],
                video.get("tags", [])
            )

            # Combine description and transcript for content
            content = video["description"]
            if transcript:
                content = f"{content}\n\nTranscript:\n{transcript[:45000]}"

            # Prepare data
            data = {
                "url": video_url,
                "title": video["title"],
                "description": video["description"],
                "content": content,
                "author": video.get("channel_title", "AWS"),
                "published_date": video.get("published_at"),
                "source_type": "video",
                "content_type": "video",
                "aws_services": aws_services,
                "topics": video.get("tags", []),
                "categories": ["video", "tutorial"],
                "video_duration_seconds": video.get("duration_seconds"),
                "video_views": video.get("view_count", 0),
                "is_processed": False,
                "crawled_at": get_current_timestamp(),
            }

            result = self.supabase.table("aws_content").insert(data).execute()

            if result.data:
                self.logger.info(f"Saved: {video['title']}")
                self.stats.increment_successful()
                return True
            else:
                self.stats.increment_failed()
                return False

        except Exception as e:
            self.logger.error(f"Error saving video to database: {e}")
            self.stats.increment_failed()
            return False

    def crawl(
        self,
        playlists: Optional[List[str]] = None,
        days_back: int = 14,
        max_videos_per_playlist: int = 50,
        fetch_transcripts: bool = True
    ) -> Dict:
        """
        Main crawl method

        Args:
            playlists: List of playlist keys to crawl (from PLAYLISTS dict)
                      If None, crawls all playlists
            days_back: Only crawl videos from last N days (0 = all)
            max_videos_per_playlist: Max videos per playlist
            fetch_transcripts: Whether to fetch video transcripts

        Returns:
            Statistics dictionary
        """
        self.logger.info("Starting AWS YouTube crawl")

        # Select playlists
        playlist_keys = playlists or list(self.PLAYLISTS.keys())
        self.logger.info(f"Playlists: {', '.join(playlist_keys)}")
        self.logger.info(f"Days back: {days_back}, Fetch transcripts: {fetch_transcripts}")

        all_videos = []

        # Fetch videos from playlists
        for key in playlist_keys:
            if key not in self.PLAYLISTS:
                self.logger.warning(f"Unknown playlist key: {key}")
                continue

            playlist_id = self.PLAYLISTS[key]
            videos = self.get_playlist_videos(
                playlist_id,
                max_videos_per_playlist,
                days_back
            )
            all_videos.extend(videos)

        self.logger.info(f"Total videos to process: {len(all_videos)}")

        # Process videos
        for video in all_videos:
            self.stats.increment_processed()

            self.logger.info(
                f"Processing {self.stats.total_processed}/{len(all_videos)}: {video['title']}"
            )

            # Get detailed info
            details = self.get_video_details(video["video_id"])
            if not details:
                self.stats.increment_failed()
                continue

            # Get transcript
            transcript = None
            if fetch_transcripts:
                transcript = self.get_transcript(video["video_id"])

            # Save to database
            self.save_to_database(details, transcript)

        # Print summary
        self.stats.print_summary(self.logger)

        return self.stats.get_summary()


def main():
    """CLI entry point"""
    import argparse
    import json
    import re

    parser = argparse.ArgumentParser(description="AWS YouTube Crawler")
    parser.add_argument(
        "--playlists",
        nargs="+",
        help="Playlist keys to crawl (e.g., reinvent aws-devops)"
    )
    parser.add_argument(
        "--days-back",
        type=int,
        default=14,
        help="Only crawl videos from last N days (0 = all)"
    )
    parser.add_argument(
        "--max-videos",
        type=int,
        default=50,
        help="Max videos per playlist"
    )
    parser.add_argument(
        "--no-transcripts",
        action="store_true",
        help="Skip fetching video transcripts"
    )
    parser.add_argument(
        "--video-url",
        type=str,
        help="Crawl a single YouTube video URL"
    )
    parser.add_argument(
        "--playlist-url",
        type=str,
        help="Crawl a YouTube playlist URL"
    )

    args = parser.parse_args()

    crawler = AWSYouTubeCrawler()

    # Single video mode
    if args.video_url:
        try:
            # Extract video ID from URL
            video_id_match = re.search(r"(?:v=|youtu\.be/)([a-zA-Z0-9_-]{11})", args.video_url)
            if not video_id_match:
                print(json.dumps({"success": False, "error": "Invalid YouTube video URL"}))
                return

            video_id = video_id_match.group(1)

            # Get video details
            details = crawler.get_video_details(video_id)
            if not details:
                print(json.dumps({"success": False, "error": "Failed to fetch video details"}))
                return

            # Get transcript
            transcript = None
            if not args.no_transcripts:
                transcript = crawler.get_transcript(video_id)

            # Save to database
            success = crawler.save_to_database(details, transcript)

            # Output JSON result
            result = {
                "title": details["title"],
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "channel_title": details.get("channel_title"),
                "duration": details.get("duration_seconds"),
                "view_count": details.get("view_count"),
                "has_transcript": transcript is not None,
                "success": success,
            }
            print(json.dumps(result))

        except Exception as e:
            print(json.dumps({"success": False, "error": str(e)}))

    # Single playlist mode
    elif args.playlist_url:
        try:
            # Extract playlist ID from URL
            playlist_id_match = re.search(r"list=([a-zA-Z0-9_-]+)", args.playlist_url)
            if not playlist_id_match:
                print(json.dumps({"success": False, "error": "Invalid YouTube playlist URL"}))
                return

            playlist_id = playlist_id_match.group(1)

            # Get playlist videos
            videos = crawler.get_playlist_videos(
                playlist_id,
                max_results=args.max_videos,
                days_back=0  # Get all videos for custom playlist
            )

            if not videos:
                print(json.dumps({"success": False, "error": "No videos found in playlist"}))
                return

            # Process videos
            processed_count = 0
            for video in videos:
                details = crawler.get_video_details(video["video_id"])
                if details:
                    transcript = None
                    if not args.no_transcripts:
                        transcript = crawler.get_transcript(video["video_id"])
                    if crawler.save_to_database(details, transcript):
                        processed_count += 1

            # Output JSON result
            result = {
                "playlist_title": videos[0].get("channel_title", "Unknown") if videos else "Unknown",
                "channel_title": videos[0].get("channel_title", "Unknown") if videos else "Unknown",
                "videoCount": processed_count,
                "success": processed_count > 0,
            }
            print(json.dumps(result))

        except Exception as e:
            print(json.dumps({"success": False, "error": str(e)}))

    # Normal batch mode
    else:
        crawler.crawl(
            playlists=args.playlists,
            days_back=args.days_back,
            max_videos_per_playlist=args.max_videos,
            fetch_transcripts=not args.no_transcripts
        )


if __name__ == "__main__":
    main()
