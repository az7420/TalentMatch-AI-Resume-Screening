"""
TalentMatch AI - Database Seed Script
Creates sample users, JDs, candidates, and analysis results for testing
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, create_tables
from app.models import User, JobDescription, Candidate, CandidateSkill, AnalysisResult, SkillTypeEnum, RecommendationEnum
from app.utils.security import hash_password
from datetime import datetime
import json


def seed():
    create_tables()
    db = SessionLocal()

    print("🌱 Seeding TalentMatch AI database...")

    # ─────────────────────────────────────────
    # Demo User
    # ─────────────────────────────────────────
    existing = db.query(User).filter(User.email == "demo@talentmatch.ai").first()
    if not existing:
        demo_user = User(
            name="Demo Recruiter",
            email="demo@talentmatch.ai",
            hashed_password=hash_password("demo123456"),
            company="TalentMatch Demo Co.",
            is_active=True,
        )
        db.add(demo_user)
        db.flush()
        user_id = demo_user.id
        print(f"  ✅ Created demo user (email: demo@talentmatch.ai, password: demo123456)")
    else:
        user_id = existing.id
        print(f"  ⏭  Demo user already exists")

    # ─────────────────────────────────────────
    # Job Description
    # ─────────────────────────────────────────
    jd_content = """
    Senior Full Stack Engineer

    We are looking for an experienced Senior Full Stack Engineer to join our fast-growing team.

    Requirements:
    - 5+ years of software development experience
    - Strong proficiency in React, Next.js, and TypeScript
    - Backend experience with Node.js, Python, or FastAPI
    - Experience with PostgreSQL, Redis, and cloud databases
    - Familiarity with Docker, Kubernetes, and AWS or GCP
    - Experience with REST APIs and GraphQL
    - Understanding of CI/CD pipelines (GitHub Actions, GitLab CI)
    - Bachelor's degree in Computer Science or related field

    Nice to have:
    - Experience with Machine Learning or AI integrations
    - Knowledge of Kafka or message queues
    - Mobile development experience (React Native or Flutter)

    Responsibilities:
    - Design and implement scalable web applications
    - Lead technical architecture discussions
    - Mentor junior developers
    - Collaborate with product and design teams
    - Participate in code reviews and maintain code quality

    We offer competitive salary, equity, remote work options, and a great team culture.
    """

    jd = JobDescription(
        user_id=user_id,
        title="Senior Full Stack Engineer",
        content=jd_content.strip(),
        required_skills=["react", "typescript", "node.js", "postgresql", "docker", "aws", "python", "graphql"],
        preferred_skills=["kubernetes", "kafka", "react native", "machine learning"],
        required_experience_years=5.0,
        required_education="Bachelor",
        parsed_keywords=["react", "next.js", "typescript", "node.js", "postgresql", "docker", "aws", "gcp", "ci/cd"],
        is_active=True,
    )
    db.add(jd)
    db.flush()
    print(f"  ✅ Created JD: {jd.title}")

    # ─────────────────────────────────────────
    # Candidates + Analysis Results
    # ─────────────────────────────────────────
    candidates_data = [
        {
            "name": "Sarah Chen",
            "email": "sarah.chen@example.com",
            "phone": "+1 (555) 123-4567",
            "location": "San Francisco, CA",
            "years_of_experience": 7.0,
            "education_level": "Master's in Computer Science",
            "skills": ["react", "typescript", "node.js", "postgresql", "docker", "aws", "graphql", "python", "redis"],
            "soft_skills": ["leadership", "communication", "teamwork"],
            "score": 88.5,
            "rec": RecommendationEnum.HIGHLY_RECOMMENDED,
            "rank": 1,
            "matched_skills": ["react", "typescript", "node.js", "postgresql", "docker", "aws", "graphql", "python"],
            "missing_skills": [],
            "strengths": [
                "Strong technical skill match with 8 required skills",
                "Meets experience requirement (7.0+ years)",
                "Meets or exceeds education requirements",
                "Relevant project portfolio (4 projects)",
                "Professional LinkedIn profile provided",
            ],
            "weaknesses": ["GraphQL expertise level unclear"],
        },
        {
            "name": "Marcus Johnson",
            "email": "marcus.j@example.com",
            "phone": "+1 (555) 234-5678",
            "location": "Austin, TX",
            "years_of_experience": 5.5,
            "education_level": "Bachelor's in Software Engineering",
            "skills": ["react", "typescript", "python", "fastapi", "postgresql", "docker", "github actions"],
            "soft_skills": ["problem solving", "agile", "communication"],
            "score": 76.2,
            "rec": RecommendationEnum.RECOMMENDED,
            "rank": 2,
            "matched_skills": ["react", "typescript", "python", "postgresql", "docker"],
            "missing_skills": ["aws", "graphql", "node.js"],
            "strengths": [
                "Meets experience requirement (5.5 years)",
                "Strong React and TypeScript skills",
                "Docker and CI/CD experience",
            ],
            "weaknesses": ["Missing AWS experience", "No GraphQL mentioned"],
        },
        {
            "name": "Priya Patel",
            "email": "priya.patel@example.com",
            "phone": "+1 (555) 345-6789",
            "location": "New York, NY",
            "years_of_experience": 4.0,
            "education_level": "Bachelor's in Computer Science",
            "skills": ["react", "javascript", "node.js", "mongodb", "docker", "css", "html"],
            "soft_skills": ["creativity", "teamwork", "attention to detail"],
            "score": 62.8,
            "rec": RecommendationEnum.CONSIDER,
            "rank": 3,
            "matched_skills": ["react", "node.js", "docker"],
            "missing_skills": ["typescript", "postgresql", "aws", "graphql", "python"],
            "strengths": ["React and Node.js experience", "Docker familiarity"],
            "weaknesses": [
                "Below required experience (4 years vs 5+ required)",
                "Missing TypeScript, PostgreSQL, AWS",
            ],
        },
        {
            "name": "James Wilson",
            "email": "james.wilson@example.com",
            "phone": "+1 (555) 456-7890",
            "location": "Chicago, IL",
            "years_of_experience": 2.0,
            "education_level": "Bachelor's in Information Technology",
            "skills": ["javascript", "react", "css", "html", "sql"],
            "soft_skills": ["eagerness to learn", "teamwork"],
            "score": 38.4,
            "rec": RecommendationEnum.NOT_RECOMMENDED,
            "rank": 4,
            "matched_skills": ["react"],
            "missing_skills": ["typescript", "node.js", "postgresql", "docker", "aws", "graphql", "python"],
            "strengths": ["Has React experience"],
            "weaknesses": [
                "Significant experience gap (2 years vs 5+ required)",
                "Missing most required technical skills",
                "No cloud or DevOps experience",
            ],
        },
    ]

    for cdata in candidates_data:
        candidate = Candidate(
            user_id=user_id,
            jd_id=jd.id,
            name=cdata["name"],
            email=cdata["email"],
            phone=cdata["phone"],
            location=cdata["location"],
            resume_filename=f"{cdata['name'].lower().replace(' ', '_')}_resume.pdf",
            resume_path=f"uploads/resumes/seed_{cdata['name'].lower().replace(' ', '_')}.pdf",
            resume_text=f"Resume for {cdata['name']}",
            years_of_experience=cdata["years_of_experience"],
            education_level=cdata["education_level"],
            soft_skills=cdata["soft_skills"],
            is_parsed=True,
            is_analyzed=True,
        )
        db.add(candidate)
        db.flush()

        # Add skills
        for skill in cdata["skills"]:
            db.add(CandidateSkill(
                candidate_id=candidate.id,
                skill=skill,
                skill_type=SkillTypeEnum.TECHNICAL,
            ))

        # Calculate component scores
        skills_score = (len(cdata["matched_skills"]) / 8) * 40
        exp_score = min(1.0, cdata["years_of_experience"] / 5.0) * 25
        edu_score = 12.0 if "master" in cdata["education_level"].lower() else 10.0
        kw_score = (len(cdata["matched_skills"]) / 9) * 10
        proj_score = 7.0 if len(cdata["skills"]) > 5 else 3.0

        # Analysis result
        result = AnalysisResult(
            candidate_id=candidate.id,
            jd_id=jd.id,
            total_score=cdata["score"],
            skills_score=round(skills_score, 1),
            experience_score=round(exp_score, 1),
            education_score=edu_score,
            keyword_score=round(kw_score, 1),
            project_score=proj_score,
            embedding_similarity=cdata["score"] / 100.0,
            rank=cdata["rank"],
            recommendation=cdata["rec"],
            matched_skills=cdata["matched_skills"],
            missing_skills=cdata["missing_skills"],
            strengths=cdata["strengths"],
            weaknesses=cdata["weaknesses"],
            ai_summary=f"{cdata['name']} is {'an excellent' if cdata['score'] >= 85 else 'a good' if cdata['score'] >= 70 else 'a potential'} candidate with {cdata['years_of_experience']} years of experience. Score: {cdata['score']}/100.",
            score_breakdown={
                "skills": {"score": round(skills_score, 1), "max": 40},
                "experience": {"score": round(exp_score, 1), "max": 25},
                "education": {"score": edu_score, "max": 15},
                "keywords": {"score": round(kw_score, 1), "max": 10},
                "projects": {"score": proj_score, "max": 10},
            }
        )
        db.add(result)
        print(f"  ✅ Added candidate: {cdata['name']} (Score: {cdata['score']}, Rank: #{cdata['rank']})")

    db.commit()
    db.close()

    print("\n✨ Seed complete!")
    print("─" * 50)
    print("Demo credentials:")
    print("  Email:    demo@talentmatch.ai")
    print("  Password: demo123456")
    print("─" * 50)


if __name__ == "__main__":
    seed()
