"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, Download, SortAsc, SortDesc, Users, Loader2,
  ChevronDown, Play, RefreshCw, FileSpreadsheet, FileDown
} from "lucide-react";
import { jdAPI, analysisAPI, exportAPI, getErrorMessage } from "@/lib/api";
import { JobDescription, CandidateListItem } from "@/types";
import {
  getScoreClass, getRecommendationClass, getInitials,
  getRankBadgeClass, formatRelativeTime, truncate
} from "@/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";

function CandidateCard({ candidate, jdId }: { candidate: CandidateListItem; jdId: number }) {
  const router = useRouter();
  const score = candidate.analysis_result?.total_score;
  const rank = candidate.analysis_result?.rank;
  const rec = candidate.analysis_result?.recommendation;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 hover:shadow-glow transition-all group cursor-pointer"
      onClick={() => router.push(`/dashboard/candidates/${candidate.id}?jd=${jdId}`)}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-5">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full animated-gradient flex items-center justify-center text-white font-bold text-sm">
            {getInitials(candidate.name)}
          </div>
          {rank && (
            <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${getRankBadgeClass(rank)}`}>
              {rank}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base group-hover:text-primary transition-colors truncate">
            {candidate.name}
          </h3>
          {candidate.email && (
            <div className="text-xs text-muted-foreground truncate">{candidate.email}</div>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            {candidate.location && (
              <span className="text-xs text-muted-foreground">📍 {candidate.location}</span>
            )}
            {candidate.years_of_experience > 0 && (
              <span className="text-xs text-muted-foreground">
                {candidate.years_of_experience.toFixed(1)} yrs exp
              </span>
            )}
          </div>
        </div>

        {/* Score */}
        {score !== undefined && (
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className={`text-2xl font-bold ${getScoreClass(score).replace(/^score-/, "").includes("excellent") ? "text-emerald-500" : score >= 70 ? "text-blue-500" : score >= 50 ? "text-amber-500" : "text-red-500"}`}>
              {Math.round(score)}
              <span className="text-sm text-muted-foreground font-normal">/100</span>
            </div>
            {rec && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRecommendationClass(rec)}`}>
                {rec}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Score Breakdown */}
      {candidate.analysis_result && (
        <div className="space-y-2 mb-4">
          {[
            { label: "Skills", score: candidate.analysis_result.skills_score, max: 40 },
            { label: "Experience", score: candidate.analysis_result.experience_score, max: 25 },
            { label: "Education", score: candidate.analysis_result.education_score, max: 15 },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 text-xs">
              <span className="w-16 text-muted-foreground">{item.label}</span>
              <div className="flex-1 progress-bar h-1.5">
                <div
                  className="progress-fill h-full"
                  style={{ width: `${(item.score / item.max) * 100}%` }}
                />
              </div>
              <span className="w-10 text-right font-medium">{item.score.toFixed(0)}/{item.max}</span>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {candidate.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {candidate.skills.slice(0, 4).map((s) => (
            <span key={s.skill} className="skill-tag">{s.skill}</span>
          ))}
          {candidate.skills.length > 4 && (
            <span className="text-xs text-muted-foreground self-center">+{candidate.skills.length - 4}</span>
          )}
        </div>
      )}

      {/* Missing skills */}
      {candidate.analysis_result?.missing_skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {candidate.analysis_result.missing_skills.slice(0, 3).map((s) => (
            <span key={s} className="skill-tag-missing">✗ {s}</span>
          ))}
          {candidate.analysis_result.missing_skills.length > 3 && (
            <span className="text-xs text-red-400">+{candidate.analysis_result.missing_skills.length - 3} missing</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3 mt-1">
        <span>{formatRelativeTime(candidate.created_at)}</span>
        <div className="flex items-center gap-3">
          {!candidate.is_analyzed && (
            <span className="text-amber-500 font-medium">Not analyzed</span>
          )}
          <span className="text-primary font-medium group-hover:underline">View Details →</span>
        </div>
      </div>
    </motion.div>
  );
}

function CandidateCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex items-start gap-4">
        <div className="skeleton w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
        </div>
        <div className="skeleton w-16 h-8 rounded" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-2 rounded" />)}
      </div>
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-6 w-16 rounded-full" />)}
      </div>
    </div>
  );
}

export default function CandidatesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [jds, setJds] = useState<JobDescription[]>([]);
  const [selectedJdId, setSelectedJdId] = useState<number | null>(
    searchParams.get("jd") ? Number(searchParams.get("jd")) : null
  );
  const [candidates, setCandidates] = useState<CandidateListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("score_desc");
  const [minScore, setMinScore] = useState<string>("");
  const [recFilter, setRecFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    jdAPI.list().then((r) => {
      setJds(r.data);
      if (!selectedJdId && r.data.length > 0) {
        setSelectedJdId(r.data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedJdId) loadCandidates();
  }, [selectedJdId, search, sortBy, minScore, recFilter]);

  const loadCandidates = async () => {
    if (!selectedJdId) return;
    setIsLoading(true);
    try {
      const response = await analysisAPI.getCandidates(selectedJdId, {
        search: search || undefined,
        min_score: minScore ? Number(minScore) : undefined,
        recommendation: recFilter || undefined,
        sort_by: sortBy,
        limit: 100,
      });
      setCandidates(response.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!selectedJdId) return;
    setIsAnalyzing(true);
    try {
      await analysisAPI.runAnalysis(selectedJdId);
      toast.success("Analysis complete!");
      await loadCandidates();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportCSV = () => {
    if (!selectedJdId) return;
    const token = localStorage.getItem("talentmatch_token");
    exportAPI.downloadWithAuth(exportAPI.csvUrl(selectedJdId), `candidates_${selectedJdId}.csv`);
  };

  const handleExportExcel = () => {
    if (!selectedJdId) return;
    exportAPI.downloadWithAuth(exportAPI.excelUrl(selectedJdId), `candidates_${selectedJdId}.xlsx`);
  };

  const selectedJd = jds.find((j) => j.id === selectedJdId);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Candidates</h1>
          <p className="text-muted-foreground">AI-ranked candidates for your job descriptions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing || !selectedJdId}
            className="px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium hover:bg-accent transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</>
            ) : (
              <><Play className="w-4 h-4" />Re-analyze</>
            )}
          </button>
          <button
            onClick={handleExportCSV}
            disabled={!selectedJdId}
            className="px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium hover:bg-accent transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />CSV
          </button>
          <button
            onClick={handleExportExcel}
            disabled={!selectedJdId}
            className="px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium hover:bg-accent transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />Excel
          </button>
        </div>
      </div>

      {/* JD Selector */}
      {jds.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {jds.map((jd) => (
            <button
              key={jd.id}
              onClick={() => setSelectedJdId(jd.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedJdId === jd.id
                  ? "animated-gradient text-white shadow-glow"
                  : "border border-border bg-card hover:bg-accent"
              }`}
            >
              {truncate(jd.title, 30)}
              <span className="ml-2 opacity-70">({jd.candidate_count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Search & Filters */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="score_desc">Highest Score</option>
            <option value="score_asc">Lowest Score</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${
              showFilters ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:bg-accent"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="flex gap-3 flex-wrap">
            <select
              value={recFilter}
              onChange={(e) => setRecFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none"
            >
              <option value="">All Recommendations</option>
              <option value="Highly Recommended">Highly Recommended</option>
              <option value="Recommended">Recommended</option>
              <option value="Consider">Consider</option>
              <option value="Not Recommended">Not Recommended</option>
            </select>
            <input
              type="number"
              placeholder="Min score (0-100)"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              min={0}
              max={100}
              className="w-40 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Results */}
      {!selectedJdId ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No job description selected</h3>
          <p className="text-muted-foreground mb-6">Create a job description first to see candidates</p>
          <Link
            href="/dashboard/upload"
            className="px-6 py-3 rounded-xl animated-gradient text-white font-medium inline-flex items-center gap-2"
          >
            Create JD
          </Link>
        </div>
      ) : isLoading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CandidateCardSkeleton key={i} />)}
        </div>
      ) : candidates.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No candidates found</h3>
          <p className="text-muted-foreground mb-6">Upload resumes for this job description</p>
          <Link
            href="/dashboard/upload"
            className="px-6 py-3 rounded-xl animated-gradient text-white font-medium inline-flex items-center gap-2"
          >
            Upload Resumes
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {candidates.length} candidate{candidates.length !== 1 ? "s" : ""} found
            </div>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {candidates.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} jdId={selectedJdId} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
