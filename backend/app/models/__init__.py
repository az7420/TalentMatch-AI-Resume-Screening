"""
TalentMatch AI - SQLAlchemy ORM Models
Complete database schema for all entities
"""

from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean,
    DateTime, ForeignKey, JSON, Enum, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class RecommendationEnum(str, enum.Enum):
    HIGHLY_RECOMMENDED = "Highly Recommended"
    RECOMMENDED = "Recommended"
    CONSIDER = "Consider"
    NOT_RECOMMENDED = "Not Recommended"


class SkillTypeEnum(str, enum.Enum):
    TECHNICAL = "technical"
    SOFT = "soft"
    TOOL = "tool"
    LANGUAGE = "language"


# ─────────────────────────────────────────
# Users
# ─────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    avatar_url = Column(String(500), nullable=True)
    company = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    job_descriptions = relationship("JobDescription", back_populates="user", cascade="all, delete-orphan")
    candidates = relationship("Candidate", back_populates="user", cascade="all, delete-orphan")


# ─────────────────────────────────────────
# Job Descriptions
# ─────────────────────────────────────────
class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    file_path = Column(String(1000), nullable=True)
    required_skills = Column(JSON, default=list)       # List of required skills
    preferred_skills = Column(JSON, default=list)      # List of preferred skills
    required_experience_years = Column(Float, default=0.0)
    required_education = Column(String(100), nullable=True)
    parsed_keywords = Column(JSON, default=list)
    embedding_vector = Column(JSON, nullable=True)     # Stored as list of floats
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="job_descriptions")
    candidates = relationship("Candidate", back_populates="job_description", cascade="all, delete-orphan")
    analysis_results = relationship("AnalysisResult", back_populates="job_description", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_jd_user_id", "user_id"),
    )


# ─────────────────────────────────────────
# Candidates
# ─────────────────────────────────────────
class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    jd_id = Column(Integer, ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False)

    # Contact Information
    name = Column(String(255), nullable=False, default="Unknown")
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    linkedin_url = Column(String(500), nullable=True)
    github_url = Column(String(500), nullable=True)
    location = Column(String(255), nullable=True)

    # Resume Storage
    resume_filename = Column(String(500), nullable=False)
    resume_path = Column(String(1000), nullable=False)
    resume_text = Column(Text, nullable=True)

    # Parsed Information
    years_of_experience = Column(Float, default=0.0)
    education_level = Column(String(100), nullable=True)
    education_details = Column(JSON, default=list)     # List of education objects
    work_experience = Column(JSON, default=list)       # List of experience objects
    projects = Column(JSON, default=list)              # List of project objects
    certifications = Column(JSON, default=list)        # List of certifications
    technologies = Column(JSON, default=list)          # Technologies used
    soft_skills = Column(JSON, default=list)           # Soft skills
    languages = Column(JSON, default=list)             # Programming languages
    summary = Column(Text, nullable=True)

    # Embedding
    embedding_vector = Column(JSON, nullable=True)

    # Status
    is_parsed = Column(Boolean, default=False)
    is_analyzed = Column(Boolean, default=False)
    parse_error = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="candidates")
    job_description = relationship("JobDescription", back_populates="candidates")
    skills = relationship("CandidateSkill", back_populates="candidate", cascade="all, delete-orphan")
    analysis_result = relationship("AnalysisResult", back_populates="candidate", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_candidate_user_id", "user_id"),
        Index("idx_candidate_jd_id", "jd_id"),
    )


# ─────────────────────────────────────────
# Candidate Skills
# ─────────────────────────────────────────
class CandidateSkill(Base):
    __tablename__ = "candidate_skills"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    skill = Column(String(255), nullable=False)
    skill_type = Column(
        Enum(SkillTypeEnum),
        default=SkillTypeEnum.TECHNICAL
    )
    proficiency = Column(String(50), nullable=True)   # beginner/intermediate/expert
    years_used = Column(Float, nullable=True)

    # Relationships
    candidate = relationship("Candidate", back_populates="skills")

    __table_args__ = (
        Index("idx_skill_candidate_id", "candidate_id"),
    )


# ─────────────────────────────────────────
# Analysis Results
# ─────────────────────────────────────────
class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), unique=True, nullable=False)
    jd_id = Column(Integer, ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False)

    # Scores (0-100)
    total_score = Column(Float, default=0.0)
    skills_score = Column(Float, default=0.0)          # max 40
    experience_score = Column(Float, default=0.0)      # max 25
    education_score = Column(Float, default=0.0)       # max 15
    keyword_score = Column(Float, default=0.0)         # max 10
    project_score = Column(Float, default=0.0)         # max 10
    embedding_similarity = Column(Float, default=0.0)  # 0.0 - 1.0

    # Raw component scores (0-1)
    raw_skill_match = Column(Float, default=0.0)
    raw_experience_match = Column(Float, default=0.0)
    raw_education_match = Column(Float, default=0.0)
    raw_keyword_match = Column(Float, default=0.0)
    raw_project_match = Column(Float, default=0.0)

    # Ranking
    rank = Column(Integer, nullable=True)
    recommendation = Column(
        Enum(RecommendationEnum),
        default=RecommendationEnum.NOT_RECOMMENDED
    )

    # Insights
    strengths = Column(JSON, default=list)             # List of strength strings
    weaknesses = Column(JSON, default=list)            # List of weakness strings
    missing_skills = Column(JSON, default=list)        # Skills in JD but not in resume
    matched_skills = Column(JSON, default=list)        # Skills in both JD and resume
    score_breakdown = Column(JSON, default=dict)       # Detailed breakdown object
    ai_summary = Column(Text, nullable=True)           # AI-generated summary

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    candidate = relationship("Candidate", back_populates="analysis_result")
    job_description = relationship("JobDescription", back_populates="analysis_results")

    __table_args__ = (
        Index("idx_analysis_jd_id", "jd_id"),
        Index("idx_analysis_score", "total_score"),
    )
