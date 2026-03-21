"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Brain, TrendingUp, Moon, Zap, MessageSquare,
  Trash2, LogOut, Calendar, Filter, ChevronDown,
  AlertTriangle, CheckCircle2, ArrowLeft,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/lib/auth-context";
import {
  getHistory, getMessages, deleteMyData,
  type CheckinEntry, type MessageEntry,
} from "@/lib/api";

export default function StudentDashboard() {
  const router = useRouter();
  const { user, isLoggedIn, isLoading, isStudent, logout } = useAuth();

  const [checkins, setCheckins] = useState<CheckinEntry[]>([]);
  const [summary, setSummary] = useState<{
    totalCheckins: number; avgMood: number; avgStress: number; avgSleep: number;
  } | null>(null);
  const [messages, setMessages] = useState<MessageEntry[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("recent");
  const [loadingData, setLoadingData] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !isStudent)) {
      router.push("/login");
    }
  }, [isLoading, isLoggedIn, isStudent, router]);

  // Fetch data
  useEffect(() => {
    if (!isLoggedIn || !isStudent) return;

    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [historyRes, msgRes] = await Promise.all([
          getHistory(filter !== "recent" ? { filter } : undefined),
          getMessages(),
        ]);
        setCheckins(historyRes.checkins);
        setSummary(historyRes.summary);
        setMessages(msgRes.messages);
        setUnreadCount(msgRes.unreadCount);
      } catch (err) {
        console.error("Failed to load data:", err);
      }
      setLoadingData(false);
    };

    fetchData();
  }, [isLoggedIn, isStudent, filter]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteMyData();
      setCheckins([]);
      setSummary(null);
      setMessages([]);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error("Delete failed:", err);
    }
    setDeleting(false);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-mindpulse-purple/30 border-t-mindpulse-purple rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn || !isStudent) return null;

  // Prepare chart data — reverse to show oldest first
  const chartData = [...checkins].reverse().map((c) => ({
    date: new Date(c.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    mood: c.mood,
    stress: c.stress,
    sleep: c.sleep,
  }));

  return (
    <div className="min-h-screen bg-mindpulse-bg">
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 px-6 py-4 bg-mindpulse-bg/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mindpulse-purple to-mindpulse-teal flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">MindPulse</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-mindpulse-muted hover:text-mindpulse-text transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Check-in
            </Link>
            <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <code className="text-sm font-mono text-mindpulse-teal">{user?.uniqueId}</code>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-mindpulse-muted hover:text-mindpulse-coral hover:bg-mindpulse-coral/10 transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-mindpulse-text mb-2">
            Your Dashboard 🧠
          </h1>
          <p className="text-mindpulse-muted">
            Track your wellness journey. All data is anonymous.
          </p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-mindpulse-purple to-blue-500 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold gradient-text">{summary.totalCheckins}</p>
              <p className="text-sm text-mindpulse-muted">Total Check-ins</p>
            </div>

            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-mindpulse-teal to-green-500 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold gradient-text">{summary.avgMood}/5</p>
              <p className="text-sm text-mindpulse-muted">Avg Mood</p>
            </div>

            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-mindpulse-amber to-orange-500 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold gradient-text">{summary.avgStress}/10</p>
              <p className="text-sm text-mindpulse-muted">Avg Stress</p>
            </div>

            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold gradient-text">{summary.avgSleep}h</p>
              <p className="text-sm text-mindpulse-muted">Avg Sleep</p>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex items-center gap-3 mb-6">
          <Filter className="w-4 h-4 text-mindpulse-muted" />
          {["recent", "monthly", "yearly"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? "bg-gradient-to-r from-mindpulse-purple to-mindpulse-teal text-white"
                  : "bg-white/5 text-mindpulse-muted hover:bg-white/10"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Mood Trend Chart */}
        {chartData.length > 0 && (
          <div className="glass-card rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-mindpulse-text mb-4">
              Mood Trend
            </h2>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="studentMoodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6C63FF" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#00D4AA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#8B8FA8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8B8FA8" fontSize={12} tickLine={false} axisLine={false} domain={[1, 5]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0F1729",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#F0F0FF",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="mood"
                    stroke="#6C63FF"
                    strokeWidth={3}
                    fill="url(#studentMoodGrad)"
                    name="Mood"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {checkins.length === 0 && !loadingData && (
          <div className="glass-card rounded-xl p-12 flex flex-col items-center justify-center text-center mb-8">
            <span className="text-5xl mb-4">📊</span>
            <h2 className="text-xl font-semibold text-mindpulse-text mb-2">No check-ins yet</h2>
            <p className="text-mindpulse-muted mb-4">Start by submitting your first mood check-in!</p>
            <Link
              href="/"
              className="gradient-btn text-white font-medium py-2.5 px-6 rounded-xl transition-all"
            >
              Go to Check-in →
            </Link>
          </div>
        )}

        {/* Check-ins History List */}
        {checkins.length > 0 && (
          <div className="glass-card rounded-xl overflow-hidden mb-8">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-lg font-semibold text-mindpulse-text">Check-in History</h2>
            </div>
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-mindpulse-bg/95 backdrop-blur z-10">
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-4 text-sm font-medium text-mindpulse-muted">Date & Time</th>
                    <th className="px-6 py-4 text-sm font-medium text-mindpulse-muted">Mood</th>
                    <th className="px-6 py-4 text-sm font-medium text-mindpulse-muted">Stress</th>
                    <th className="px-6 py-4 text-sm font-medium text-mindpulse-muted">Sleep</th>
                    <th className="px-6 py-4 text-sm font-medium text-mindpulse-muted">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {checkins.map((checkin, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-mindpulse-text whitespace-nowrap">
                        {new Date(checkin.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${checkin.mood >= 4 ? 'bg-mindpulse-teal' : checkin.mood >= 3 ? 'bg-mindpulse-amber' : 'bg-mindpulse-coral'}`} />
                          <span className="text-sm text-mindpulse-text">{checkin.mood}/5</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-mindpulse-text">{checkin.stress}/10</td>
                      <td className="px-6 py-4 text-sm text-mindpulse-text">{checkin.sleep}h</td>
                      <td className="px-6 py-4 text-sm text-mindpulse-muted max-w-xs truncate" title={checkin.note}>
                        {checkin.note || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Messages from Counsellor */}
        <div className="glass-card rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-mindpulse-text mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-mindpulse-purple" />
            Messages from Counsellor
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-mindpulse-coral text-white">
                {unreadCount} new
              </span>
            )}
          </h2>

          {messages.length === 0 ? (
            <div className="text-center py-8 text-mindpulse-muted">
              <span className="text-4xl block mb-3">💬</span>
              <p>No messages yet. Your counsellor may reach out anonymously.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-emerald-500/20 border-2 border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] border-l-4 border-l-emerald-400"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/30 flex items-center justify-center shrink-0 ring-2 ring-emerald-400/40">
                      <span className="text-lg">🧑‍⚕️</span>
                    </div>
                    <div>
                      <p className="text-sm mb-1 font-semibold text-emerald-400">Counsellor Message</p>
                      <p className="text-sm text-mindpulse-text mb-2">{msg.content}</p>
                      <p className="text-xs text-emerald-400/70">
                        {new Date(msg.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger Zone — Delete Data */}
        <div className="glass-card rounded-xl p-6 border border-mindpulse-coral/20">
          <h2 className="text-lg font-semibold text-mindpulse-coral mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </h2>
          <p className="text-sm text-mindpulse-muted mb-4">
            Permanently delete all your check-in data, alerts, and messages. This cannot be undone.
          </p>

          {showDeleteConfirm ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl bg-mindpulse-coral text-white text-sm font-medium hover:bg-mindpulse-coral/90 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Yes, Delete Everything
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 rounded-xl bg-white/5 text-mindpulse-muted text-sm hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2.5 rounded-xl border border-mindpulse-coral/30 text-mindpulse-coral text-sm font-medium hover:bg-mindpulse-coral/10 transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete All My Data
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
