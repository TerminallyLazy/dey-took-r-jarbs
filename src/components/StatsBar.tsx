"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  Sparkles,
  Send,
  MessageSquare,
  Trophy,
  XCircle,
  TrendingUp,
  Clock,
} from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import type { DashboardStats } from "@/types";

const statConfig = [
  { key: "totalJobs", label: "Total Jobs", icon: Briefcase, color: "text-zinc-300" },
  { key: "newJobs", label: "New", icon: Sparkles, color: "text-cyan-400" },
  { key: "applied", label: "Applied", icon: Send, color: "text-blue-400" },
  { key: "interviewing", label: "Interviews", icon: MessageSquare, color: "text-amber-400" },
  { key: "offered", label: "Offers", icon: Trophy, color: "text-emerald-400" },
  { key: "rejected", label: "Rejected", icon: XCircle, color: "text-red-400" },
] as const;

export default function StatsBar() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="loading-shimmer h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
      {statConfig.map(({ key, label, icon: Icon, color }) => (
        <div
          key={key}
          className="bg-surface border border-border rounded-xl p-4 hover:border-border-hover transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <Icon className={cn("w-3.5 h-3.5", color)} />
            <span className="text-xs text-muted font-medium">{label}</span>
          </div>
          <div className="text-2xl font-bold tracking-tight">
            {stats[key as keyof DashboardStats] as number}
          </div>
        </div>
      ))}

      <div className="bg-surface border border-border rounded-xl p-4 hover:border-border-hover transition-colors">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs text-muted font-medium">Avg Match</span>
        </div>
        <div className="text-2xl font-bold tracking-tight">
          {stats.avgConfidence}
          <span className="text-sm text-muted font-normal">%</span>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 hover:border-border-hover transition-colors">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs text-muted font-medium">Last Scan</span>
        </div>
        <div className="text-sm font-semibold tracking-tight mt-1">
          {timeAgo(stats.lastScrape)}
        </div>
      </div>
    </div>
  );
}
