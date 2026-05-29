"""
TalentMatch AI - Analysis Router
Triggers AI scoring, returns candidates, and rankings
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import User, Candidate, JobDescription, AnalysisResult, RecommendationEnum
from app.schemas import (
    AnalyzeRequest, CandidateListItem, CandidateDetail,
    MessageResponse, AnalyticsResponse, ScoreDistribution, SkillFrequency
)
from app.utils.security import get_current_user
from app.services.ai_scorer import ai_scorer
import logging
from collections import Counter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analyze", tags=["Analysis"])


@router.post("/{jd_id}", response_model=MessageResponse)
def run_analysis(
    jd_id: int,
    candidate_ids: Optional[List[int]] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Run AI analysis for all candidates against the specified JD.
    Assigns scores, ranks, and recommendations.
    """
    # Validate JD
    jd = db.query(JobDescription).filter(
        JobDescription.id == jd_id,
        JobDescription.user_id == current_user.id
    ).first()

    if not jd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="JD not found")

    # Get candidates
    query = db.query(Candidate).filter(
        Candidate.jd_id == jd_id,
        Candidate.user_id == current_user.id,
        Candidate.is_parsed == True
    )

    if candidate_ids:
        query = query.filter(Candidate.id.in_(candidate_ids))

    candidates = query.all()

    if not candidates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No parsed candidates found for this JD"
        )

    # Prepare JD data dict for scorer
    jd_data = {
        "content": jd.content,
        "required_skills": jd.required_skills or [],
        "preferred_skills": jd.preferred_skills or [],
        "required_experience_years": jd.required_experience_years or 0.0,
        "required_education": jd.required_education,
        "parsed_keywords": jd.parsed_keywords or [],
    }

    scored_candidates = []

    for candidate in candidates:
        try:
            # Prepare candidate data
            candidate_skills = [s.skill for s in candidate.skills]
            candidate_data = {
                "name": candidate.name,
                "resume_text": candidate.resume_text or "",
                "skills": candidate_skills,
                "years_of_experience": candidate.years_of_experience or 0.0,
                "education_level": candidate.education_level,
                "education_details": candidate.education_details or [],
                "work_experience": candidate.work_experience or [],
                "projects": candidate.projects or [],
                "certifications": candidate.certifications or [],
                "linkedin_url": candidate.linkedin_url,
                "github_url": candidate.github_url,
            }

            # Score candidate
            score_result = ai_scorer.score_candidate(
                candidate_data=candidate_data,
                jd_data=jd_data,
                candidate_embedding=candidate.embedding_vector,
                jd_embedding=jd.embedding_vector,
            )

            scored_candidates.append({
                "candidate_id": candidate.id,
                "total_score": score_result["total_score"],
                "score_result": score_result,
            })

        except Exception as e:
            logger.error(f"Scoring failed for candidate {candidate.id}: {e}")
            scored_candidates.append({
                "candidate_id": candidate.id,
                "total_score": 0.0,
                "score_result": None,
            })

    # Assign ranks
    ranked = ai_scorer.assign_ranks(scored_candidates)

    # Save to DB
    for item in ranked:
        if not item["score_result"]:
            continue

        sr = item["score_result"]
        candidate_id = item["candidate_id"]

        # Delete existing result if any
        db.query(AnalysisResult).filter(
            AnalysisResult.candidate_id == candidate_id
        ).delete()

        result = AnalysisResult(
            candidate_id=candidate_id,
            jd_id=jd_id,
            total_score=sr["total_score"],
            skills_score=sr["skills_score"],
            experience_score=sr["experience_score"],
            education_score=sr["education_score"],
            keyword_score=sr["keyword_score"],
            project_score=sr["project_score"],
            embedding_similarity=sr["embedding_similarity"],
            raw_skill_match=sr["raw_skill_match"],
            raw_experience_match=sr["raw_experience_match"],
            raw_education_match=sr["raw_education_match"],
            raw_keyword_match=sr["raw_keyword_match"],
            raw_project_match=sr["raw_project_match"],
            rank=item["rank"],
            recommendation=sr["recommendation"],
            strengths=sr["strengths"],
            weaknesses=sr["weaknesses"],
            missing_skills=sr["missing_skills"],
            matched_skills=sr["matched_skills"],
            score_breakdown=sr["score_breakdown"],
            ai_summary=sr["ai_summary"],
        )
        db.add(result)

        # Mark candidate as analyzed
        db.query(Candidate).filter(Candidate.id == candidate_id).update(
            {"is_analyzed": True}
        )

    db.commit()

    logger.info(f"Analysis complete: {len(ranked)} candidates scored for JD {jd_id}")

    return MessageResponse(
        message=f"Successfully analyzed {len(ranked)} candidates. Rankings have been updated."
    )


@router.get("/candidates/{jd_id}", response_model=List[CandidateListItem])
def get_ranked_candidates(
    jd_id: int,
    search: Optional[str] = Query(None, description="Search by name, email, or skill"),
    min_score: Optional[float] = Query(None, ge=0, le=100),
    max_score: Optional[float] = Query(None, ge=0, le=100),
    min_experience: Optional[float] = Query(None, ge=0),
    max_experience: Optional[float] = Query(None),
    education: Optional[str] = Query(None),
    recommendation: Optional[str] = Query(None),
    sort_by: str = Query("score_desc", enum=["score_desc", "score_asc", "newest", "oldest"]),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get ranked candidates for a JD with filtering, searching, and sorting.
    """
    from sqlalchemy import asc, desc

    jd = db.query(JobDescription).filter(
        JobDescription.id == jd_id,
        JobDescription.user_id == current_user.id
    ).first()

    if not jd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="JD not found")

    query = db.query(Candidate).filter(
        Candidate.jd_id == jd_id,
        Candidate.user_id == current_user.id
    )

    # Search filter
    if search:
        from sqlalchemy import or_
        from app.models import CandidateSkill
        skill_subquery = db.query(CandidateSkill.candidate_id).filter(
            CandidateSkill.skill.ilike(f"%{search}%")
        ).subquery()

        query = query.filter(
            or_(
                Candidate.name.ilike(f"%{search}%"),
                Candidate.email.ilike(f"%{search}%"),
                Candidate.id.in_(skill_subquery)
            )
        )

    # Experience filter
    if min_experience is not None:
        query = query.filter(Candidate.years_of_experience >= min_experience)
    if max_experience is not None:
        query = query.filter(Candidate.years_of_experience <= max_experience)

    # Education filter
    if education:
        query = query.filter(Candidate.education_level.ilike(f"%{education}%"))

    # Apply sort
    if sort_by == "newest":
        query = query.order_by(desc(Candidate.created_at))
    elif sort_by == "oldest":
        query = query.order_by(asc(Candidate.created_at))
    else:
        # Join with analysis results for score sorting
        from app.models import AnalysisResult
        query = query.outerjoin(AnalysisResult, Candidate.id == AnalysisResult.candidate_id)
        if sort_by == "score_desc":
            query = query.order_by(desc(AnalysisResult.total_score))
        else:
            query = query.order_by(asc(AnalysisResult.total_score))

    candidates = query.offset(skip).limit(limit).all()

    # Filter by score (post-join, since analysis might not exist)
    result = []
    for c in candidates:
        item = CandidateListItem.model_validate(c)
        if item.analysis_result:
            if min_score is not None and item.analysis_result.total_score < min_score:
                continue
            if max_score is not None and item.analysis_result.total_score > max_score:
                continue
            if recommendation and item.analysis_result.recommendation != recommendation:
                continue
        result.append(item)

    return result


@router.get("/candidate/{candidate_id}", response_model=CandidateDetail)
def get_candidate_detail(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get full candidate details with AI analysis."""
    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id,
        Candidate.user_id == current_user.id
    ).first()

    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    return CandidateDetail.model_validate(candidate)
