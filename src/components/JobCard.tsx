"use client";

import {
  MapPin,
  Building2,
  DollarSign,
  Clock,
  Users,
  Wifi,
  Sparkles,
  ChevronRight,
  Briefcase,
} from "lucide-react";
import { cn, formatSalary, timeAgo, getConfidenceColor, getConfidenceBg, getStatusColor, truncate } from "@/lib/utils";
import type { JobWithRelations } from "@/types";

interface JobCardProps {
  job: JobWithRelations;
  onClick: (job: JobWithRelations) => void;
  isSelected?: boolean;
}

export default function JobCard({ job, onClick, isSelected }: JobCardProps) {
  const skills = job.skills ? JSON.parse(job.skills) as string[] : [];

  return (
    <button
      onClick={() => onClick(job)}
      className={cn(
        "w-full text-left p-4 rounded-xl border transition-all duration-200 group",
        "hover:border-border-hover hover:bg-surface-hover/50",
        isSelected
          ? "border-accent/50 bg-accent/5 glow-cyan"
          : "border-border bg-surface",
        job.isNew && "ring-1 ring-cyan-500/20"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {job.isNew && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-2.5 h-2.5" />
                New
              </span>
            )}
            {job.application && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                getStatusColor(job.application.status)
              )}>
                {job.application.status}
              </span>
            )}
          </div>

          <h3 className="font-semibold text-sm leading-tight text-zinc-100 group-hover:text-white transition-colors truncate">
            {job.title}
          </h3>

          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {truncate(job.company, 20)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {truncate(job.location, 18)}
            </span>
            {job.remote && (
              <span className="flex items-center gap-1 text-emerald-400">
                <Wifi className="w-3 h-3" />
                Remote
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <DollarSign className="w-3 h-3" />
              {formatSalary(job.salaryMin, job.salaryMax, job.salary)}
            </span>
            {job.jobType && (
              <span className="flex items-center gap-1 text-muted">
                <Briefcase className="w-3 h-3" />
                {job.jobType}
              </span>
            )}
            {job.postedDate && (
              <span className="flex items-center gap-1 text-muted">
                <Clock className="w-3 h-3" />
                {timeAgo(job.postedDate)}
              </span>
            )}
            {job.applicantCount && (
              <span className="flex items-center gap-1 text-muted">
                <Users className="w-3 h-3" />
                {job.applicantCount}
              </span>
            )}
          </div>

          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {skills.slice(0, 4).map((skill: string) => (
                <span
                  key={skill}
                  className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-medium"
                >
                  {skill}
                </span>
              ))}
              {skills.length > 4 && (
                <span className="text-[10px] text-muted self-center">
                  +{skills.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {job.confidenceScore !== null && (
            <div className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl text-lg font-bold",
              getConfidenceBg(job.confidenceScore),
              getConfidenceColor(job.confidenceScore)
            )}>
              {Math.round(job.confidenceScore)}
            </div>
          )}
          <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
        </div>
      </div>
    </button>
  );
}
