"""
TalentMatch AI - Export Router
CSV and Excel export endpoints for candidate rankings
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import User, Candidate, JobDescription
from app.schemas import CandidateListItem
from app.utils.security import get_current_user
from app.services.export_service import export_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/export", tags=["Export"])


def _get_candidates_data(jd_id: int, user_id: int, db: Session):
    """Helper to fetch and serialize candidates for a JD."""
    jd = db.query(JobDescription).filter(
        JobDescription.id == jd_id,
        JobDescription.user_id == user_id
    ).first()

    if not jd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="JD not found")

    from sqlalchemy import desc
    from app.models import AnalysisResult

    candidates = (
        db.query(Candidate)
        .filter(Candidate.jd_id == jd_id, Candidate.user_id == user_id)
        .outerjoin(AnalysisResult, Candidate.id == AnalysisResult.candidate_id)
        .order_by(desc(AnalysisResult.total_score))
        .all()
    )

    return jd, [CandidateListItem.model_validate(c).model_dump() for c in candidates]


@router.get("/csv/{jd_id}")
def export_csv(
    jd_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export candidate rankings as CSV."""
    jd, candidates_data = _get_candidates_data(jd_id, current_user.id, db)

    csv_bytes = export_service.generate_csv(candidates_data, jd.title)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    filename = f"talentmatch_{jd.title[:30].replace(' ', '_')}_{timestamp}.csv"

    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.get("/excel/{jd_id}")
def export_excel(
    jd_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export candidate rankings as Excel (.xlsx)."""
    jd, candidates_data = _get_candidates_data(jd_id, current_user.id, db)

    excel_bytes = export_service.generate_excel(candidates_data, jd.title)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    filename = f"talentmatch_{jd.title[:30].replace(' ', '_')}_{timestamp}.xlsx"

    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
