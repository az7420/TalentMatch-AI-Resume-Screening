"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Mail, Phone, MapPin, Linkedin, Github,
  Download, ExternalLink, CheckCircle2, XCircle, Award,
  Briefcase, GraduationCap, Code2, FolderOpen, Star,
  Loader2, Brain
} from "lucide-react";
import { analysisAPI, resumeAPI, getErrorMessage } from "@/lib/api";
import { CandidateDetail } from "@/types";
import {
  getScoreClass, getRecommendationClass, getInitials,
  getRankBadgeClass, formatDate
} from "@/lib/utils";
import toast from "react-hot-toast";

function ScoreCircle({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const color = score >= 85 ? "#10b981" : score >= 70 ? "#3b82f6" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={radius} stroke="hsl(var(--muted))" strokeWidth="10" fill="none" />
        <circle
          cx="60" cy="60" r={radius}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="score-circle transition-all duration-1500"
          style={{ filter: `drop-shadow(0 0 8px ${color}50)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold" style={{ color }}>
          {Math.round(score)}
        </div>
        <div className="text-xs text-muted-foreground">/ 100</div>
      </div>
    </div>
  );
}

export default function CandidateDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const candidateId = Number(params.id);
  const jdId = searchParams.get("jd");

  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "experience" | "skills" | "projects" | "ai">("overview");

  useEffect(() => {
    loadCandidate();
  }, [candidateId]);

  const loadCandidate = async () => {
    try {
      const response = await analysisAPI.getCandidateDetail(candidateId);
      setCandidate(response.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadResume = () => {
    window.open(resumeAPI.downloadUrl(candidateId), "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!candidate) return null;

  const ar = candidate.analysis_result;
  const score = ar?.total_score || 0;
  const rec = ar?.recommendation || "Not Analyzed";

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "experience", label: "Experience" },
    { id: "skills", label: "Skills" },
    { id: "projects", label: "Projects" },
    { id: "ai", label: "AI Analysis" },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back nav */}
      <button
        onClick={() => router.push(jdId ? `/dashboard/candidates?jd=${jdId}` : "/dashboard/candidates")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Candidates
      </button>

      {/* Hero card */}
      <div className="glass-card rounded-2xl p-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Left: Avatar + Info */}
          <div className="flex items-start gap-5 flex-1">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl animated-gradient flex items-center justify-center text-white text-2xl font-bold">
                {getInitials(candidate.name)}
              </div>
              {ar?.rank && (
                <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${getRankBadgeClass(ar.rank)}`}>
                  #{ar.rank}
                </div>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold mb-1">{candidate.name}</h1>
              {candidate.education_level && (
                <div className="text-muted-foreground text-sm mb-3">{candidate.education_level}</div>
              )}

              {/* Contact */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {candidate.email && (
                  <a href={`mailto:${candidate.email}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                    <Mail className="w-3.5 h-3.5" />{candidate.email}
                  </a>
                )}
                {candidate.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />{candidate.phone}
                  </div>
                )}
                {candidate.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />{candidate.location}
                  </div>
                )}
                {candidate.linkedin_url && (
                  <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-500 hover:text-blue-400">
                    <Linkedin className="w-3.5 h-3.5" />LinkedIn
                  </a>
                )}
                {candidate.github_url && (
                  <a href={candidate.github_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-foreground">
                    <Github className="w-3.5 h-3.5" />GitHub
                  </a>
                )}
              </div>

              {/* Recommendation badge */}
              {ar && (
                <div className={`mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${getRecommendationClass(rec)}`}>
                  {score >= 85 ? <Star className="w-3.5 h-3.5 fill-current" /> :
                   score >= 70 ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                   score >= 50 ? <Award className="w-3.5 h-3.5" /> :
                   <XCircle className="w-3.5 h-3.5" />}
                  {rec}
                </div>
              )}
            </div>
          </div>

          {/* Right: Score + Download */}
          <div className="flex flex-col items-center gap-4 md:border-l md:border-border md:pl-8">
            {ar ? (
              <ScoreCircle score={score} />
            ) : (
              <div className="text-center text-muted-foreground">
                <Brain className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <div className="text-sm">Not analyzed yet</div>
              </div>
            )}

            <button
              onClick={handleDownloadResume}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card hover:bg-accent transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Download Resume
            </button>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      {ar && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-semibold mb-5">Score Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Skills", score: ar.skills_score, max: 40, color: "from-blue-500 to-cyan-500" },
              { label: "Experience", score: ar.experience_score, max: 25, color: "from-violet-500 to-purple-500" },
              { label: "Education", score: ar.education_score, max: 15, color: "from-emerald-500 to-teal-500" },
              { label: "Keywords", score: ar.keyword_score, max: 10, color: "from-orange-500 to-amber-500" },
              { label: "Projects", score: ar.project_score, max: 10, color: "from-pink-500 to-rose-500" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className={`text-2xl font-bold gradient-text mb-1`}>
                  {item.score.toFixed(1)}
                  <span className="text-sm text-muted-foreground font-normal">/{item.max}</span>
                </div>
                <div className="progress-bar h-1.5 mb-2">
                  <div className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                    style={{ width: `${(item.score / item.max) * 100}%` }} />
                </div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Semantic Similarity: {(ar.embedding_similarity * 100).toFixed(1)}%</span>
            <span>Analyzed {formatDate(ar.created_at)}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {candidate.summary && (
                <div>
                  <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wider">Summary</h3>
                  <p className="text-sm leading-relaxed">{candidate.summary}</p>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-muted/50 text-center">
                  <div className="text-2xl font-bold gradient-text">{candidate.years_of_experience.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Years Exp.</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 text-center">
                  <div className="text-2xl font-bold gradient-text">{candidate.skills.length}</div>
                  <div className="text-xs text-muted-foreground mt-1">Skills</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 text-center">
                  <div className="text-2xl font-bold gradient-text">{candidate.projects.length}</div>
                  <div className="text-xs text-muted-foreground mt-1">Projects</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 text-center">
                  <div className="text-2xl font-bold gradient-text">{candidate.certifications.length}</div>
                  <div className="text-xs text-muted-foreground mt-1">Certifications</div>
                </div>
              </div>

              {/* Education summary */}
              {candidate.education_details.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />Education
                  </h3>
                  {candidate.education_details.map((edu, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/30 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{edu.degree} {edu.field && `in ${edu.field}`}</div>
                        {edu.institution && <div className="text-xs text-muted-foreground">{edu.institution}</div>}
                        {edu.year && <div className="text-xs text-muted-foreground">{edu.year}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Certifications */}
              {candidate.certifications.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4" />Certifications
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.certifications.map((cert, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        🏆 {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Experience Tab */}
          {activeTab === "experience" && (
            <div className="space-y-4">
              {candidate.work_experience.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No work experience extracted</div>
              ) : (
                candidate.work_experience.map((exp, i) => (
                  <div key={i} className="p-5 rounded-xl border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold">{exp.title || "Role"}</div>
                        <div className="text-sm text-muted-foreground">{exp.company}</div>
                      </div>
                      {exp.duration && (
                        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {exp.duration}
                        </div>
                      )}
                    </div>
                    {exp.description && (
                      <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>
                    )}
                    {exp.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {exp.technologies.map((tech) => (
                          <span key={tech} className="skill-tag">{tech}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === "skills" && (
            <div className="space-y-6">
              {ar && (
                <>
                  {ar.matched_skills.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        Matched Skills ({ar.matched_skills.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {ar.matched_skills.map((skill) => (
                          <span key={skill} className="px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200">
                            ✓ {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {ar.missing_skills.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-600 dark:text-red-400">
                        <XCircle className="w-4 h-4" />
                        Missing Skills ({ar.missing_skills.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {ar.missing_skills.map((skill) => (
                          <span key={skill} className="skill-tag-missing">✗ {skill}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Code2 className="w-4 h-4" />All Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((s) => (
                    <span key={s.skill} className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                      s.skill_type === "soft"
                        ? "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400 border-violet-200"
                        : "skill-tag"
                    }`}>
                      {s.skill}
                    </span>
                  ))}
                </div>
              </div>

              {candidate.soft_skills.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-muted-foreground text-sm">Soft Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.soft_skills.map((s) => (
                      <span key={s} className="px-3 py-1 rounded-full text-sm bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400 border border-violet-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === "projects" && (
            <div className="space-y-4">
              {candidate.projects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No projects extracted from resume</div>
              ) : (
                candidate.projects.map((proj, i) => (
                  <div key={i} className="p-5 rounded-xl border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-semibold flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-primary" />
                        {proj.name || `Project ${i + 1}`}
                      </div>
                      {proj.url && (
                        <a href={proj.url} target="_blank" rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />View
                        </a>
                      )}
                    </div>
                    {proj.description && (
                      <p className="text-sm text-muted-foreground mt-1">{proj.description}</p>
                    )}
                    {proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {proj.technologies.map((tech) => (
                          <span key={tech} className="skill-tag">{tech}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* AI Analysis Tab */}
          {activeTab === "ai" && (
            <div className="space-y-6">
              {!ar ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  This candidate hasn't been analyzed yet. Run the analysis to see AI insights.
                </div>
              ) : (
                <>
                  {/* AI Summary */}
                  {ar.ai_summary && (
                    <div className="p-5 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 mb-3 text-primary font-semibold">
                        <Brain className="w-4 h-4" />
                        AI Summary
                      </div>
                      <p className="text-sm leading-relaxed">{ar.ai_summary}</p>
                    </div>
                  )}

                  {/* Strengths */}
                  {ar.strengths.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />Strengths
                      </h3>
                      <ul className="space-y-2">
                        {ar.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {ar.weaknesses.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-600 dark:text-red-400">
                        <XCircle className="w-4 h-4" />Areas of Concern
                      </h3>
                      <ul className="space-y-2">
                        {ar.weaknesses.map((w, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm">
                            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
