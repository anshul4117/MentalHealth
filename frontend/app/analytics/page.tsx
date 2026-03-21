"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ChevronDown, Lightbulb, ArrowRight, TrendingUp, Users, AlertTriangle, RefreshCw } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useAuth } from "@/lib/auth-context";
import { getAnalytics } from "@/lib/api";

export default function AnalyticsPage() {
  const { isLoggedIn, isCounsellor, isLoading } = useAuth();
  const router = useRouter();

  const [deptData, setDeptData] = useState<{ department: string; avgMood: number; avgStress: number; avgSleep: number; checkins: number }[]>([]);
  const [totalCheckins, setTotalCheckins] = useState(0);
  const [totalResolved, setTotalResolved] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !isCounsellor)) {
      router.push("/login");
      return;
    }
    if (isLoggedIn && isCounsellor) {
      fetchData();
    }
  }, [isLoggedIn, isCounsellor, isLoading, router]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAnalytics();
      setDeptData(data.moodByDept);
      setTotalCheckins(data.totalCheckins);
      setTotalResolved(data.totalResolved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics.");
    }
    setLoading(false);
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-mindpulse-bg">
        <DashboardSidebar />
        <main className="ml-[260px] p-8 flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-mindpulse-purple/30 border-t-mindpulse-purple rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  const metricCards = [
    {
      label: "Total Check-ins",
      value: String(totalCheckins),
      icon: Users,
      gradient: "from-mindpulse-purple to-blue-500",
    },
    {
      label: "Avg Mood (All Depts)",
      value: deptData.length > 0
        ? (deptData.reduce((s, d) => s + d.avgMood, 0) / deptData.length).toFixed(1)
        : "—",
      icon: TrendingUp,
      gradient: "from-mindpulse-teal to-green-500",
    },
    {
      label: "Resolved Alerts",
      value: String(totalResolved),
      icon: AlertTriangle,
      gradient: "from-mindpulse-amber to-orange-500",
    },
  ];

  const insights = deptData.length > 0 ? [
    ...(deptData.some(d => d.avgMood < 3) ? [{
      title: "Low Mood Department",
      description: `${deptData.filter(d => d.avgMood < 3).map(d => d.department).join(", ")} ${deptData.filter(d => d.avgMood < 3).length > 1 ? "have" : "has"} below-average mood scores. Consider targeted wellness programs.`,
      color: "#FF6B6B",
    }] : []),
    ...(deptData.some(d => d.avgStress > 6) ? [{
      title: "High Stress Alert",
      description: `${deptData.filter(d => d.avgStress > 6).map(d => d.department).join(", ")} report high stress levels (>6/10). Review academic workload.`,
      color: "#FFB347",
    }] : []),
    ...(deptData.some(d => d.avgSleep < 5) ? [{
      title: "Sleep Concern",
      description: `Students in ${deptData.filter(d => d.avgSleep < 5).map(d => d.department).join(", ")} are averaging under 5 hours of sleep. Consider sleep hygiene workshops.`,
      color: "#6C63FF",
    }] : []),
  ] : [];

  return (
    <div className="min-h-screen bg-mindpulse-bg">
      <DashboardSidebar />
      <main className="ml-[260px] p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-mindpulse-text">
            Campus Wellness Analytics
          </h1>
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-white/5 text-mindpulse-muted hover:text-mindpulse-text hover:bg-white/10 transition-all"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="glass-card rounded-xl p-6 mb-8 text-center">
            <p className="text-mindpulse-coral mb-4">❌ {error}</p>
            <button onClick={fetchData} className="gradient-btn text-white py-2 px-6 rounded-xl">Retry</button>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {metricCards.map((metric, index) => (
            <div key={index} className="glass-card rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-mindpulse-muted mb-1">{metric.label}</p>
                  <p className="text-3xl font-bold gradient-text">{metric.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${metric.gradient} flex items-center justify-center`}>
                  <metric.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mood by Department Bar Chart */}
        {deptData.length > 0 && (
          <div className="glass-card rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-mindpulse-text mb-6">
              Mood by Department
            </h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} layout="vertical" barSize={24}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6C63FF" />
                      <stop offset="100%" stopColor="#00D4AA" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" stroke="#8B8FA8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 5]} />
                  <YAxis type="category" dataKey="department" stroke="#8B8FA8" fontSize={12} tickLine={false} axisLine={false} width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0F1729",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#F0F0FF",
                    }}
                    formatter={(value: number) => [value.toFixed(2), "Avg Mood"]}
                  />
                  <Bar dataKey="avgMood" fill="url(#barGradient)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Department Details Table */}
        {deptData.length > 0 && (
          <div className="glass-card rounded-xl overflow-hidden mb-8">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-lg font-semibold text-mindpulse-text">Department Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-4 text-left text-sm font-medium text-mindpulse-muted">Department</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-mindpulse-muted">Avg Mood</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-mindpulse-muted">Avg Stress</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-mindpulse-muted">Avg Sleep</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-mindpulse-muted">Check-ins</th>
                  </tr>
                </thead>
                <tbody>
                  {deptData.map((dept, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-mindpulse-purple/5 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-mindpulse-text">{dept.department}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${dept.avgMood >= 3 ? "text-mindpulse-teal" : "text-mindpulse-coral"}`}>
                          {dept.avgMood.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${dept.avgStress <= 5 ? "text-mindpulse-teal" : "text-mindpulse-amber"}`}>
                          {dept.avgStress.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-mindpulse-text">{dept.avgSleep.toFixed(1)}h</td>
                      <td className="px-6 py-4 text-sm text-mindpulse-muted">{dept.checkins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Insights Section */}
        {insights.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-mindpulse-text mb-6 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-mindpulse-amber" />
              Data-Driven Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className="glass-card rounded-xl p-6 border-l-4"
                  style={{ borderLeftColor: insight.color }}
                >
                  <h3 className="font-semibold text-mindpulse-text mb-2">{insight.title}</h3>
                  <p className="text-sm text-mindpulse-muted">{insight.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {deptData.length === 0 && !error && (
          <div className="glass-card rounded-xl p-12 text-center">
            <span className="text-5xl block mb-4">📊</span>
            <h2 className="text-xl font-semibold text-mindpulse-text mb-2">No data yet</h2>
            <p className="text-mindpulse-muted">Analytics will appear once students start submitting check-ins.</p>
          </div>
        )}
      </main>
    </div>
  );
}
