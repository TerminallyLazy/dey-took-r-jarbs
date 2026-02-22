"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X, Loader2, Radar } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onScrape: (query: string, location: string) => Promise<void>;
  isScraping: boolean;
}

export default function SearchBar({
  search,
  onSearchChange,
  onScrape,
  isScraping,
}: SearchBarProps) {
  const [showScrapeForm, setShowScrapeForm] = useState(false);
  const [scrapeQuery, setScrapeQuery] = useState("software engineer");
  const [scrapeLocation, setScrapeLocation] = useState("remote");

  async function handleScrape() {
    await onScrape(scrapeQuery, scrapeLocation);
    setShowScrapeForm(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search jobs by title, company, or location..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface border border-border text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrape Toggle */}
        <button
          onClick={() => setShowScrapeForm(!showScrapeForm)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border",
            showScrapeForm
              ? "bg-accent text-white border-accent glow-cyan"
              : "bg-surface text-zinc-300 border-border hover:border-border-hover hover:text-white"
          )}
        >
          <Radar className="w-4 h-4" />
          Scan Jobs
        </button>
      </div>

      {/* Scrape Form */}
      {showScrapeForm && (
        <div className="flex items-end gap-3 p-4 rounded-xl bg-surface border border-border animate-fade-in">
          <div className="flex-1">
            <label className="block text-xs text-muted font-medium mb-1.5">Job Title / Keywords</label>
            <input
              type="text"
              value={scrapeQuery}
              onChange={(e) => setScrapeQuery(e.target.value)}
              placeholder="e.g., senior react developer"
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-muted font-medium mb-1.5">Location</label>
            <input
              type="text"
              value={scrapeLocation}
              onChange={(e) => setScrapeLocation(e.target.value)}
              placeholder="e.g., remote, Austin TX"
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          <button
            onClick={handleScrape}
            disabled={isScraping || !scrapeQuery || !scrapeLocation}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {isScraping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Radar className="w-4 h-4" />
                Start Scan
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
