"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Power, PowerOff, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchConfigItem {
  id: string;
  query: string;
  location: string;
  isActive: boolean;
}

interface SearchConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchConfigPanel({ isOpen, onClose }: SearchConfigPanelProps) {
  const [configs, setConfigs] = useState<SearchConfigItem[]>([]);
  const [newQuery, setNewQuery] = useState("");
  const [newLocation, setNewLocation] = useState("");

  useEffect(() => {
    if (isOpen) loadConfigs();
  }, [isOpen]);

  async function loadConfigs() {
    try {
      const res = await fetch("/api/search-config");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setConfigs(data);
    } catch (error) {
      console.error("Failed to load configs:", error);
    }
  }

  async function addConfig() {
    if (!newQuery || !newLocation) return;
    await fetch("/api/search-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: newQuery, location: newLocation }),
    });
    setNewQuery("");
    setNewLocation("");
    loadConfigs();
  }

  async function toggleConfig(id: string, isActive: boolean) {
    await fetch("/api/search-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    loadConfigs();
  }

  async function deleteConfig(id: string) {
    await fetch("/api/search-config", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadConfigs();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-surface border border-border shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent/10">
              <Settings className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Auto-Scan Searches</h2>
              <p className="text-xs text-muted">These run automatically every hour via cron</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-hover text-muted hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Add New */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newQuery}
              onChange={(e) => setNewQuery(e.target.value)}
              placeholder="Job title / keywords"
              className="flex-1 px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
            />
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Location"
              className="flex-1 px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
            />
            <button
              onClick={addConfig}
              disabled={!newQuery || !newLocation}
              className="p-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Config List */}
          <div className="space-y-2">
            {configs.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">
                No searches configured yet. Add one above.
              </p>
            ) : (
              configs.map((config) => (
                <div
                  key={config.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors",
                    config.isActive
                      ? "bg-surface border-border"
                      : "bg-zinc-900/50 border-zinc-800/50 opacity-60"
                  )}
                >
                  <div>
                    <div className="text-sm font-medium text-zinc-200">{config.query}</div>
                    <div className="text-xs text-muted">{config.location}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleConfig(config.id, config.isActive)}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        config.isActive
                          ? "text-emerald-400 hover:bg-emerald-400/10"
                          : "text-zinc-500 hover:bg-zinc-800"
                      )}
                    >
                      {config.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteConfig(config.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
