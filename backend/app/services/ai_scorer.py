"""
TalentMatch AI - AI Scoring Engine
Core algorithm for matching candidates to job descriptions.

Scoring Formula:
  Final Score = (Embedding Similarity × 0.50)
              + (Skill Match × 0.20)
              + (Experience Match × 0.15)
              + (Education Match × 0.10)
              + (Project Relevance × 0.05)
  Normalized to 0-100.
"""

import re
import logging
import math
from typing import List, Dict, Any, Optional, Tuple
from app.models import RecommendationEnum

logger = logging.getLogger(__name__)

# Education level numeric mapping (imported from models conceptually)
EDUCATION_MAP = {
    "phd": 5, "ph.d": 5, "doctorate": 5, "doctor": 5,
    "master": 4, "msc": 4, "mba": 4, "m.s": 4, "m.tech": 4,
    "bachelor": 3, "bsc": 3, "b.s": 3, "b.tech": 3, "b.e": 3, "undergraduate": 3,
    "associate": 2, "diploma": 2,
    "high school": 1, "secondary": 1,
}


class AIScoringEngine:
    """
    AI-powered candidate-to-JD matching engine combining:
    1. Semantic embeddings (sentence-transformers)
    2. Rule-based skill matching
    3. Experience comparison
    4. Education level matching
    5. Project relevance detection
    """

    def __init__(self):
        self._embedding_model = None
        self._model_loaded = False

    def _get_embedding_model(self):
        """Lazy-load the embedding model."""
        if self._embedding_model is None:
            try:
                from sentence_transformers import SentenceTransformer
                from app.config import settings
                logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
                self._embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
                self._model_loaded = True
                logger.info("Embedding model loaded successfully")
            except ImportError:
                logger.warning("sentence-transformers not installed. Using TF-IDF fallback.")
                self._model_loaded = False
            except Exception as e:
                logger.error(f"Failed to load embedding model: {e}")
                self._model_loaded = False
        return self._embedding_model

    def compute_embedding(self, text: str) -> Optional[List[float]]:
        """Generate embedding vector for text."""
        model = self._get_embedding_model()
        if model and text:
            try:
                embedding = model.encode(text[:8192])  # Token limit
                return embedding.tolist()
            except Exception as e:
                logger.error(f"Embedding generation failed: {e}")
        return None

    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Compute cosine similarity between two vectors."""
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 0.0

        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        magnitude1 = math.sqrt(sum(a ** 2 for a in vec1))
        magnitude2 = math.sqrt(sum(b ** 2 for b in vec2))

        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0

        return dot_product / (magnitude1 * magnitude2)

    def _tfidf_similarity(self, text1: str, text2: str) -> float:
        """
        TF-IDF based similarity as fallback when sentence-transformers unavailable.
        """
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.metrics.pairwise import cosine_similarity
            import numpy as np

            vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
            tfidf_matrix = vectorizer.fit_transform([text1, text2])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return float(similarity)
        except Exception as e:
            logger.warning(f"TF-IDF fallback failed: {e}")
            return self._keyword_overlap_similarity(text1, text2)

    def _keyword_overlap_similarity(self, text1: str, text2: str) -> float:
        """Simple word overlap similarity as last resort."""
        words1 = set(re.findall(r'\b\w{3,}\b', text1.lower()))
        words2 = set(re.findall(r'\b\w{3,}\b', text2.lower()))
        if not words1 or not words2:
            return 0.0
        intersection = words1 & words2
        union = words1 | words2
        return len(intersection) / len(union)

    # ─────────────────────────────────────────
    # Component Scorers (each returns 0.0-1.0)
    # ─────────────────────────────────────────

    def score_skills(
        self,
        candidate_skills: List[str],
        required_skills: List[str],
        preferred_skills: List[str] = None
    ) -> Tuple[float, List[str], List[str]]:
        """
        Score skill match between candidate and JD.

        Returns:
            (score_0_to_1, matched_skills, missing_skills)
        """
        if not required_skills:
            return 0.8, list(candidate_skills), []  # Default high if no requirements

        candidate_set = {s.lower().strip() for s in candidate_skills}
        required_set = {s.lower().strip() for s in required_skills}
        preferred_set = {s.lower().strip() for s in (preferred_skills or [])}

        # Exact matches
        required_matched = candidate_set & required_set
        preferred_matched = candidate_set & preferred_set

        # Partial/fuzzy matches (e.g., "react" matches "react.js")
        for req_skill in required_set - required_matched:
            for cand_skill in candidate_set:
                if req_skill in cand_skill or cand_skill in req_skill:
                    required_matched.add(req_skill)
                    break

        required_missing = required_set - required_matched

        # Score: required skills are 80% weight, preferred 20%
        required_score = len(required_matched) / len(required_set) if required_set else 1.0
        preferred_score = len(preferred_matched) / len(preferred_set) if preferred_set else 0.0

        if preferred_set:
            final_score = required_score * 0.8 + preferred_score * 0.2
        else:
            final_score = required_score

        return (
            min(1.0, final_score),
            sorted(list(required_matched)),
            sorted(list(required_missing))
        )

    def score_experience(
        self,
        candidate_years: float,
        required_years: float
    ) -> float:
        """
        Score experience match.
        Returns 0.0-1.0
        """
        if required_years <= 0:
            return 1.0 if candidate_years >= 1 else 0.8

        if candidate_years >= required_years:
            # Perfect match, slight bonus for extra experience
            bonus = min(0.1, (candidate_years - required_years) * 0.02)
            return min(1.0, 1.0 + bonus)
        else:
            # Partial credit for having some experience
            ratio = candidate_years / required_years
            return max(0.0, ratio * 0.9)  # Max 90% if below requirement

    def score_education(
        self,
        candidate_education: Optional[str],
        required_education: Optional[str]
    ) -> float:
        """
        Score education level match.
        Returns 0.0-1.0
        """
        if not required_education:
            return 0.8  # Default if not specified

        def get_level(edu_str: Optional[str]) -> int:
            if not edu_str:
                return 0
            edu_lower = edu_str.lower()
            for key, level in EDUCATION_MAP.items():
                if key in edu_lower:
                    return level
            return 0

        candidate_level = get_level(candidate_education)
        required_level = get_level(required_education)

        if candidate_level >= required_level:
            return 1.0
        elif candidate_level == required_level - 1:
            return 0.75  # One level below
        elif candidate_level == required_level - 2:
            return 0.5
        else:
            return max(0.0, 0.3 - (required_level - candidate_level) * 0.1)

    def score_keywords(
        self,
        resume_text: str,
        jd_keywords: List[str]
    ) -> float:
        """
        Score keyword presence in resume vs JD keywords.
        Returns 0.0-1.0
        """
        if not jd_keywords or not resume_text:
            return 0.5

        resume_lower = resume_text.lower()
        matched = sum(
            1 for kw in jd_keywords
            if re.search(r'\b' + re.escape(kw.lower()) + r'\b', resume_lower)
        )
        return matched / len(jd_keywords)

    def score_projects(
        self,
        candidate_projects: List[Dict],
        jd_required_skills: List[str],
        jd_content: str
    ) -> float:
        """
        Score project relevance.
        Checks if candidate projects use JD-relevant technologies.
        Returns 0.0-1.0
        """
        if not candidate_projects:
            return 0.0

        if not jd_required_skills:
            return 0.5  # Default if no requirements

        required_set = {s.lower() for s in jd_required_skills}
        total_relevance = 0.0

        for project in candidate_projects:
            project_techs = {t.lower() for t in project.get("technologies", [])}
            project_text = (
                (project.get("name") or "") + " " +
                (project.get("description") or "")
            ).lower()

            # Check tech overlap
            tech_overlap = len(project_techs & required_set)
            keyword_hits = sum(1 for kw in required_set if kw in project_text)

            relevance = min(1.0, (tech_overlap + keyword_hits * 0.5) / len(required_set))
            total_relevance += relevance

        return min(1.0, total_relevance / len(candidate_projects))

    # ─────────────────────────────────────────
    # Main Scoring Method
    # ─────────────────────────────────────────

    def score_candidate(
        self,
        candidate_data: Dict[str, Any],
        jd_data: Dict[str, Any],
        candidate_embedding: Optional[List[float]] = None,
        jd_embedding: Optional[List[float]] = None,
    ) -> Dict[str, Any]:
        """
        Compute full candidate-JD match score.

        Args:
            candidate_data: Parsed candidate info dict
            jd_data: Parsed JD info dict
            candidate_embedding: Pre-computed embedding vector
            jd_embedding: Pre-computed embedding vector

        Returns:
            Complete scoring result dict
        """
        # 1. Embedding similarity
        if candidate_embedding and jd_embedding:
            embedding_similarity = self.cosine_similarity(candidate_embedding, jd_embedding)
        else:
            # Fallback to text similarity
            resume_text = candidate_data.get("resume_text", "")
            jd_content = jd_data.get("content", "")
            if resume_text and jd_content:
                embedding_similarity = self._tfidf_similarity(resume_text, jd_content)
            else:
                embedding_similarity = 0.0

        # 2. Skills match
        skill_score, matched_skills, missing_skills = self.score_skills(
            candidate_skills=candidate_data.get("skills", []),
            required_skills=jd_data.get("required_skills", []),
            preferred_skills=jd_data.get("preferred_skills", []),
        )

        # 3. Experience match
        experience_score = self.score_experience(
            candidate_years=candidate_data.get("years_of_experience", 0.0),
            required_years=jd_data.get("required_experience_years", 0.0),
        )

        # 4. Education match
        education_score = self.score_education(
            candidate_education=candidate_data.get("education_level"),
            required_education=jd_data.get("required_education"),
        )

        # 5. Keywords match
        keyword_score = self.score_keywords(
            resume_text=candidate_data.get("resume_text", ""),
            jd_keywords=jd_data.get("parsed_keywords", []),
        )

        # 6. Project relevance
        project_score = self.score_projects(
            candidate_projects=candidate_data.get("projects", []),
            jd_required_skills=jd_data.get("required_skills", []),
            jd_content=jd_data.get("content", ""),
        )

        # ─────────────────────────────────────────
        # Weighted Final Score (0-100)
        # ─────────────────────────────────────────
        raw_score = (
            embedding_similarity * 0.50 +
            skill_score * 0.20 +
            experience_score * 0.15 +
            education_score * 0.10 +
            project_score * 0.05
        )
        total_score = round(min(100.0, raw_score * 100), 2)

        # ─────────────────────────────────────────
        # Component Scores for Display (out of max)
        # ─────────────────────────────────────────
        skills_display = round(skill_score * 40, 1)         # /40
        experience_display = round(experience_score * 25, 1) # /25
        education_display = round(education_score * 15, 1)   # /15
        keyword_display = round(keyword_score * 10, 1)       # /10
        project_display = round(project_score * 10, 1)       # /10

        # ─────────────────────────────────────────
        # Recommendation
        # ─────────────────────────────────────────
        recommendation = self._get_recommendation(total_score)

        # ─────────────────────────────────────────
        # Strengths & Weaknesses
        # ─────────────────────────────────────────
        strengths, weaknesses = self._generate_insights(
            total_score, skill_score, experience_score,
            education_score, keyword_score, project_score,
            matched_skills, missing_skills,
            candidate_data, jd_data
        )

        # ─────────────────────────────────────────
        # AI Summary
        # ─────────────────────────────────────────
        ai_summary = self._generate_summary(
            candidate_data, total_score, recommendation,
            matched_skills, missing_skills
        )

        return {
            "total_score": total_score,
            "skills_score": skills_display,
            "experience_score": experience_display,
            "education_score": education_display,
            "keyword_score": keyword_display,
            "project_score": project_display,
            "embedding_similarity": round(embedding_similarity, 4),
            "raw_skill_match": round(skill_score, 4),
            "raw_experience_match": round(experience_score, 4),
            "raw_education_match": round(education_score, 4),
            "raw_keyword_match": round(keyword_score, 4),
            "raw_project_match": round(project_score, 4),
            "recommendation": recommendation,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "ai_summary": ai_summary,
            "score_breakdown": {
                "skills": {"score": skills_display, "max": 40, "percentage": round(skill_score * 100, 1)},
                "experience": {"score": experience_display, "max": 25, "percentage": round(experience_score * 100, 1)},
                "education": {"score": education_display, "max": 15, "percentage": round(education_score * 100, 1)},
                "keywords": {"score": keyword_display, "max": 10, "percentage": round(keyword_score * 100, 1)},
                "projects": {"score": project_display, "max": 10, "percentage": round(project_score * 100, 1)},
                "embedding_similarity": round(embedding_similarity * 100, 1),
            }
        }

    def _get_recommendation(self, score: float) -> str:
        """Map total score to hiring recommendation."""
        if score >= 85:
            return RecommendationEnum.HIGHLY_RECOMMENDED
        elif score >= 70:
            return RecommendationEnum.RECOMMENDED
        elif score >= 50:
            return RecommendationEnum.CONSIDER
        else:
            return RecommendationEnum.NOT_RECOMMENDED

    def _generate_insights(
        self,
        total_score: float,
        skill_score: float,
        experience_score: float,
        education_score: float,
        keyword_score: float,
        project_score: float,
        matched_skills: List[str],
        missing_skills: List[str],
        candidate: Dict,
        jd: Dict,
    ) -> Tuple[List[str], List[str]]:
        """Generate human-readable strengths and weaknesses."""
        strengths = []
        weaknesses = []

        # Skills insights
        if skill_score >= 0.8:
            strengths.append(f"Strong technical skill match with {len(matched_skills)} required skills")
        elif skill_score >= 0.5:
            strengths.append(f"Partial skill match with {len(matched_skills)} relevant skills")
        if missing_skills:
            weaknesses.append(f"Missing {len(missing_skills)} required skills: {', '.join(missing_skills[:5])}")

        # Experience insights
        candidate_years = candidate.get("years_of_experience", 0)
        required_years = jd.get("required_experience_years", 0)
        if experience_score >= 0.9:
            strengths.append(f"Meets experience requirement ({candidate_years:.1f}+ years)")
        elif experience_score >= 0.6:
            strengths.append(f"Has {candidate_years:.1f} years of relevant experience")
        else:
            if required_years > 0:
                weaknesses.append(f"Experience gap: has {candidate_years:.1f} years, {required_years:.0f}+ required")

        # Education insights
        if education_score >= 0.9:
            strengths.append("Meets or exceeds education requirements")
        elif education_score < 0.5:
            weaknesses.append("Education level may not meet requirements")

        # Projects
        projects = candidate.get("projects", [])
        if project_score >= 0.7 and projects:
            strengths.append(f"Relevant project portfolio ({len(projects)} projects)")
        elif not projects:
            weaknesses.append("No relevant projects listed in resume")

        # Keyword match
        if keyword_score >= 0.7:
            strengths.append("Resume language closely aligns with job description")
        elif keyword_score < 0.3:
            weaknesses.append("Resume language differs significantly from job description")

        # Contact/profile completeness
        if candidate.get("linkedin_url"):
            strengths.append("Professional LinkedIn profile provided")
        if candidate.get("github_url"):
            strengths.append("GitHub profile available for portfolio review")

        # Certifications
        certs = candidate.get("certifications", [])
        if certs:
            strengths.append(f"Holds {len(certs)} professional certification(s)")

        return strengths[:8], weaknesses[:6]

    def _generate_summary(
        self,
        candidate: Dict,
        score: float,
        recommendation: str,
        matched_skills: List[str],
        missing_skills: List[str],
    ) -> str:
        """Generate a concise AI-written candidate summary."""
        name = candidate.get("name", "This candidate")
        years = candidate.get("years_of_experience", 0)
        edu = candidate.get("education_level", "")

        skills_str = ", ".join(matched_skills[:5]) if matched_skills else "limited matching skills"
        missing_str = ", ".join(missing_skills[:3]) if missing_skills else "none"

        edu_clause = f" with a {edu}" if edu else ""
        years_clause = f" and {years:.1f} years of experience" if years > 0 else ""

        if score >= 85:
            opening = f"{name} is an excellent match for this role"
        elif score >= 70:
            opening = f"{name} is a strong candidate for this position"
        elif score >= 50:
            opening = f"{name} shows potential and could be considered for this role"
        else:
            opening = f"{name} may not be the best fit for this role at this time"

        summary = (
            f"{opening}{edu_clause}{years_clause}. "
            f"Key matching skills include: {skills_str}. "
        )

        if missing_skills:
            summary += f"Notable skill gaps: {missing_str}. "

        summary += f"Overall match score: {score:.0f}/100 — {recommendation}."

        return summary

    def assign_ranks(self, scores: List[Dict]) -> List[Dict]:
        """
        Assign rank numbers to a list of candidate scores, sorted by total_score descending.

        Args:
            scores: List of dicts with 'candidate_id' and 'total_score'

        Returns:
            Same list with 'rank' assigned
        """
        sorted_scores = sorted(scores, key=lambda x: x["total_score"], reverse=True)
        for i, item in enumerate(sorted_scores):
            item["rank"] = i + 1
        return sorted_scores


# Singleton instance
ai_scorer = AIScoringEngine()
