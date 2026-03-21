"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, CheckCircle2, X, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  getDashboard, sendMessage as apiSendMessage, resolveAlert as apiResolveAlert,
  type DashboardAlert,
} from "@/lib/api";

export default function AlertsPage() {
  const { isLoggedIn, isCounsellor, isLoading } = useAuth();
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<DashboardAlert | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDashboard();
      setAlerts(data.alerts);
    } catch (err) {
      console.error("Failed to load alerts:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isLoggedIn && isCounsellor) fetchAlerts();
  }, [isLoggedIn, isCounsellor, fetchAlerts]);

  const handleResolve = async (alertId: string) => {
    try {
      await apiResolveAlert(alertId);
      fetchAlerts();
    } catch (err) {
      console.error("Resolve failed:", err);
    }
  };

  const handleSend = async () => {
    if (!selectedAlert || !message.trim()) return;
    setSending(true);
    try {
      await apiSendMessage({ tokenId: selectedAlert.tokenId, message: message.trim() });
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setMessage("");
        setSelectedAlert(null);
      }, 1500);
    } catch (err) {
      console.error("Send failed:", err);
    }
    setSending(false);
  };

  if (isLoading || loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-mindpulse-purple/30 border-t-mindpulse-purple rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-mindpulse-text mb-2">🚨 Active Alerts</h1>
          <p className="text-mindpulse-muted">Students flagged by the AI risk detection system.</p>
        </div>
        <button
          onClick={fetchAlerts}
          className="p-2.5 rounded-xl bg-white/5 text-mindpulse-muted hover:text-mindpulse-text hover:bg-white/10 transition-all"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Message Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setSelectedAlert(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAlert(null)} />
          <div className="relative w-full max-w-md glass-card rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-mindpulse-text">Send Message to {selectedAlert.tokenId}</h3>
              <button onClick={() => setSelectedAlert(null)} className="text-mindpulse-muted hover:text-mindpulse-text"><X className="w-5 h-5" /></button>
            </div>
            {sent ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <CheckCircle2 className="w-12 h-12 text-mindpulse-teal" />
                <p className="text-mindpulse-teal font-semibold">Message sent ✓</p>
              </div>
            ) : (
              <>
                <textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 1000))} placeholder="Your anonymous message..." rows={4} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-mindpulse-text placeholder:text-mindpulse-muted/40 focus:outline-none focus:ring-2 focus:ring-mindpulse-purple/50 text-sm resize-none mb-4" />
                <button onClick={handleSend} disabled={!message.trim() || sending} className="w-full py-3 rounded-xl bg-gradient-to-r from-mindpulse-purple to-mindpulse-teal text-white font-medium text-sm disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                  {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Message
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <span className="text-5xl block mb-4">✅</span>
          <h2 className="text-xl font-semibold text-mindpulse-text mb-2">No active alerts</h2>
          <p className="text-mindpulse-muted">All students are in a healthy range!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert, i) => (
            <div key={i} className={`glass-card rounded-xl p-5 border-l-4 ${
              alert.severity === "high" ? "border-l-mindpulse-coral" : "border-l-mindpulse-amber"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <code className="font-mono text-mindpulse-text">{alert.tokenId}</code>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  alert.severity === "high"
                    ? "bg-mindpulse-coral/20 text-mindpulse-coral"
                    : "bg-mindpulse-amber/20 text-mindpulse-amber"
                }`}>{alert.severity.toUpperCase()}</span>
              </div>
              <p className="text-sm text-mindpulse-muted mb-1">{alert.department}</p>
              <p className="text-sm text-mindpulse-text mb-3">{alert.reason}</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedAlert(alert)}
                  className="flex items-center gap-2 text-sm font-medium text-mindpulse-purple hover:text-mindpulse-teal transition-colors"
                >
                  <Send className="w-4 h-4" /> Send Message
                </button>
                {alert._id && (
                  <button
                    onClick={() => handleResolve(alert._id!)}
                    className="flex items-center gap-2 text-sm font-medium text-mindpulse-teal hover:text-mindpulse-text transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}