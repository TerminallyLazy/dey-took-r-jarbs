"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Crosshair,
  User,
  Settings,
  Github,
  RefreshCw,
} from "lucide-react";
import StatsBar from "@/components/StatsBar";
import SearchBar from "@/components/SearchBar";
import FilterBar from "@/components/FilterBar";
import JobCard from "@/components/JobCard";
import JobDetail from "@/components/JobDetail";
import ProfileModal from "@/components/ProfileModal";
import SearchConfigPanel from "@/components/SearchConfigPanel";
import type { JobWithRelations, ScrapeResult } from "@/types";

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function Home() {
  const [jobs, setJobs] = useState<JobWithRelations[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobWithRelations | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [sortBy, setSortBy] = useState("scrapedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<ScrapeResult | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showSearchConfig, setShowSearchConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: "20",
      sortBy,
      sortOrder,
    });

    if (search) params.set("search", search);
    if (activeFilter === "new") {
      params.set("newOnly", "true");
    } else if (activeFilter && activeFilter !== "no-application") {
      params.set("status", activeFilter);
    } else if (activeFilter === "no-application") {
      params.set("status", "no-application");
    }

    try {
      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.jobs) {
        console.error("Jobs API error:", data.error || data);
        setJobs([]);
        return;
      }
      setJobs(data.jobs);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      setJobs([]);
    }
    setIsLoading(false);
  }, [pagination.page, search, activeFilter, sortBy, sortOrder, refreshKey]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((p) => ({ ...p, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function handleScrape(query: string, location: string) {
    setIsScraping(true);
    setScrapeResult(null);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, location }),
      });
      const result = await res.json();
      setScrapeResult(result);
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Scrape failed:", error);
    }
    setIsScraping(false);
  }

  function handleJobSelect(job: JobWithRelations) {
    setSelectedJob(job);
  }

  function handleFilterChange(filter: string) {
    setActiveFilter(filter);
    setPagination((p) => ({ ...p, page: 1 }));
  }

  function handleSortChange(newSortBy: string, newSortOrder: string) {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPagination((p) => ({ ...p, page: 1 }));
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Crosshair className="w-8 h-8 text-accent" />
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-background" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  Dey Took R Jarbs
                </h1>
                <p className="text-[11px] text-muted -mt-0.5">
                  AI-Powered Job Hunting Command Center
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                className="p-2 rounded-lg hover:bg-surface-hover text-muted hover:text-white transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowSearchConfig(true)}
                className="p-2 rounded-lg hover:bg-surface-hover text-muted hover:text-white transition-colors"
                title="Auto-scan settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowProfile(true)}
                className="p-2 rounded-lg hover:bg-surface-hover text-muted hover:text-white transition-colors"
                title="Your profile"
              >
                <User className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        <StatsBar />

        <SearchBar
          search={search}
          onSearchChange={setSearch}
          onScrape={handleScrape}
          isScraping={isScraping}
        />

        {/* Scrape Result Toast */}
        {scrapeResult && (
          <div className="flex items-center gap-4 p-3 rounded-xl bg-surface border border-border animate-fade-in">
            <div className="flex items-center gap-6 text-sm">
              <span className="text-zinc-300">
                Scan complete for <span className="font-semibold text-white">{scrapeResult.query}</span> in{" "}
                <span className="font-semibold text-white">{scrapeResult.location}</span>
              </span>
              <span className="text-cyan-400 font-semibold">{scrapeResult.newJobs} new</span>
              <span className="text-muted">{scrapeResult.duplicates} duplicates skipped</span>
              {scrapeResult.errors && (
                <span className="text-amber-400 text-xs">{scrapeResult.errors}</span>
              )}
            </div>
            <button
              onClick={() => setScrapeResult(null)}
              className="ml-auto text-muted hover:text-white text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        <FilterBar
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
        />

        {/* Job List + Detail Split View */}
        <div className="flex gap-6" style={{ minHeight: "calc(100vh - 420px)" }}>
          {/* Job List */}
          <div
            className={`flex-1 space-y-2 overflow-y-auto ${
              selectedJob ? "max-w-md" : ""
            }`}
          >
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="loading-shimmer h-28 rounded-xl" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Crosshair className="w-12 h-12 text-zinc-700 mb-4" />
                <h3 className="text-lg font-semibold text-zinc-400">No jobs found</h3>
                <p className="text-sm text-muted mt-1 max-w-sm">
                  {search
                    ? "Try adjusting your search terms"
                    : "Hit 'Scan Jobs' to start pulling in opportunities"}
                </p>
              </div>
            ) : (
              <>
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onClick={handleJobSelect}
                    isSelected={selectedJob?.id === job.id}
                  />
                ))}

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                      onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                      disabled={pagination.page <= 1}
                      className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-zinc-300 disabled:opacity-30 hover:border-border-hover transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-muted px-2">
                      {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                      disabled={pagination.page >= pagination.pages}
                      className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-zinc-300 disabled:opacity-30 hover:border-border-hover transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Detail Panel */}
          {selectedJob && (
            <div className="flex-1 max-w-2xl bg-surface border border-border rounded-2xl overflow-hidden animate-slide-in">
              <JobDetail
                job={selectedJob}
                onClose={() => setSelectedJob(null)}
                onUpdate={() => {
                  setRefreshKey((k) => k + 1);
                  // Re-fetch the selected job
                  fetch(`/api/jobs/${selectedJob.id}`)
                    .then((r) => {
                      if (!r.ok) throw new Error("Failed to fetch job");
                      return r.json();
                    })
                    .then(setSelectedJob)
                    .catch(console.error);
                }}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="max-w-[1600px] mx-auto px-6 flex items-center justify-between text-xs text-muted">
          <span>Dey Took R Jarbs v1.0 — Powered by Claude AI</span>
          <div className="flex items-center gap-4">
            <span>Built with Next.js + Anthropic Agent SDK</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
      <SearchConfigPanel isOpen={showSearchConfig} onClose={() => setShowSearchConfig(false)} />
    </div>
  );
}
