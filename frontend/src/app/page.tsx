"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import {
  Brain, Upload, BarChart3, Users, ArrowRight, Star,
  CheckCircle2, Sparkles, Zap, Shield, Globe, ChevronRight
} from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Bulk Resume Upload",
    description: "Upload up to 50 resumes at once. Support for PDF, DOC, and DOCX formats with drag & drop.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Brain,
    title: "AI-Powered Matching",
    description: "Semantic similarity using sentence-transformers + rule-based scoring for comprehensive evaluation.",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: BarChart3,
    title: "Detailed Analytics",
    description: "Score breakdowns, skill gap analysis, hiring funnel charts, and candidate insights.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Users,
    title: "Candidate Ranking",
    description: "Automatic ranking with hiring recommendations: Highly Recommended, Recommended, Consider, or Not Recommended.",
    color: "from-orange-500 to-amber-500",
  },
];

const stats = [
  { value: "95%", label: "Screening Accuracy" },
  { value: "10x", label: "Faster Than Manual" },
  { value: "50+", label: "Resumes Per Batch" },
  { value: "100", label: "Point Score System" },
];

const testimonials = [
  {
    quote: "TalentMatch AI reduced our time-to-hire by 60%. The AI scoring is incredibly accurate.",
    author: "Sarah Chen",
    role: "Head of Talent, TechCorp",
    rating: 5,
  },
  {
    quote: "Finally, an ATS that actually understands what we need. The skill gap analysis is a game-changer.",
    author: "Marcus Johnson",
    role: "Recruiting Manager, StartupXYZ",
    rating: 5,
  },
  {
    quote: "The export to Excel feature alone saves us hours every week. Highly recommended!",
    author: "Priya Patel",
    role: "HR Director, FinanceInc",
    rating: 5,
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/register");
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg animated-gradient flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">TalentMatch AI</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Reviews</a>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-32 pb-24 px-6">
        {/* Background mesh */}
        <div className="absolute inset-0 bg-mesh-gradient-dark opacity-30 pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            AI-Powered Resume Screening Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            Screen Resumes,{" "}
            <span className="gradient-text">Rank Candidates</span>
            {" "}with AI
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Upload resumes and a job description. Our AI analyzes, scores, and ranks
            candidates instantly — so you can focus on the best fits.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={handleGetStarted}
              className="group px-8 py-4 rounded-xl animated-gradient text-white font-semibold text-lg hover:shadow-glow-lg transition-all duration-300 flex items-center gap-2 justify-center"
            >
              Start Screening for Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link
              href="#how-it-works"
              className="px-8 py-4 rounded-xl border border-border bg-card text-foreground font-semibold text-lg hover:bg-accent transition-colors flex items-center gap-2 justify-center"
            >
              See how it works
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-muted-foreground"
          >
            {["No credit card required", "Free to start", "Setup in 2 minutes", "Cancel anytime"].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {item}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 border-y border-border/50 bg-card/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Everything you need to hire{" "}
              <span className="gradient-text">smarter</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Powerful AI tools built for modern recruiters to find the best candidates faster.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 hover:shadow-glow transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 px-6 bg-card/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How TalentMatch AI works</h2>
            <p className="text-muted-foreground text-lg">
              Get from job description to ranked candidates in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload JD & Resumes",
                desc: "Paste your job description or upload a file. Then drag & drop up to 50 resumes in PDF or DOCX format.",
                icon: Upload,
              },
              {
                step: "02",
                title: "AI Analyzes & Scores",
                desc: "Our AI parses resumes, extracts skills and experience, computes semantic similarity, and assigns a 0-100 match score.",
                icon: Brain,
              },
              {
                step: "03",
                title: "Get Ranked Results",
                desc: "View ranked candidates with detailed scores, skill gaps, strengths, weaknesses, and AI-generated hiring recommendations.",
                icon: BarChart3,
              },
            ].map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
                  <div className="absolute inset-0 rounded-full animated-gradient opacity-20 animate-pulse-ring" />
                  <div className="w-16 h-16 rounded-full animated-gradient flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="text-sm font-bold text-primary mb-2">{step.step}</div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Loved by <span className="gradient-text">recruiters</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-6"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-foreground/90 mb-5 leading-relaxed">"{t.quote}"</p>
                <div>
                  <div className="font-semibold text-sm">{t.author}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 animated-gradient opacity-90" />
            <div className="relative text-center py-20 px-6 text-white">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to hire smarter?
              </h2>
              <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
                Join hundreds of recruiters using TalentMatch AI to screen candidates
                10x faster with AI precision.
              </p>
              <button
                onClick={handleGetStarted}
                className="px-10 py-4 bg-white text-primary rounded-xl font-semibold text-lg hover:bg-white/90 transition-colors inline-flex items-center gap-2"
              >
                Get Started Free
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded animated-gradient flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-foreground">TalentMatch AI</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
          <div>© 2025 TalentMatch AI. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
