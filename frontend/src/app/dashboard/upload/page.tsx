"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, X, CheckCircle2, AlertCircle, Loader2,
  Plus, ArrowRight, Trash2, File
} from "lucide-react";
import { jdAPI, resumeAPI, analysisAPI, getErrorMessage } from "@/lib/api";
import { JobDescription } from "@/types";
import toast from "react-hot-toast";

type UploadStep = "jd" | "resumes" | "analyze";

interface FileWithPreview {
  file: File;
  id: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<UploadStep>("jd");
  const [jdMode, setJdMode] = useState<"text" | "file">("text");
  const [jdTitle, setJdTitle] = useState("");
  const [jdContent, setJdContent] = useState("");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [currentJD, setCurrentJD] = useState<JobDescription | null>(null);
  const [resumeFiles, setResumeFiles] = useState<FileWithPreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ── Step 1: Create JD ──
  const handleCreateJD = async () => {
    if (!jdTitle.trim()) {
      toast.error("Please enter a job title");
      return;
    }
    if (jdMode === "text" && jdContent.trim().length < 50) {
      toast.error("Job description must be at least 50 characters");
      return;
    }
    if (jdMode === "file" && !jdFile) {
      toast.error("Please select a JD file");
      return;
    }

    setIsSubmitting(true);
    try {
      let response;
      if (jdMode === "text") {
        response = await jdAPI.create({ title: jdTitle, content: jdContent });
      } else {
        const formData = new FormData();
        formData.append("title", jdTitle);
        formData.append("file", jdFile!);
        response = await jdAPI.uploadFile(formData);
      }
      setCurrentJD(response.data);
      toast.success("Job description created! Now upload resumes.");
      setStep("resumes");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Dropzone for Resumes ──
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileWithPreview[] = acceptedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2),
      status: "pending",
    }));
    setResumeFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
    },
    maxFiles: 50,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDropRejected: (files) => {
      files.forEach((f) => {
        if (f.errors[0]?.code === "file-too-large") {
          toast.error(`${f.file.name} is too large (max 10MB)`);
        } else {
          toast.error(`${f.file.name}: ${f.errors[0]?.message}`);
        }
      });
    },
  });

  const removeFile = (id: string) => {
    setResumeFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // ── Step 2: Upload Resumes ──
  const handleUploadResumes = async () => {
    if (resumeFiles.length === 0) {
      toast.error("Please add at least one resume");
      return;
    }
    if (!currentJD) return;

    setIsSubmitting(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("jd_id", String(currentJD.id));
    resumeFiles.forEach(({ file }) => formData.append("files", file));

    try {
      const response = await resumeAPI.upload(formData, (progress) => {
        setUploadProgress(progress);
      });

      const result = response.data;
      toast.success(`${result.uploaded_count} resumes uploaded successfully!`);

      if (result.errors.length > 0) {
        toast.error(`${result.failed_count} files failed: ${result.errors[0]}`);
      }

      setStep("analyze");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 3: Run Analysis ──
  const handleAnalyze = async () => {
    if (!currentJD) return;
    setIsAnalyzing(true);

    try {
      await analysisAPI.runAnalysis(currentJD.id);
      toast.success("AI analysis complete! Redirecting to results...");
      setTimeout(() => {
        router.push(`/dashboard/candidates?jd=${currentJD.id}`);
      }, 1500);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setIsAnalyzing(false);
    }
  };

  const stepConfig = [
    { id: "jd", label: "Job Description" },
    { id: "resumes", label: "Upload Resumes" },
    { id: "analyze", label: "Run AI Analysis" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">New Screening Session</h1>
        <p className="text-muted-foreground">Upload a job description and resumes to begin AI-powered candidate screening</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-0">
        {stepConfig.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 flex-1 ${i > 0 ? "pl-4" : ""}`}>
              {i > 0 && (
                <div className={`h-0.5 flex-1 transition-all ${
                  stepConfig.findIndex((x) => x.id === step) > i - 1
                    ? "bg-primary"
                    : "bg-border"
                }`} />
              )}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step === s.id
                    ? "animated-gradient text-white"
                    : stepConfig.findIndex((x) => x.id === step) > i
                    ? "bg-emerald-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {stepConfig.findIndex((x) => x.id === step) > i ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${step === s.id ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Step 1: JD */}
      <AnimatePresence mode="wait">
        {step === "jd" && (
          <motion.div
            key="jd"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-card rounded-2xl p-8 space-y-6"
          >
            <h2 className="text-xl font-semibold">Job Description</h2>

            {/* JD Title */}
            <div>
              <label className="block text-sm font-medium mb-2">Job Title *</label>
              <input
                type="text"
                placeholder="e.g., Senior Full Stack Engineer"
                value={jdTitle}
                onChange={(e) => setJdTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            {/* Mode toggle */}
            <div className="flex rounded-xl border border-border overflow-hidden w-fit">
              {(["text", "file"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setJdMode(mode)}
                  className={`px-5 py-2 text-sm font-medium transition-all ${
                    jdMode === mode
                      ? "animated-gradient text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode === "text" ? "Paste Text" : "Upload File"}
                </button>
              ))}
            </div>

            {jdMode === "text" ? (
              <div>
                <label className="block text-sm font-medium mb-2">Job Description *</label>
                <textarea
                  placeholder="Paste the full job description here. Include required skills, experience, responsibilities, and qualifications..."
                  value={jdContent}
                  onChange={(e) => setJdContent(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none font-mono text-sm"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {jdContent.length} characters (minimum 50)
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">JD File (PDF, DOCX, TXT)</label>
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    jdFile ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" : "border-border hover:border-primary"
                  }`}
                  onClick={() => document.getElementById("jd-file-input")?.click()}
                >
                  {jdFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="w-6 h-6 text-emerald-500" />
                      <span className="text-sm font-medium">{jdFile.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setJdFile(null); }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload JD file</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, or TXT</p>
                    </>
                  )}
                </div>
                <input
                  id="jd-file-input"
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={(e) => setJdFile(e.target.files?.[0] || null)}
                />
              </div>
            )}

            <button
              onClick={handleCreateJD}
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl animated-gradient text-white font-semibold hover:shadow-glow transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Creating JD...</>
              ) : (
                <>Continue to Upload Resumes <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </motion.div>
        )}

        {/* Step 2: Upload Resumes */}
        {step === "resumes" && (
          <motion.div
            key="resumes"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium">JD Created: {currentJD?.title}</div>
                <div className="text-xs text-muted-foreground">
                  {currentJD?.required_skills?.length} required skills extracted
                </div>
              </div>
            </div>

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`glass-card rounded-2xl p-12 text-center cursor-pointer border-2 border-dashed transition-all ${
                isDragActive ? "dropzone-active border-primary" : "border-border hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              <motion.div
                animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full animated-gradient flex items-center justify-center">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-lg font-semibold mb-1">
                    {isDragActive ? "Drop resumes here!" : "Drag & drop resumes"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Or click to browse • PDF, DOC, DOCX • Max 10MB each • Up to 50 files
                  </p>
                </div>
              </motion.div>
            </div>

            {/* File List */}
            {resumeFiles.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{resumeFiles.length} file(s) selected</h3>
                  <button
                    onClick={() => setResumeFiles([])}
                    className="text-xs text-destructive hover:underline"
                  >
                    Remove all
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {resumeFiles.map(({ file, id, status }) => (
                    <div key={id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <File className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm flex-1 truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(1)}MB
                      </span>
                      {status === "done" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {status === "error" && <AlertCircle className="w-4 h-4 text-destructive" />}
                      {status === "pending" && (
                        <button onClick={() => removeFile(id)} className="text-muted-foreground hover:text-destructive">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {isSubmitting && (
              <div className="glass-card rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Uploading resumes...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            <button
              onClick={handleUploadResumes}
              disabled={isSubmitting || resumeFiles.length === 0}
              className="w-full py-3 rounded-xl animated-gradient text-white font-semibold hover:shadow-glow transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" />Uploading... {uploadProgress}%</>
              ) : (
                <>Upload {resumeFiles.length} Resume{resumeFiles.length !== 1 ? "s" : ""} <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </motion.div>
        )}

        {/* Step 3: Analyze */}
        {step === "analyze" && (
          <motion.div
            key="analyze"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-card rounded-2xl p-12 text-center space-y-6"
          >
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 rounded-full animated-gradient opacity-20 animate-pulse" style={{ width: 100, height: 100, margin: "auto" }} />
              <div className="w-24 h-24 rounded-full animated-gradient flex items-center justify-center">
                {isAnalyzing ? (
                  <Loader2 className="w-12 h-12 text-white animate-spin" />
                ) : (
                  <CheckCircle2 className="w-12 h-12 text-white" />
                )}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-3">
                {isAnalyzing ? "AI is analyzing candidates..." : "Resumes Uploaded! Ready to Analyze"}
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {isAnalyzing
                  ? "Our AI is computing semantic similarity, skill matches, experience scores, and generating hiring recommendations."
                  : "Click below to run our AI scoring engine. This will rank all candidates by their match score."}
              </p>
            </div>

            {isAnalyzing && (
              <div className="space-y-2 text-sm text-muted-foreground">
                {["Extracting resume features...", "Computing semantic embeddings...", "Scoring skill matches...", "Ranking candidates..."].map((step, i) => (
                  <div key={step} className="flex items-center gap-2 justify-center">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {step}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-10 py-4 rounded-xl animated-gradient text-white font-semibold text-lg hover:shadow-glow-lg transition-all disabled:opacity-70 flex items-center gap-2 mx-auto"
            >
              {isAnalyzing ? (
                <><Loader2 className="w-5 h-5 animate-spin" />Analyzing...</>
              ) : (
                <>🤖 Run AI Analysis <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
