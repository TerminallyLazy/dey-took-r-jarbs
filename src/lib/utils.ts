import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSalary(min?: number | null, max?: number | null, raw?: string | null): string {
  if (raw) return raw;
  if (min && max) {
    return `$${(min / 1000).toFixed(0)}K - $${(max / 1000).toFixed(0)}K`;
  }
  if (min) return `$${(min / 1000).toFixed(0)}K+`;
  if (max) return `Up to $${(max / 1000).toFixed(0)}K`;
  return "Not listed";
}

export function parseSalary(salaryStr: string): { min?: number; max?: number } {
  const cleaned = salaryStr.replace(/[,$]/g, "").toLowerCase();
  const yearlyPattern = /(\d+(?:\.\d+)?)\s*k?\s*[-–to]+\s*(\d+(?:\.\d+)?)\s*k?/;
  const hourlyPattern = /(\d+(?:\.\d+)?)\s*[-–to]+\s*(\d+(?:\.\d+)?)\s*(?:per\s*hour|\/\s*hr|an\s*hour)/;
  const singlePattern = /(\d{2,3}(?:,\d{3})*)/;

  let match = cleaned.match(hourlyPattern);
  if (match) {
    return {
      min: parseFloat(match[1]) * 2080,
      max: parseFloat(match[2]) * 2080,
    };
  }

  match = cleaned.match(yearlyPattern);
  if (match) {
    let min = parseFloat(match[1]);
    let max = parseFloat(match[2]);
    if (min < 1000) min *= 1000;
    if (max < 1000) max *= 1000;
    return { min, max };
  }

  match = salaryStr.replace(/,/g, "").match(singlePattern);
  if (match) {
    const val = parseFloat(match[1]);
    if (val > 1000) return { min: val, max: val };
  }

  return {};
}

export function timeAgo(date: Date | string | null): string {
  if (!date) return "Unknown";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return d.toLocaleDateString();
}

export function getConfidenceColor(score: number | null): string {
  if (!score) return "text-zinc-500";
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-cyan-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

export function getConfidenceBg(score: number | null): string {
  if (!score) return "bg-zinc-500/10";
  if (score >= 80) return "bg-emerald-400/10";
  if (score >= 60) return "bg-cyan-400/10";
  if (score >= 40) return "bg-amber-400/10";
  return "bg-red-400/10";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    interested: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    applied: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    interviewing: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    offered: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    rejected: "bg-red-500/15 text-red-400 border-red-500/30",
    withdrawn: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  };
  return colors[status] || colors.interested;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}
