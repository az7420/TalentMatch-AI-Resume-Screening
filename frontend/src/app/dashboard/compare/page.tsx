"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GitCompare, Plus, Trash2, CheckCircle2, XCircle, Users, Loader2 } from "lucide-react";
import { jdAPI, analysisAPI, getErrorMessage } from "@/lib/api";
import { JobDescription, CandidateListItem } from "@/types";
import { getInitials, getRecommendationClass, getScoreClass, truncate } from "@/lib/utils";
import toast from "react-hot-toast";

function CompareColumn({ candidate }: { candidate: CandidateListItem }) {
  const ar = candidate.analysis_result;
  const score = ar?.total_score || 0;

  return (
    <div className="glass-card rounded-2xl p-6 flex-1">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-xl animated-gradient flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
          {getInitials(candidate.name)}
        </div>
        <h3 className="font-bold text-lg">{candidate.name}</h3>
        {candidate.email && <div className="text-xs text-muted-foreground">{candidate.email}</div>}
        {candidate.location && <div className="text-xs text-muted-foreground">📍 {candidate.location}</div>}

        {ar && (
          <div className="mt-4">
            <div className="text-5xl font-bold gradient-text">{Math.round(score)}</div>
            <div className="text-muted-foreground text-sm">/100 match score</div>
            <span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-medium ${getRecommendationClass(ar.recommendation)}`}>
              {ar.recommendation}
            </span>
          </div>
        )}
      </div>

      {ar && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score Breakdown</h4>
          {[
            { label: "Skills", score: ar.skills_score, max: 40 },
            { label: "Experience", score: ar.experience_score, max: 25 },
            { label: "Education", score: ar.education_score, max: 15 },
            { label: "Keywords", score: ar.keyword_score, max: 10 },
            { label: "Projects", score: ar.project_score, max: 10 },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{item.score.toFixed(1)}/{item.max}</span>
              </div>
              <div className="progress-bar h-1.5">
                <div className="progress-fill h-full" style={{ width: `${(item.score / item.max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Stats</h4>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="font-bold">{candidate.years_of_experience.toFixed(1)}y</div>
            <div className="text-xs text-muted-foreground">Experience</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="font-bold">{candidate.skills.length}</div>
            <div className="text-xs text-muted-foreground">Skills</div>
          </div>
        </div>
      </div>

      {ar?.matched_skills?.length > 0 && (
        <div className="mt-5">
          <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
            ✓ Matched Skills
          </h4>
          <div className="flex flex-wrap gap-1">
            {ar.matched_skills.slice(0, 6).map((s) => (
              <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {ar?.missing_skills?.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">
            ✗ Missing Skills
          </h4>
          <div className="flex flex-wrap gap-1">
            {ar.missing_skills.slice(0, 6).map((s) => (
              <span key={s} className="skill-tag-missing">{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  const [jds, setJds] = useState<JobDescription[]>([]);
  const [selectedJdId, setSelectedJdId] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<CandidateListItem[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    jdAPI.list().then((r) => {
      setJds(r.data);
      if (r.data.length > 0) setSelectedJdId(r.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedJdId) return;
    setIsLoading(true);
    analysisAPI.getCandidates(selectedJdId, { sort_by: "score_desc", limit: 50 })
      .then((r) => setCandidates(r.data))
      .catch((e) => toast.error(getErrorMessage(e)))
      .finally(() => setIsLoading(false));
    setSelected([]);
  }, [selectedJdId]);

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : prev.length >= 3
        ? (toast.error("Maximum 3 candidates to compare"), prev)
        : [...prev, id]
    );
  };

  const selectedCandidates = candidates.filter((c) => selected.includes(c.id));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
          <GitCompare className="w-8 h-8 text-primary" />
          Compare Candidates
        </h1>
        <p className="text-muted-foreground">Select up to 3 candidates to compare side-by-side</p>
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
                  ? "animated-gradient text-white"
                  : "border border-border bg-card hover:bg-accent"
              }`}
            >
              {truncate(jd.title, 30)}
            </button>
          ))}
        </div>
      )}

      {/* Candidate Picker */}
      {candidates.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-semibold mb-4 text-sm">
            Select candidates to compare ({selected.length}/3 selected)
          </h3>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {candidates.map((c) => (
                <button
                  key={c.id}
                  onClick={() => toggleSelect(c.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all border ${
                    selected.includes(c.id)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  {selected.includes(c.id) && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {c.name}
                  {c.analysis_result && (
                    <span className={`text-xs font-bold ${
                      c.analysis_result.total_score >= 70 ? "text-emerald-500" : "text-muted-foreground"
                    }`}>
                      {Math.round(c.analysis_result.total_score)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Compare Columns */}
      {selected.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Select candidates above to compare</h3>
          <p className="text-muted-foreground">Choose 2-3 candidates to view a side-by-side comparison</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-4"
        >
          {selectedCandidates.map((candidate) => (
            <CompareColumn key={candidate.id} candidate={candidate} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
