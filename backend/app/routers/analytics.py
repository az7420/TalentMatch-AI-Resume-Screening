"""
TalentMatch AI - Analytics Router
Dashboard analytics: score distributions, skill gaps, hiring funnels
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from collections import Counter
from app.database import get_db
from app.models import User, Candidate, JobDescription, AnalysisResult, CandidateSkill
from app.schemas import AnalyticsResponse, ScoreDistribution, SkillFrequency, CandidateListItem
from app.utils.security import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/{jd_id}", response_model=AnalyticsResponse)
def get_analytics(
    jd_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive analytics for a specific JD.
    Returns score distributions, skill gaps, hiring funnel, and top candidate.
    """
    # Validate JD
    jd = db.query(JobDescription).filter(
        JobDescription.id == jd_id,
        JobDescription.user_id == current_user.id
    ).first()

    if not jd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="JD not found")

    # Fetch all candidates and analysis results
    candidates = db.query(Candidate).filter(
        Candidate.jd_id == jd_id,
        Candidate.user_id == current_user.id
    ).all()

    analyzed = [c for c in candidates if c.is_analyzed and c.analysis_result]

    total_candidates = len(candidates)
    analyzed_count = len(analyzed)

    if analyzed_count == 0:
        return AnalyticsResponse(
            jd_id=jd_id,
            jd_title=jd.title,
            total_candidates=total_candidates,
            analyzed_candidates=0,
            average_score=0,
            highest_score=0,
            lowest_score=0,
        )

    # Score statistics
    scores = [c.analysis_result.total_score for c in analyzed]
    avg_score = sum(scores) / len(scores)
    highest_score = max(scores)
    lowest_score = min(scores)

    # Top candidate
    top_candidate = max(analyzed, key=lambda c: c.analysis_result.total_score)

    # Score distribution buckets
    score_buckets = {
        "90-100 (Exceptional)": 0,
        "80-89 (Excellent)": 0,
        "70-79 (Good)": 0,
        "60-69 (Fair)": 0,
        "50-59 (Below Average)": 0,
        "0-49 (Poor)": 0,
    }
    for score in scores:
        if score >= 90:
            score_buckets["90-100 (Exceptional)"] += 1
        elif score >= 80:
            score_buckets["80-89 (Excellent)"] += 1
        elif score >= 70:
            score_buckets["70-79 (Good)"] += 1
        elif score >= 60:
            score_buckets["60-69 (Fair)"] += 1
        elif score >= 50:
            score_buckets["50-59 (Below Average)"] += 1
        else:
            score_buckets["0-49 (Poor)"] += 1

    score_distribution = [
        ScoreDistribution(
            range_label=label,
            count=count,
            percentage=round((count / analyzed_count) * 100, 1)
        )
        for label, count in score_buckets.items()
    ]

    # Recommendation breakdown
    rec_counts = Counter(
        c.analysis_result.recommendation for c in analyzed
    )

    # Most common skills across all candidates
    all_skills = db.query(CandidateSkill.skill).join(
        Candidate, CandidateSkill.candidate_id == Candidate.id
    ).filter(
        Candidate.jd_id == jd_id,
        Candidate.user_id == current_user.id
    ).all()

    skill_counter = Counter(s.skill for s in all_skills)
    common_skills = [
        SkillFrequency(
            skill=skill,
            count=count,
            percentage=round((count / total_candidates) * 100, 1)
        )
        for skill, count in skill_counter.most_common(15)
    ]

    # Most missing skills
    all_missing = []
    for c in analyzed:
        all_missing.extend(c.analysis_result.missing_skills or [])

    missing_counter = Counter(all_missing)
    most_missing = [
        SkillFrequency(
            skill=skill,
            count=count,
            percentage=round((count / analyzed_count) * 100, 1)
        )
        for skill, count in missing_counter.most_common(10)
    ]

    # Hiring funnel
    hiring_funnel = {
        "Total Uploaded": total_candidates,
        "Analyzed": analyzed_count,
        "Highly Recommended": rec_counts.get("Highly Recommended", 0),
        "Recommended": rec_counts.get("Recommended", 0),
        "Consider": rec_counts.get("Consider", 0),
        "Not Recommended": rec_counts.get("Not Recommended", 0),
    }

    return AnalyticsResponse(
        jd_id=jd_id,
        jd_title=jd.title,
        total_candidates=total_candidates,
        analyzed_candidates=analyzed_count,
        average_score=round(avg_score, 1),
        highest_score=round(highest_score, 1),
        lowest_score=round(lowest_score, 1),
        top_candidate=CandidateListItem.model_validate(top_candidate),
        recommendation_breakdown=dict(rec_counts),
        score_distribution=score_distribution,
        most_common_skills=common_skills,
        most_missing_skills=most_missing,
        hiring_funnel=hiring_funnel,
    )
