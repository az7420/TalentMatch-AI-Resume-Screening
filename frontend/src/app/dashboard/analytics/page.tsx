"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, BarChart3, TrendingUp, Users, Award, Briefcase } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, FunnelChart, Funnel, LabelList,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";
import { jdAPI, analyticsAPI, getErrorMessage } from "@/lib/api";
import { JobDescription, Analytics } from "@/types";
import { truncate } from "@/lib/utils";
import toast from "react-hot-toast";

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];
const RECOMMENDATION_COLORS: Record<string, string> = {
  "Highly Recommended": "#10b981",
  "Recommended": "#3b82f6",
  "Consider": "#f59e0b",
  "Not Recommended": "#ef4444",
};

export default function AnalyticsPage() {
  const [jds, setJds] = useState<JobDescription[]>([]);
  const [selectedJdId, setSelectedJdId] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    jdAPI.list().then((r) => {
      setJds(r.data);
      if (r.data.length > 0) setSelectedJdId(r.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedJdId) loadAnalytics();
  }, [selectedJdId]);

  const loadAnalytics = async () => {
    if (!selectedJdId) return;
    setIsLoading(true);
    try {
      const r = await analyticsAPI.get(selectedJdId);
      setAnalytics(r.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const funnelData = analytics ? Object.entries(analytics.hiring_funnel).map(([name, value]) => ({
    name, value, fill: RECOMMENDATION_COLORS[name] || "#3b82f6"
  })) : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Analytics</h1>
        <p className="text-muted-foreground">Candidate insights, skill gaps, and hiring metrics</p>
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
            </button>
          ))}
        </div>
      )}

      {!analytics ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No analytics available</h3>
          <p className="text-muted-foreground">Upload and analyze resumes to see insights</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Candidates", value: analytics.total_candidates, icon: Users, color: "from-blue-500 to-cyan-500" },
              { label: "Analyzed", value: analytics.analyzed_candidates, icon: BarChart3, color: "from-violet-500 to-purple-500" },
              { label: "Average Score", value: `${analytics.average_score.toFixed(1)}`, icon: TrendingUp, color: "from-emerald-500 to-teal-500" },
              { label: "Top Score", value: `${analytics.highest_score.toFixed(1)}`, icon: Award, color: "from-orange-500 to-amber-500" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-2xl p-5"
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-2xl font-bold gradient-text">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Score Distribution */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-semibold mb-5">Score Distribution</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={analytics.score_distribution} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="range_label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="count" fill="url(#blueGradient)" radius={[6, 6, 0, 0]}>
                    {analytics.score_distribution.map((entry, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recommendation Breakdown */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-semibold mb-5">Hiring Recommendations</h2>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={Object.entries(analytics.recommendation_breakdown).map(([name, value]) => ({ name, value }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {Object.entries(analytics.recommendation_breakdown).map(([name], i) => (
                      <Cell key={name} fill={RECOMMENDATION_COLORS[name] || CHART_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }}
                  />
                  <Legend formatter={(v) => <span style={{ fontSize: 11, color: "hsl(var(--foreground))" }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Most Common Skills */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-semibold mb-5">Most Common Skills</h2>
              <div className="space-y-3">
                {analytics.most_common_skills.slice(0, 8).map((skill, i) => (
                  <div key={skill.skill} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                    <span className="text-sm flex-1 font-medium">{skill.skill}</span>
                    <div className="flex-1 progress-bar h-1.5">
                      <div className="progress-fill h-full" style={{ width: `${skill.percentage}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {skill.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Gaps */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-semibold mb-5">Top Skill Gaps</h2>
              {analytics.most_missing_skills.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No skill gap data available yet
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics.most_missing_skills.slice(0, 8).map((skill, i) => (
                    <div key={skill.skill} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                      <span className="text-sm flex-1 font-medium text-red-500 dark:text-red-400">{skill.skill}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-red-100 dark:bg-red-950/30 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-red-400"
                          style={{ width: `${skill.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {skill.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Hiring Funnel */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold mb-5">Hiring Funnel</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {funnelData.map((item, i) => (
                <div key={item.name} className="text-center">
                  <div className="relative mx-auto" style={{ width: "100%", maxWidth: 100 }}>
                    <div
                      className="w-full rounded-xl py-4 flex items-center justify-center text-white text-2xl font-bold"
                      style={{ backgroundColor: item.fill, opacity: 1 - i * 0.08 }}
                    >
                      {item.value}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 leading-tight">{item.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Candidate */}
          {analytics.top_candidate && (
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Top Candidate
              </h2>
              <div className="flex items-center gap-5 p-5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-200 dark:border-amber-800">
                <div className="w-14 h-14 rounded-xl animated-gradient flex items-center justify-center text-white text-lg font-bold">
                  #1
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg">{analytics.top_candidate.name}</div>
                  <div className="text-muted-foreground text-sm">{analytics.top_candidate.email}</div>
                  <div className="flex gap-2 mt-2">
                    {analytics.top_candidate.skills?.slice(0, 4).map((s) => (
                      <span key={s.skill} className="skill-tag text-xs">{s.skill}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold gradient-text">
                    {Math.round(analytics.top_candidate.analysis_result?.total_score || 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">/ 100</div>
                  <div className="text-xs text-emerald-500 font-medium mt-1">
                    {analytics.top_candidate.analysis_result?.recommendation}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
