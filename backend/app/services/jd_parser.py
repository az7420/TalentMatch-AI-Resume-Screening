"""
TalentMatch AI - JD Parser Service
Parses Job Description text/files to extract required skills,
experience, education requirements, and keywords
"""

import re
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any
from app.services.resume_parser import TECHNICAL_SKILLS, SOFT_SKILLS, EDUCATION_LEVELS

logger = logging.getLogger(__name__)

# Additional JD-specific patterns
EXPERIENCE_REQUIRED_PATTERN = re.compile(
    r'(\d+(?:\.\d+)?)\s*\+?\s*(?:to\s+\d+)?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)',
    re.IGNORECASE
)

EDUCATION_REQUIRED_PATTERN = re.compile(
    r"(bachelor'?s?|master'?s?|ph\.?d\.?|b\.?s\.?|m\.?s\.?|mba|b\.?tech|m\.?tech|"
    r"associate'?s?|diploma)\s+(?:degree\s+)?(?:in\s+[\w\s]+)?",
    re.IGNORECASE
)


class JDParser:
    """
    Parses Job Description content to extract structured requirements
    used by the AI scoring engine.
    """

    def extract_text_from_file(self, file_path: str) -> str:
        """Extract text from JD file (PDF, DOCX, or TXT)."""
        path = Path(file_path)
        ext = path.suffix.lower()

        if ext == ".pdf":
            return self._extract_pdf(file_path)
        elif ext == ".docx":
            return self._extract_docx(file_path)
        elif ext == ".txt":
            return self._extract_txt(file_path)
        else:
            raise ValueError(f"Unsupported JD file type: {ext}")

    def _extract_pdf(self, file_path: str) -> str:
        try:
            import fitz
            doc = fitz.open(file_path)
            text = "\n".join(page.get_text() for page in doc)
            doc.close()
            return text.strip()
        except Exception as e:
            logger.error(f"JD PDF extraction failed: {e}")
            return ""

    def _extract_docx(self, file_path: str) -> str:
        try:
            from docx import Document
            doc = Document(file_path)
            return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        except Exception as e:
            logger.error(f"JD DOCX extraction failed: {e}")
            return ""

    def _extract_txt(self, file_path: str) -> str:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        except Exception as e:
            logger.error(f"JD TXT extraction failed: {e}")
            return ""

    def parse(self, content: str) -> Dict[str, Any]:
        """
        Parse JD content and extract structured requirements.

        Returns:
            Dict with required_skills, preferred_skills, experience, education, keywords
        """
        return {
            "required_skills": self._extract_required_skills(content),
            "preferred_skills": self._extract_preferred_skills(content),
            "required_experience_years": self._extract_required_experience(content),
            "required_education": self._extract_required_education(content),
            "parsed_keywords": self._extract_keywords(content),
        }

    def _extract_required_skills(self, text: str) -> List[str]:
        """Extract must-have skills from JD."""
        required_skills = set()
        text_lower = text.lower()

        # Find "required" / "must have" sections
        required_sections = self._extract_jd_section(text, [
            "requirements", "required skills", "must have", "qualifications",
            "you must have", "minimum qualifications", "required experience"
        ])

        search_text = (required_sections or text).lower()

        for skill in TECHNICAL_SKILLS:
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, search_text):
                required_skills.add(skill)

        return sorted(list(required_skills))

    def _extract_preferred_skills(self, text: str) -> List[str]:
        """Extract nice-to-have skills from JD."""
        preferred_skills = set()

        preferred_sections = self._extract_jd_section(text, [
            "preferred", "nice to have", "bonus", "plus", "desired",
            "preferred qualifications", "advantages"
        ])

        if not preferred_sections:
            return []

        search_text = preferred_sections.lower()
        for skill in TECHNICAL_SKILLS:
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, search_text):
                preferred_skills.add(skill)

        return sorted(list(preferred_skills))

    def _extract_required_experience(self, text: str) -> float:
        """Extract minimum required years of experience."""
        matches = EXPERIENCE_REQUIRED_PATTERN.findall(text)
        if matches:
            years = [float(m) for m in matches]
            return min(years)  # Take the minimum requirement
        return 0.0

    def _extract_required_education(self, text: str) -> Optional[str]:
        """Extract required education level."""
        text_lower = text.lower()

        # Check from highest to lowest
        for label, level in sorted(EDUCATION_LEVELS.items(), key=lambda x: -x[1]):
            if label in text_lower:
                return label.title()

        return None

    def _extract_keywords(self, text: str) -> List[str]:
        """Extract important keywords from JD text."""
        keywords = set()
        text_lower = text.lower()

        # Add all recognized skills as keywords
        all_skills = TECHNICAL_SKILLS | SOFT_SKILLS
        for skill in all_skills:
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower):
                keywords.add(skill)

        # Extract capitalized multi-word phrases (likely important terms)
        cap_phrases = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b', text)
        for phrase in cap_phrases:
            if len(phrase) < 50:
                keywords.add(phrase.lower())

        return sorted(list(keywords))[:50]  # Return top 50 keywords

    def _extract_jd_section(self, text: str, section_names: List[str]) -> Optional[str]:
        """Extract content from a specific section of the JD."""
        lines = text.split('\n')
        section_start = None
        section_content = []

        jd_headers = {
            "responsibilities", "requirements", "qualifications", "preferred",
            "benefits", "about", "overview", "description", "nice to have",
            "must have", "you will", "you'll", "we offer", "compensation"
        }

        for line in lines:
            line_lower = line.strip().lower()

            if section_start is None:
                for name in section_names:
                    if name in line_lower:
                        section_start = True
                        break
            else:
                # Check if we've hit another section
                is_new_section = any(h in line_lower for h in jd_headers
                                     if h not in section_names) and len(line.strip()) < 60
                if is_new_section and len(section_content) > 2:
                    break
                section_content.append(line)

        return "\n".join(section_content) if section_content else None


# Singleton instance
jd_parser = JDParser()
