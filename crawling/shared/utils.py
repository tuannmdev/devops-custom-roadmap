"""
Shared utility functions for AWS content crawlers
"""
import os
import logging
import sys
from datetime import datetime
from typing import Optional, Dict, Any
from dotenv import load_dotenv
from supabase import create_client, Client
import colorlog

# Load environment variables
load_dotenv()


def setup_logger(name: str, log_file: Optional[str] = None) -> logging.Logger:
    """
    Setup colored console logger with optional file output

    Args:
        name: Logger name
        log_file: Optional log file path

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # Remove existing handlers
    logger.handlers = []

    # Console handler with colors
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)

    console_formatter = colorlog.ColoredFormatter(
        "%(log_color)s%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        log_colors={
            "DEBUG": "cyan",
            "INFO": "green",
            "WARNING": "yellow",
            "ERROR": "red",
            "CRITICAL": "red,bg_white",
        }
    )
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    # File handler (optional)
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.INFO)
        file_formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)

    return logger


def get_supabase_client() -> Client:
    """
    Create and return Supabase client

    Returns:
        Supabase client instance

    Raises:
        ValueError: If required environment variables are missing
    """
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")

    if not url or not key:
        raise ValueError(
            "Missing required environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_KEY"
        )

    return create_client(url, key)


def get_anthropic_api_key() -> str:
    """
    Get Anthropic API key from environment

    Returns:
        API key string

    Raises:
        ValueError: If API key is not set
    """
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("Missing required environment variable: ANTHROPIC_API_KEY")

    return api_key


def get_youtube_api_key() -> str:
    """
    Get YouTube Data API key from environment

    Returns:
        API key string

    Raises:
        ValueError: If API key is not set
    """
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        raise ValueError("Missing required environment variable: YOUTUBE_API_KEY")

    return api_key


def sanitize_text(text: str) -> str:
    """
    Clean and sanitize text content

    Args:
        text: Raw text string

    Returns:
        Cleaned text string
    """
    if not text:
        return ""

    # Remove excessive whitespace
    text = " ".join(text.split())

    # Remove null bytes
    text = text.replace("\x00", "")

    return text.strip()


def extract_domain(url: str) -> str:
    """
    Extract domain from URL

    Args:
        url: Full URL string

    Returns:
        Domain name
    """
    from urllib.parse import urlparse

    parsed = urlparse(url)
    return parsed.netloc


def is_duplicate_url(supabase: Client, url: str) -> bool:
    """
    Check if URL already exists in aws_content table

    Args:
        supabase: Supabase client
        url: URL to check

    Returns:
        True if URL exists, False otherwise
    """
    try:
        result = supabase.table("aws_content").select("id").eq("url", url).execute()
        return len(result.data) > 0
    except Exception as e:
        logging.error(f"Error checking duplicate URL: {e}")
        return False


def format_duration(seconds: int) -> str:
    """
    Format duration in seconds to human-readable string

    Args:
        seconds: Duration in seconds

    Returns:
        Formatted string (e.g., "1h 23m 45s")
    """
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60

    parts = []
    if hours > 0:
        parts.append(f"{hours}h")
    if minutes > 0:
        parts.append(f"{minutes}m")
    if secs > 0 or not parts:
        parts.append(f"{secs}s")

    return " ".join(parts)


def get_current_timestamp() -> str:
    """
    Get current timestamp in ISO format

    Returns:
        ISO formatted timestamp string
    """
    return datetime.utcnow().isoformat()


class CrawlerStats:
    """Track crawler statistics"""

    def __init__(self):
        self.total_processed = 0
        self.successful = 0
        self.failed = 0
        self.duplicates = 0
        self.start_time = datetime.now()

    def increment_processed(self):
        """Increment total processed count"""
        self.total_processed += 1

    def increment_successful(self):
        """Increment successful count"""
        self.successful += 1

    def increment_failed(self):
        """Increment failed count"""
        self.failed += 1

    def increment_duplicates(self):
        """Increment duplicates count"""
        self.duplicates += 1

    def get_duration(self) -> float:
        """Get elapsed time in seconds"""
        return (datetime.now() - self.start_time).total_seconds()

    def get_summary(self) -> Dict[str, Any]:
        """
        Get statistics summary

        Returns:
            Dictionary with stats
        """
        duration = self.get_duration()
        return {
            "total_processed": self.total_processed,
            "successful": self.successful,
            "failed": self.failed,
            "duplicates": self.duplicates,
            "duration_seconds": duration,
            "duration_formatted": format_duration(int(duration)),
            "items_per_second": self.total_processed / duration if duration > 0 else 0
        }

    def print_summary(self, logger: logging.Logger):
        """Print statistics summary to logger"""
        summary = self.get_summary()
        logger.info("=" * 60)
        logger.info("CRAWLER STATISTICS SUMMARY")
        logger.info("=" * 60)
        logger.info(f"Total Processed: {summary['total_processed']}")
        logger.info(f"Successful: {summary['successful']}")
        logger.info(f"Failed: {summary['failed']}")
        logger.info(f"Duplicates: {summary['duplicates']}")
        logger.info(f"Duration: {summary['duration_formatted']}")
        logger.info(f"Speed: {summary['items_per_second']:.2f} items/second")
        logger.info("=" * 60)
