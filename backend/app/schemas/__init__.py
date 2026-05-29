"""
TalentMatch AI - Pydantic Schemas
Request/response models for all API endpoints
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ─────────────────────────────────────────
# Enums
# ─────────────────────────────────────────
class RecommendationEnum(str, Enum):
    HIGHLY_RECOMMENDED = "Highly Recommended"
    RECOMMENDED = "Recommended"
    CONSIDER = "Consider"
    NOT_RECOMMENDED = "Not Recommended"


class SkillTypeEnum(str, Enum):
    TECHNICAL = "technical"
    SOFT = "soft"
    TOOL = "tool"
    LANGUAGE = "language"


# ─────────────────────────────────────────
# Auth Schemas
# ─────────────────────────────────────────
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    company: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Jane Smith",
                "email": "jane@acme.com",
                "password": "securepassword123",
                "company": "Acme Corp"
            }
        }


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    class Config:
        json_schema_extra = {
            "example": {
                "email": "jane@acme.com",
                "password": "securepassword123"
            }
        }


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    company: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ─────────────────────────────────────────
# Job Description Schemas
# ─────────────────────────────────────────
class JobDescriptionCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=500)
    content: str = Field(..., min_length=50)

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Senior Full Stack Engineer",
                "content": "We are looking for a Senior Full Stack Engineer..."
            }
        }


class JobDescriptionResponse(BaseModel):
    id: int
    title: str
    content: str
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    required_experience_years: float = 0.0
    required_education: Optional[str] = None
    parsed_keywords: List[str] = []
    is_active: bool
    created_at: datetime
    candidate_count: Optional[int] = 0

    class Config:
        from_attributes = True


# ─────────────────────────────────────────
# Candidate Schemas
# ─────────────────────────────────────────
class SkillSchema(BaseModel):
    skill: str
    skill_type: SkillTypeEnum = SkillTypeEnum.TECHNICAL
    proficiency: Optional[str] = None

    class Config:
        from_attributes = True


class EducationSchema(BaseModel):
    degree: Optional[str] = None
    field: Optional[str] = None
    institution: Optional[str] = None
    year: Optional[str] = None
    gpa: Optional[str] = None


class WorkExperienceSchema(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    duration: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    technologies: List[str] = []


class ProjectSchema(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    technologies: List[str] = []
    url: Optional[str] = None


class ScoreBreakdownSchema(BaseModel):
    skills_score: float = 0.0
    skills_max: float = 40.0
    experience_score: float = 0.0
    experience_max: float = 25.0
    education_score: float = 0.0
    education_max: float = 15.0
    keyword_score: float = 0.0
    keyword_max: float = 10.0
    project_score: float = 0.0
    project_max: float = 10.0
    embedding_similarity: float = 0.0


class AnalysisResultSchema(BaseModel):
    id: int
    total_score: float
    skills_score: float
    experience_score: float
    education_score: float
    keyword_score: float
    project_score: float
    embedding_similarity: float
    rank: Optional[int] = None
    recommendation: RecommendationEnum
    strengths: List[str] = []
    weaknesses: List[str] = []
    missing_skills: List[str] = []
    matched_skills: List[str] = []
    score_breakdown: Dict[str, Any] = {}
    ai_summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CandidateListItem(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    years_of_experience: float = 0.0
    education_level: Optional[str] = None
    skills: List[SkillSchema] = []
    is_parsed: bool
    is_analyzed: bool
    resume_filename: str
    analysis_result: Optional[AnalysisResultSchema] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CandidateDetail(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    location: Optional[str] = None
    years_of_experience: float = 0.0
    education_level: Optional[str] = None
    education_details: List[Dict] = []
    work_experience: List[Dict] = []
    projects: List[Dict] = []
    certifications: List[str] = []
    technologies: List[str] = []
    soft_skills: List[str] = []
    languages: List[str] = []
    summary: Optional[str] = None
    resume_filename: str
    is_parsed: bool
    is_analyzed: bool
    skills: List[SkillSchema] = []
    analysis_result: Optional[AnalysisResultSchema] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────
# Analytics Schemas
# ─────────────────────────────────────────
class SkillFrequency(BaseModel):
    skill: str
    count: int
    percentage: float


class ScoreDistribution(BaseModel):
    range_label: str
    count: int
    percentage: float


class AnalyticsResponse(BaseModel):
    jd_id: int
    jd_title: str
    total_candidates: int
    analyzed_candidates: int
    average_score: float
    highest_score: float
    lowest_score: float
    top_candidate: Optional[CandidateListItem] = None
    recommendation_breakdown: Dict[str, int] = {}
    score_distribution: List[ScoreDistribution] = []
    most_common_skills: List[SkillFrequency] = []
    most_missing_skills: List[SkillFrequency] = []
    hiring_funnel: Dict[str, int] = {}


# ─────────────────────────────────────────
# Generic Response Schemas
# ─────────────────────────────────────────
class MessageResponse(BaseModel):
    message: str
    success: bool = True


class AnalyzeRequest(BaseModel):
    jd_id: int
    candidate_ids: Optional[List[int]] = None  # None means all candidates for this JD


class UploadResponse(BaseModel):
    message: str
    uploaded_count: int
    failed_count: int
    candidates: List[Dict[str, Any]] = []
    errors: List[str] = []


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int
