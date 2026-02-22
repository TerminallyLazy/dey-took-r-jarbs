"use client";

import { useState } from "react";
import {
  MapPin,
  Building2,
  DollarSign,
  Clock,
  Users,
  Wifi,
  ExternalLink,
  FileText,
  Send,
  X,
  Sparkles,
  Briefcase,
  Loader2,
  Copy,
  Check,
  ChevronDown,
} from "lucide-react";
import { cn, formatSalary, timeAgo, getConfidenceColor, getConfidenceBg, getStatusColor } from "@/lib/utils";
import type { JobWithRelations, ApplicationStatus, CoverLetterTone } from "@/types";

interface JobDetailProps {
  job: JobWithRelations;
  onClose: () => void;
  onUpdate: () => void;
}

const APPLICATION_STATUSES: { value: ApplicationStatus; label: string }[] = [
  { value: "interested", label: "Interested" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offered", label: "Offered" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

export default function JobDetail({ job, onClose, onUpdate }: JobDetailProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<CoverLetterTone>("professional");
  const [copied, setCopied] = useState(false);
  const [showCoverLetterPanel, setShowCoverLetterPanel] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const skills = job.skills ? JSON.parse(job.skills) as string[] : [];

  async function handleAnalyze() {
    setIsAnalyzing(true);
    try {
      await fetch(`/api/jobs/${job.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze" }),
      });
      onUpdate();
    } catch (error) {
      console.error("Analysis failed:", error);
    }
    setIsAnalyzing(false);
  }

  async function handleGenerateCoverLetter() {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, tone: selectedTone }),
      });
      const data = await res.json();
      setCoverLetter(data.content);
    } catch (error) {
      console.error("Cover letter generation failed:", error);
    }
    setIsGenerating(false);
  }

  async function handleStatusUpdate(status: ApplicationStatus) {
    try {
      await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, status }),
      });
      setShowStatusDropdown(false);
      onUpdate();
    } catch (error) {
      console.error("Status update failed:", error);
    }
  }

  async function handleCopy() {
    if (coverLetter) {
      await navigator.clipboard.writeText(coverLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-6 border-b border-border">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {job.isNew && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                New
              </span>
            )}
            {job.remote && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium">
                <Wifi className="w-3 h-3" />
                Remote
              </span>
            )}
            {job.jobType && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-medium">
                <Briefcase className="w-3 h-3" />
                {job.jobType}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-white leading-tight">{job.title}</h2>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              {job.company}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {job.location}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-surface-hover text-muted hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Key Info Bar */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-border bg-surface/50">
        <div className="flex items-center gap-1.5 text-sm">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 font-semibold">
            {formatSalary(job.salaryMin, job.salaryMax, job.salary)}
          </span>
        </div>
        {job.postedDate && (
          <div className="flex items-center gap-1.5 text-sm text-muted">
            <Clock className="w-4 h-4" />
            Posted {timeAgo(job.postedDate)}
          </div>
        )}
        {job.applicantCount && (
          <div className="flex items-center gap-1.5 text-sm text-muted">
            <Users className="w-4 h-4" />
            {job.applicantCount}
          </div>
        )}

        {job.confidenceScore !== null && (
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-bold ml-auto",
            getConfidenceBg(job.confidenceScore),
            getConfidenceColor(job.confidenceScore)
          )}>
            Match: {Math.round(job.confidenceScore)}%
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* AI Summary */}
        {job.summary && (
          <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold text-cyan-400">AI Analysis</span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">{job.summary}</p>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Required Skills
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill: string) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Job Description
          </h3>
          <div className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
            {job.description}
          </div>
        </div>

        {/* Cover Letter Section */}
        {showCoverLetterPanel && (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-surface border-b border-border">
              <h3 className="text-sm font-semibold text-white">Generate Cover Letter</h3>
              <button
                onClick={() => setShowCoverLetterPanel(false)}
                className="text-muted hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                {(["professional", "enthusiastic", "technical"] as CoverLetterTone[]).map((tone) => (
                  <button
                    key={tone}
                    onClick={() => setSelectedTone(tone)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
                      selectedTone === tone
                        ? "bg-accent text-white"
                        : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    {tone}
                  </button>
                ))}
              </div>
              <button
                onClick={handleGenerateCoverLetter}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Generate Cover Letter
                  </>
                )}
              </button>
              {coverLetter && (
                <div className="relative">
                  <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                    {coverLetter}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-2 p-4 border-t border-border bg-surface/80">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View on Indeed
        </a>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Analyze
        </button>

        <button
          onClick={() => setShowCoverLetterPanel(!showCoverLetterPanel)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition-colors"
        >
          <FileText className="w-4 h-4" />
          Cover Letter
        </button>

        {/* Status Dropdown */}
        <div className="relative ml-auto">
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border",
              job.application
                ? getStatusColor(job.application.status)
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700"
            )}
          >
            <Send className="w-4 h-4" />
            {job.application ? job.application.status : "Track"}
            <ChevronDown className="w-3 h-3" />
          </button>

          {showStatusDropdown && (
            <div className="absolute bottom-full right-0 mb-2 w-44 rounded-xl bg-surface border border-border shadow-2xl overflow-hidden z-50">
              {APPLICATION_STATUSES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleStatusUpdate(value)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm hover:bg-surface-hover transition-colors",
                    job.application?.status === value
                      ? "text-accent font-semibold"
                      : "text-zinc-300"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
