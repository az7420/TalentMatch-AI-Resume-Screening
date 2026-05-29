/**
 * TalentMatch AI – TypeScript Type Definitions
 */

// ─────────────────────────────────────────
// Auth
// ─────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  company?: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ─────────────────────────────────────────
// Job Description
// ─────────────────────────────────────────
export interface JobDescription {
  id: number;
  title: string;
  content: string;
  required_skills: string[];
  preferred_skills: string[];
  required_experience_years: number;
  required_education?: string;
  parsed_keywords: string[];
  is_active: boolean;
  created_at: string;
  candidate_count: number;
}

// ─────────────────────────────────────────
// Candidate
// ─────────────────────────────────────────
export interface Skill {
  skill: string;
  skill_type: "technical" | "soft" | "tool" | "language";
  proficiency?: string;
}

export interface ScoreBreakdown {
  skills: { score: number; max: number; percentage: number };
  experience: { score: number; max: number; percentage: number };
  education: { score: number; max: number; percentage: number };
  keywords: { score: number; max: number; percentage: number };
  projects: { score: number; max: number; percentage: number };
  embedding_similarity: number;
}

export type Recommendation =
  | "Highly Recommended"
  | "Recommended"
  | "Consider"
  | "Not Recommended";

export interface AnalysisResult {
  id: number;
  total_score: number;
  skills_score: number;
  experience_score: number;
  education_score: number;
  keyword_score: number;
  project_score: number;
  embedding_similarity: number;
  rank?: number;
  recommendation: Recommendation;
  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];
  matched_skills: string[];
  score_breakdown: ScoreBreakdown;
  ai_summary?: string;
  created_at: string;
}

export interface CandidateListItem {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  years_of_experience: number;
  education_level?: string;
  skills: Skill[];
  is_parsed: boolean;
  is_analyzed: boolean;
  resume_filename: string;
  analysis_result?: AnalysisResult;
  created_at: string;
}

export interface Education {
  degree?: string;
  field?: string;
  institution?: string;
  year?: string;
  gpa?: string;
}

export interface WorkExperience {
  title?: string;
  company?: string;
  duration?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  technologies: string[];
}

export interface Project {
  name?: string;
  description?: string;
  technologies: string[];
  url?: string;
}

export interface CandidateDetail extends CandidateListItem {
  linkedin_url?: string;
  github_url?: string;
  education_details: Education[];
  work_experience: WorkExperience[];
  projects: Project[];
  certifications: string[];
  technologies: string[];
  soft_skills: string[];
  languages: string[];
  summary?: string;
}

// ─────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────
export interface SkillFrequency {
  skill: string;
  count: number;
  percentage: number;
}

export interface ScoreDistribution {
  range_label: string;
  count: number;
  percentage: number;
}

export interface Analytics {
  jd_id: number;
  jd_title: string;
  total_candidates: number;
  analyzed_candidates: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  top_candidate?: CandidateListItem;
  recommendation_breakdown: Record<string, number>;
  score_distribution: ScoreDistribution[];
  most_common_skills: SkillFrequency[];
  most_missing_skills: SkillFrequency[];
  hiring_funnel: Record<string, number>;
}

// ─────────────────────────────────────────
// API Responses
// ─────────────────────────────────────────
export interface UploadResponse {
  message: string;
  uploaded_count: number;
  failed_count: number;
  candidates: { id: number; name: string; email?: string; filename: string }[];
  errors: string[];
}

export interface MessageResponse {
  message: string;
  success: boolean;
}
