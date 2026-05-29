"""
TalentMatch AI - File Handler Utility
Handles file upload validation, storage, and retrieval
Designed for easy S3 migration
"""

import os
import uuid
import shutil
import logging
from pathlib import Path
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException, status
from app.config import settings
from app.utils.security import sanitize_filename

logger = logging.getLogger(__name__)


class FileHandler:
    """
    Handles file storage operations.
    Currently uses local filesystem; easily swappable to AWS S3.
    """

    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.resume_dir = self.upload_dir / "resumes"
        self.jd_dir = self.upload_dir / "jd"

        # Ensure directories exist
        self.resume_dir.mkdir(parents=True, exist_ok=True)
        self.jd_dir.mkdir(parents=True, exist_ok=True)

    def validate_file(
        self,
        file: UploadFile,
        allowed_extensions: list[str],
        max_size_mb: Optional[int] = None
    ) -> None:
        """
        Validate file extension and size.

        Raises:
            HTTPException 400 if validation fails.
        """
        max_size = max_size_mb or settings.MAX_FILE_SIZE_MB

        # Check extension
        if file.filename:
            ext = Path(file.filename).suffix.lower()
            if ext not in allowed_extensions:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File type '{ext}' not allowed. Allowed types: {', '.join(allowed_extensions)}"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must have a name"
            )

        # Check for potentially malicious content (basic)
        content_type = file.content_type or ""
        dangerous_types = ["text/html", "application/javascript", "text/javascript"]
        if content_type in dangerous_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File content type not allowed"
            )

    async def save_resume(self, file: UploadFile, user_id: int) -> Tuple[str, str]:
        """
        Save a resume file to disk.

        Returns:
            Tuple of (filename, relative_path)
        """
        self.validate_file(file, settings.ALLOWED_RESUME_TYPES)

        original_name = sanitize_filename(file.filename or "resume")
        ext = Path(original_name).suffix.lower()
        unique_filename = f"{user_id}_{uuid.uuid4().hex}{ext}"
        file_path = self.resume_dir / unique_filename

        try:
            content = await file.read()

            # Check file size
            size_mb = len(content) / (1024 * 1024)
            if size_mb > settings.MAX_FILE_SIZE_MB:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE_MB}MB"
                )

            with open(file_path, "wb") as f:
                f.write(content)

            logger.info(f"Saved resume: {unique_filename} ({size_mb:.2f}MB)")
            return original_name, str(file_path)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to save resume: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save file"
            )

    async def save_jd(self, file: UploadFile, user_id: int) -> Tuple[str, str]:
        """Save a JD file to disk."""
        self.validate_file(file, settings.ALLOWED_JD_TYPES)

        original_name = sanitize_filename(file.filename or "jd")
        ext = Path(original_name).suffix.lower()
        unique_filename = f"jd_{user_id}_{uuid.uuid4().hex}{ext}"
        file_path = self.jd_dir / unique_filename

        try:
            content = await file.read()

            with open(file_path, "wb") as f:
                f.write(content)

            logger.info(f"Saved JD file: {unique_filename}")
            return original_name, str(file_path)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to save JD: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save JD file"
            )

    def delete_file(self, file_path: str) -> bool:
        """Delete a file from storage."""
        try:
            path = Path(file_path)
            if path.exists():
                path.unlink()
                logger.info(f"Deleted file: {file_path}")
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to delete file {file_path}: {e}")
            return False

    def get_file_bytes(self, file_path: str) -> bytes:
        """Read and return file bytes."""
        try:
            with open(file_path, "rb") as f:
                return f.read()
        except FileNotFoundError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )

    # ─────────────────────────────────────────
    # S3 Migration Stub (implement when ready)
    # ─────────────────────────────────────────
    async def upload_to_s3(self, local_path: str, s3_key: str) -> str:
        """
        Upload file to AWS S3.
        Implement this method when migrating from local to S3 storage.
        """
        if not settings.USE_S3_STORAGE:
            raise NotImplementedError("S3 storage not configured")

        import boto3
        s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
        )
        s3.upload_file(local_path, settings.AWS_S3_BUCKET, s3_key)
        return f"https://{settings.AWS_S3_BUCKET}.s3.amazonaws.com/{s3_key}"


# Singleton instance
file_handler = FileHandler()
