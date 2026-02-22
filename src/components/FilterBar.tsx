"use client";

import { cn } from "@/lib/utils";
import {
  Inbox,
  Sparkles,
  Send,
  MessageSquare,
  Trophy,
  XCircle,
  ArchiveX,
  ArrowUpDown,
} from "lucide-react";

interface FilterBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  sortBy: string;
  sortOrder: string;
  onSortChange: (sortBy: string, sortOrder: string) => void;
}

const filters = [
  { value: "", label: "All Jobs", icon: Inbox },
  { value: "new", label: "New", icon: Sparkles },
  { value: "interested", label: "Interested", icon: Sparkles },
  { value: "applied", label: "Applied", icon: Send },
  { value: "interviewing", label: "Interviews", icon: MessageSquare },
  { value: "offered", label: "Offers", icon: Trophy },
  { value: "rejected", label: "Rejected", icon: XCircle },
  { value: "no-application", label: "Untracked", icon: ArchiveX },
];

const sorts = [
  { value: "scrapedAt", label: "Date Added" },
  { value: "confidenceScore", label: "Match Score" },
  { value: "postedDate", label: "Posted Date" },
  { value: "company", label: "Company" },
];

export default function FilterBar({
  activeFilter,
  onFilterChange,
  sortBy,
  sortOrder,
  onSortChange,
}: FilterBarProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {filters.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => onFilterChange(value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
              activeFilter === value
                ? "bg-accent/15 text-accent border border-accent/30"
                : "text-muted hover:text-zinc-300 hover:bg-surface-hover"
            )}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value, sortOrder)}
          className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-accent/50"
        >
          {sorts.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          onClick={() => onSortChange(sortBy, sortOrder === "desc" ? "asc" : "desc")}
          className="px-2 py-1.5 rounded-lg bg-surface border border-border text-xs text-muted hover:text-white transition-colors"
        >
          {sortOrder === "desc" ? "Newest" : "Oldest"}
        </button>
      </div>
    </div>
  );
}
