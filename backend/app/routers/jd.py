"""
TalentMatch AI - Job Description Router
Manage JD creation, upload, listing, and deletion
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import User, JobDescription
from app.schemas import JobDescriptionCreate, JobDescriptionResponse, MessageResponse
from app.utils.security import get_current_user
from app.utils.file_handler import file_handler
from app.services.jd_parser import jd_parser
from app.services.ai_scorer import ai_scorer
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/jd", tags=["Job Descriptions"])


@router.post("/", response_model=JobDescriptionResponse, status_code=status.HTTP_201_CREATED)
def create_jd_from_text(
    payload: JobDescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a JD from manually entered text."""
    parsed = jd_parser.parse(payload.content)

    jd = JobDescription(
        user_id=current_user.id,
        title=payload.title,
        content=payload.content,
        required_skills=parsed["required_skills"],
        preferred_skills=parsed["preferred_skills"],
        required_experience_years=parsed["required_experience_years"],
        required_education=parsed["required_education"],
        parsed_keywords=parsed["parsed_keywords"],
    )

    # Generate JD embedding
    jd_embedding = ai_scorer.compute_embedding(payload.content)
    if jd_embedding:
        jd.embedding_vector = jd_embedding

    db.add(jd)
    db.commit()
    db.refresh(jd)

    logger.info(f"JD created: '{jd.title}' by user {current_user.id}")

    response = JobDescriptionResponse.model_validate(jd)
    response.candidate_count = 0
    return response


@router.post("/upload", response_model=JobDescriptionResponse, status_code=status.HTTP_201_CREATED)
async def upload_jd_file(
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a JD from file (PDF/DOCX/TXT) and extract content."""
    # Save file
    original_name, file_path = await file_handler.save_jd(file, current_user.id)

    # Extract text
    content = jd_parser.extract_text_from_file(file_path)
    if not content or len(content) < 50:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not extract sufficient text from JD file"
        )

    # Parse JD
    parsed = jd_parser.parse(content)

    jd = JobDescription(
        user_id=current_user.id,
        title=title,
        content=content,
        file_path=file_path,
        required_skills=parsed["required_skills"],
        preferred_skills=parsed["preferred_skills"],
        required_experience_years=parsed["required_experience_years"],
        required_education=parsed["required_education"],
        parsed_keywords=parsed["parsed_keywords"],
    )

    # Generate embedding
    jd_embedding = ai_scorer.compute_embedding(content)
    if jd_embedding:
        jd.embedding_vector = jd_embedding

    db.add(jd)
    db.commit()
    db.refresh(jd)

    response = JobDescriptionResponse.model_validate(jd)
    response.candidate_count = 0
    return response


@router.get("/", response_model=List[JobDescriptionResponse])
def list_jds(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all JDs for the current user."""
    jds = (
        db.query(JobDescription)
        .filter(JobDescription.user_id == current_user.id)
        .order_by(JobDescription.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = []
    for jd in jds:
        resp = JobDescriptionResponse.model_validate(jd)
        resp.candidate_count = len(jd.candidates)
        result.append(resp)
    return result


@router.get("/{jd_id}", response_model=JobDescriptionResponse)
def get_jd(
    jd_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific JD by ID."""
    jd = db.query(JobDescription).filter(
        JobDescription.id == jd_id,
        JobDescription.user_id == current_user.id
    ).first()

    if not jd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="JD not found")

    resp = JobDescriptionResponse.model_validate(jd)
    resp.candidate_count = len(jd.candidates)
    return resp


@router.delete("/{jd_id}", response_model=MessageResponse)
def delete_jd(
    jd_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a JD and all associated candidates."""
    jd = db.query(JobDescription).filter(
        JobDescription.id == jd_id,
        JobDescription.user_id == current_user.id
    ).first()

    if not jd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="JD not found")

    # Delete associated files
    if jd.file_path:
        file_handler.delete_file(jd.file_path)

    db.delete(jd)
    db.commit()

    return MessageResponse(message="Job Description deleted successfully")
