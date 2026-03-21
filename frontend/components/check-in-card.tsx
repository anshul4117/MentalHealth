"use client";

import { useState, useEffect } from "react";
import { ArrowRight, CheckCircle2, LogIn, ChevronDown, BookOpen } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { submitCheckin } from "@/lib/api";

const DEPARTMENTS = [
  "Computer Science",
  "Information Technology",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Other"
];

const moods = [
  { emoji: "😢", label: "Struggling", value: 1 },
  { emoji: "😔", label: "Down", value: 2 },
  { emoji: "😐", label: "Okay", value: 3 },
  { emoji: "🙂", label: "Good", value: 4 },
  { emoji: "😊", label: "Great", value: 5 },
];

export function CheckInCard() {
  const { isLoggedIn, isLoading, user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [sleep, setSleep] = useState(7);
  const [stress, setStress] = useState(5);
  const [notes, setNotes] = useState("");
  // Auto-select department if available from user profile
  const [department, setDepartment] = useState("");

  // Initialize department when user loads
  useEffect(() => {
    if (user?.course && DEPARTMENTS.includes(user.course)) {
      setDepartment(user.course);
    }
  }, [user]);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood) return;
    setIsSubmitting(true);
    setError("");

    try {
      await submitCheckin({
        mood: selectedMood,
        sleep,
        stress,
        note: notes,
        department: department || "General",
      });
      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit check-in.");
    }

    setIsSubmitting(false);
  };

  // Not logged in — show login prompt
  if (!isLoading && !isLoggedIn) {
    return (
      <div className="glass-card rounded-2xl p-8 md:p-12 max-w-[520px] w-full mx-auto animate-fade-in-up">
        <div className="text-center">
          <span className="text-5xl block mb-4">🔒</span>
          <h2 className="text-2xl font-bold gradient-text mb-3">
            Login to Check In
          </h2>
          <p className="text-mindpulse-muted mb-6 text-sm">
            Create an account or sign in to submit your anonymous mood check-in. Your privacy is always protected.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="gradient-btn text-white font-medium py-3 px-6 rounded-xl text-center transition-all duration-200"
            >
              Create Account
            </Link>
            <Link
              href="/login"
              className="border border-white/10 text-mindpulse-text font-medium py-3 px-6 rounded-xl hover:bg-white/5 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="glass-card rounded-2xl p-8 md:p-12 max-w-[520px] w-full mx-auto animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-mindpulse-teal/20 to-mindpulse-purple/20 flex items-center justify-center glow-teal">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" stroke="#00D4AA" strokeWidth="2" opacity="0.3" />
              <path
                d="M14 24L21 31L34 18"
                stroke="#00D4AA"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-center gradient-text mb-3">
          {"You're seen. You're heard."} 💚
        </h2>
        <p className="text-mindpulse-muted text-center mb-2">
          Your check-in was recorded anonymously. No one knows it was you.
        </p>
        <p className="text-mindpulse-teal text-center text-sm mb-8">
          🔥 Keep checking in daily — early patterns help us help you.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/student"
            className="flex-1 gradient-btn text-white font-medium py-3 px-6 rounded-xl text-center transition-all duration-200"
          >
            View My Dashboard
          </Link>
          <button
            onClick={() => {
              setIsSubmitted(false);
              setSelectedMood(null);
              setNotes("");
              setSleep(7);
              setStress(5);
              setDepartment("");
              setError("");
            }}
            className="flex-1 border border-white/10 text-mindpulse-text font-medium py-3 px-6 rounded-xl hover:bg-white/5 transition-all duration-200"
          >
            New Check-in
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card rounded-2xl p-6 md:p-10 max-w-[520px] w-full mx-auto animate-fade-in-up"
    >
      {/* Logged in indicator */}
      <div className="flex items-center gap-2 mb-6 p-3 rounded-xl bg-white/5 border border-white/5">
        <CheckCircle2 className="w-4 h-4 text-mindpulse-teal" />
        <span className="text-xs text-mindpulse-muted">
          Logged in as <code className="font-mono text-mindpulse-teal">{user?.uniqueId}</code>
        </span>
        <Link href="/student" className="ml-auto text-xs text-mindpulse-purple hover:underline">
          My Dashboard →
        </Link>
      </div>

      {/* Mood Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-mindpulse-muted mb-3">
          How are you feeling?
        </label>
        <div className="flex justify-between gap-2">
          {moods.map((mood) => (
            <button
              key={mood.value}
              type="button"
              onClick={() => setSelectedMood(mood.value)}
              className={`flex-1 aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                selectedMood === mood.value
                  ? "bg-gradient-to-br from-mindpulse-purple to-mindpulse-teal scale-105 glow-purple"
                  : "bg-white/5 hover:bg-white/10 border border-white/10"
              }`}
            >
              <span className="text-2xl md:text-3xl">{mood.emoji}</span>
              <span className="text-[10px] md:text-xs text-mindpulse-muted">{mood.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Department */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-mindpulse-muted mb-2">
          Department
        </label>
        <div className="relative">
          <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mindpulse-muted pointer-events-none" />
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-mindpulse-text focus:outline-none focus:ring-2 focus:ring-mindpulse-purple/50 transition-all duration-200 appearance-none cursor-pointer"
          >
            <option value="" disabled className="bg-mindpulse-bg text-mindpulse-muted">
              Select your department
            </option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept} className="bg-mindpulse-bg text-mindpulse-text">
                {dept}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mindpulse-muted pointer-events-none" />
        </div>
      </div>

      {/* Sleep Slider */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-mindpulse-muted">Hours of Sleep</label>
          <span className="text-sm font-semibold text-mindpulse-text">{sleep}h</span>
        </div>
        <input
          type="range"
          min="0"
          max="12"
          value={sleep}
          onChange={(e) => setSleep(Number(e.target.value))}
          className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-mindpulse-purple [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-mindpulse-purple [&::-webkit-slider-thumb]:to-mindpulse-teal"
          style={{
            background: `linear-gradient(to right, #6C63FF 0%, #00D4AA ${(sleep / 12) * 100}%, rgba(255,255,255,0.1) ${(sleep / 12) * 100}%)`,
          }}
        />
      </div>

      {/* Stress Slider */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-mindpulse-muted">Academic Stress Level</label>
          <span className="text-sm font-semibold text-mindpulse-text">{stress}/10</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={stress}
          onChange={(e) => setStress(Number(e.target.value))}
          className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-mindpulse-purple [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-mindpulse-purple [&::-webkit-slider-thumb]:to-mindpulse-teal"
          style={{
            background: `linear-gradient(to right, #6C63FF 0%, #00D4AA ${((stress - 1) / 9) * 100}%, rgba(255,255,255,0.1) ${((stress - 1) / 9) * 100}%)`,
          }}
        />
      </div>

      {/* Notes */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-mindpulse-muted mb-2">
          Anything else? (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Share what's on your mind..."
          rows={3}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-mindpulse-text placeholder:text-mindpulse-muted/50 focus:outline-none focus:ring-2 focus:ring-mindpulse-purple/50 focus:border-transparent transition-all duration-200 resize-none"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-mindpulse-coral text-sm text-center bg-mindpulse-coral/10 py-2 px-4 rounded-lg mb-4">
          ❌ {error}
        </p>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!selectedMood || isSubmitting}
        className="w-full gradient-btn text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
      >
        <span className="relative z-10">
          {isSubmitting ? "Submitting..." : "Submit Check-in"}
        </span>
        {!isSubmitting && (
          <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
        )}
      </button>
    </form>
  );
}