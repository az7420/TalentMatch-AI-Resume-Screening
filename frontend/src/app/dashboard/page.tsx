"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Upload, Users, TrendingUp, Briefcase, ArrowRight,
  Plus, Clock, CheckCircle2, AlertCircle, Loader2
} from "lucide-react";
import { jdAPI, getErrorMessage } from "@/lib/api";
import { JobDescription } from "@/types";
import { useAuthStore } from "@/store/auth-store";
import { formatRelativeTime, truncate } from "@/lib/utils";
import toast from "react-hot-toast";

function StatCard({
  label, value, icon: Icon, color, delta
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  delta?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {delta && (
          <span className="text-xs text-emerald-500 font-medium bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
            {delta}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [jds, setJds] = useState<JobDescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await jdAPI.list();
      setJds(response.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const totalCandidates = jds.reduce((sum, jd) => sum + (jd.candidate_count || 0), 0);
  const activeJDs = jds.filter((j) => j.is_active).length;

  const stats = [
    { label: "Total Job Descriptions", value: jds.length, icon: Briefcase, color: "from-blue-500 to-cyan-500" },
    { label: "Total Candidates", value: totalCandidates, icon: Users, color: "from-violet-500 to-purple-500", delta: "+12% ↑" },
    { label: "Active Postings", value: activeJDs, icon: CheckCircle2, color: "from-emerald-500 to-teal-500" },
    { label: "Avg Match Score", value: "–", icon: TrendingUp, color: "from-orange-500 to-amber-500" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Good {new Date().getHours() < 12 ? "morning" : "afternoon"},{" "}
            <span className="gradient-text">{user?.name?.split(" ")[0]}</span> 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your recruitment pipeline.
          </p>
        </div>
        <Link
          href="/dashboard/upload"
          className="px-5 py-2.5 rounded-xl animated-gradient text-white font-medium text-sm hover:shadow-glow transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Screening
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          {
            title: "Upload Resumes",
            desc: "Drag & drop resumes for AI analysis",
            icon: Upload,
            href: "/dashboard/upload",
            color: "from-blue-500 to-cyan-500",
          },
          {
            title: "View Candidates",
            desc: "Browse ranked candidates with scores",
            icon: Users,
            href: "/dashboard/candidates",
            color: "from-violet-500 to-purple-500",
          },
          {
            title: "Analytics",
            desc: "Skill gaps, score distributions, hiring funnel",
            icon: TrendingUp,
            href: "/dashboard/analytics",
            color: "from-emerald-500 to-teal-500",
          },
        ].map((action, i) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
          >
            <Link
              href={action.href}
              className="glass-card rounded-2xl p-6 flex items-start gap-4 hover:shadow-glow transition-all group block"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center flex-shrink-0`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold group-hover:text-primary transition-colors">{action.title}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{action.desc}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent JDs */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold">Recent Job Descriptions</h2>
          <Link href="/dashboard/upload" className="text-sm text-primary hover:underline flex items-center gap-1">
            Create new <Plus className="w-3 h-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : jds.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No job descriptions yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first job description and start screening candidates with AI
            </p>
            <Link
              href="/dashboard/upload"
              className="px-6 py-3 rounded-xl animated-gradient text-white font-medium inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Job Description
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jds.slice(0, 6).map((jd, i) => (
              <motion.div
                key={jd.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl p-5 hover:shadow-glow transition-all group cursor-pointer"
                onClick={() => router.push(`/dashboard/candidates?jd=${jd.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg animated-gradient flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-4 h-4 text-white" />
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    jd.is_active
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {jd.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                  {truncate(jd.title, 50)}
                </h3>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {jd.candidate_count} candidates
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(jd.created_at)}
                  </div>
                </div>

                {jd.required_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {jd.required_skills.slice(0, 3).map((skill) => (
                      <span key={skill} className="skill-tag text-xs">{skill}</span>
                    ))}
                    {jd.required_skills.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{jd.required_skills.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2 text-xs text-primary font-medium">
                  View Candidates
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
