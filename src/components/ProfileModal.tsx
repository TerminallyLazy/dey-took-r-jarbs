"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, User } from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  skills: string;
  experience: string;
  education: string;
  resumeText: string;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    phone: "",
    skills: "",
    experience: "",
    education: "",
    resumeText: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetch("/api/profile")
        .then((r) => r.json())
        .then((data) => {
          if (data) setProfile(data);
        })
        .catch(console.error);
    }
  }, [isOpen]);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      onClose();
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
    setSaving(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-surface border border-border shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent/10">
              <User className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Your Profile</h2>
              <p className="text-xs text-muted">Used for AI job matching and cover letter generation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-hover text-muted hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted font-medium mb-1.5">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-xs text-muted font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted font-medium mb-1.5">Phone</label>
            <input
              type="text"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div>
            <label className="block text-xs text-muted font-medium mb-1.5">
              Skills <span className="text-zinc-600">(comma separated)</span>
            </label>
            <input
              type="text"
              value={profile.skills}
              onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
              placeholder="React, TypeScript, Node.js, Python, AWS..."
            />
          </div>

          <div>
            <label className="block text-xs text-muted font-medium mb-1.5">Experience Summary</label>
            <textarea
              value={profile.experience}
              onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors resize-none"
              placeholder="5+ years of full-stack development. Led a team of 8 engineers at..."
            />
          </div>

          <div>
            <label className="block text-xs text-muted font-medium mb-1.5">Education</label>
            <input
              type="text"
              value={profile.education}
              onChange={(e) => setProfile({ ...profile, education: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
              placeholder="B.S. Computer Science, MIT 2018"
            />
          </div>

          <div>
            <label className="block text-xs text-muted font-medium mb-1.5">
              Resume / CV <span className="text-zinc-600">(paste full text for best AI matching)</span>
            </label>
            <textarea
              value={profile.resumeText}
              onChange={(e) => setProfile({ ...profile, resumeText: e.target.value })}
              rows={6}
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors resize-none font-mono text-xs"
              placeholder="Paste your full resume text here..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm text-muted hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !profile.name || !profile.email}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}
