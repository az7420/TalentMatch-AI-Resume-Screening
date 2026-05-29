"""
TalentMatch AI - Resume Upload Router
Handles bulk resume uploads, parsing, and management
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import User, Candidate, CandidateSkill, JobDescription, SkillTypeEnum
from app.schemas import UploadResponse, CandidateListItem, CandidateDetail, MessageResponse
from app.utils.security import get_current_user
from app.utils.file_handler import file_handler
from app.services.resume_parser import resume_parser
from app.services.ai_scorer import ai_scorer
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/resumes", tags=["Resumes"])


@router.post("/upload", response_model=UploadResponse)
async def upload_resumes(
    jd_id: int = Form(...),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload multiple resumes for a specific JD.
    Parses and stores each resume asynchronously.
    """
    # Validate JD exists and belongs to user
    jd = db.query(JobDescription).filter(
        JobDescription.id == jd_id,
        JobDescription.user_id == current_user.id
    ).first()

    if not jd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job Description not found")

    if len(files) > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 50 resumes per upload batch"
        )

    uploaded = []
    errors = []

    for file in files:
        try:
            # Save file
            original_name, file_path = await file_handler.save_resume(file, current_user.id)

            # Extract text
            resume_text = resume_parser.extract_text(file_path)

            # Parse resume
            parsed = resume_parser.parse(file_path, resume_text=resume_text)

            # Create candidate record
            candidate = Candidate(
                user_id=current_user.id,
                jd_id=jd_id,
                name=parsed.get("name", "Unknown"),
                email=parsed.get("email"),
                phone=parsed.get("phone"),
                linkedin_url=parsed.get("linkedin_url"),
                github_url=parsed.get("github_url"),
                location=parsed.get("location"),
                resume_filename=original_name,
                resume_path=file_path,
                resume_text=resume_text,
                years_of_experience=parsed.get("years_of_experience", 0.0),
                education_level=parsed.get("education_level"),
                education_details=parsed.get("education_details", []),
                work_experience=parsed.get("work_experience", []),
                projects=parsed.get("projects", []),
                certifications=parsed.get("certifications", []),
                technologies=parsed.get("technologies", []),
                soft_skills=parsed.get("soft_skills", []),
                languages=parsed.get("languages", []),
                is_parsed=True,
            )
            db.add(candidate)
            db.flush()  # Get ID without committing

            # Generate and store embedding
            embedding = ai_scorer.compute_embedding(resume_text[:8000])
            if embedding:
                candidate.embedding_vector = embedding

            # Add skills
            for skill in parsed.get("skills", []):
                if skill and len(skill.strip()) > 1:
                    skill_type = SkillTypeEnum.LANGUAGE if skill in parsed.get("languages", []) else SkillTypeEnum.TECHNICAL
                    db.add(CandidateSkill(
                        candidate_id=candidate.id,
                        skill=skill.strip(),
                        skill_type=skill_type,
                    ))

            # Add soft skills
            for soft_skill in parsed.get("soft_skills", []):
                if soft_skill:
                    db.add(CandidateSkill(
                        candidate_id=candidate.id,
                        skill=soft_skill.strip(),
                        skill_type=SkillTypeEnum.SOFT,
                    ))

            db.commit()
            uploaded.append({
                "id": candidate.id,
                "name": candidate.name,
                "email": candidate.email,
                "filename": original_name,
            })

        except HTTPException as e:
            errors.append(f"{file.filename}: {e.detail}")
            try:
                db.rollback()
            except Exception:
                pass
        except Exception as e:
            logger.error(f"Failed to process resume {file.filename}: {e}")
            errors.append(f"{file.filename}: Processing failed - {str(e)[:100]}")
            try:
                db.rollback()
            except Exception:
                pass

    return UploadResponse(
        message=f"Successfully uploaded {len(uploaded)} resumes",
        uploaded_count=len(uploaded),
        failed_count=len(errors),
        candidates=uploaded,
        errors=errors,
    )


@router.get("/{jd_id}/list", response_model=List[CandidateListItem])
def list_resumes(
    jd_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all resumes uploaded for a specific JD."""
    # Validate JD ownership
    jd = db.query(JobDescription).filter(
        JobDescription.id == jd_id,
        JobDescription.user_id == current_user.id
    ).first()

    if not jd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="JD not found")

    candidates = (
        db.query(Candidate)
        .filter(Candidate.jd_id == jd_id, Candidate.user_id == current_user.id)
        .order_by(Candidate.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [CandidateListItem.model_validate(c) for c in candidates]


@router.delete("/{candidate_id}", response_model=MessageResponse)
def delete_resume(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a candidate and their resume file."""
    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id,
        Candidate.user_id == current_user.id
    ).first()

    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    # Delete resume file
    file_handler.delete_file(candidate.resume_path)

    db.delete(candidate)
    db.commit()

    return MessageResponse(message="Candidate resume deleted successfully")


@router.get("/download/{candidate_id}")
def download_resume(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Download original resume file."""
    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id,
        Candidate.user_id == current_user.id
    ).first()

    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    from pathlib import Path
    file_path = Path(candidate.resume_path)
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume file not found")

    return FileResponse(
        path=str(file_path),
        filename=candidate.resume_filename,
        media_type="application/octet-stream"
    )
