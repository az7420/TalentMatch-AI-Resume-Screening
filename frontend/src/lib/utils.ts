import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score: number): string {
  return `${Math.round(score)}/100`;
}

export function getScoreColor(score: number): string {
  if (score >= 85) return "text-emerald-500";
  if (score >= 70) return "text-blue-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

export function getScoreClass(score: number): string {
  if (score >= 85) return "score-excellent";
  if (score >= 70) return "score-good";
  if (score >= 50) return "score-average";
  return "score-poor";
}

export function getRecommendationClass(rec: string): string {
  switch (rec) {
    case "Highly Recommended": return "rec-highly";
    case "Recommended": return "rec-recommended";
    case "Consider": return "rec-consider";
    default: return "rec-not";
  }
}

export function getRecommendationColor(rec: string): string {
  switch (rec) {
    case "Highly Recommended": return "text-emerald-500";
    case "Recommended": return "text-blue-500";
    case "Consider": return "text-amber-500";
    default: return "text-red-500";
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getRankBadgeClass(rank: number): string {
  if (rank === 1) return "rank-1";
  if (rank === 2) return "rank-2";
  if (rank === 3) return "rank-3";
  return "bg-muted text-muted-foreground";
}

export function scoreToPercent(score: number, max: number): number {
  return Math.round((score / max) * 100);
}
