"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, Eye, EyeOff, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { uniqueId } = await login(identifier, password);
      // Redirect based on role — we get the role from auth context after login
      // The getMe call in context will set the user, but we can check the response
      // For now, let's fetch role from the context after login resolves
      // Simpler: check if user used a counsellor-like identifier or fetch from context
      // The auth context updates user after login, so we check the role
      const token = localStorage.getItem("mindpulse_token");
      if (token) {
        // Decode JWT to get role (payload is in part 1)
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.role === "counsellor") {
          router.push("/dashboard");
        } else {
          router.push("/student");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-15 bg-mindpulse-purple animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] opacity-15 bg-mindpulse-teal animate-pulse" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-3xl">🧠</span>
            <span className="text-2xl font-bold gradient-text">MindPulse</span>
          </div>
          <p className="text-mindpulse-muted text-sm">Welcome back to MindPulse</p>
          <p className="text-xs text-mindpulse-muted/60 mt-1">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-mindpulse-teal hover:underline">
              Register here →
            </Link>
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 border border-white/10">
          <h2 className="text-xl font-semibold text-mindpulse-text mb-6 text-center">
            Sign In
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email or Unique ID */}
            <div>
              <label className="block text-sm font-medium text-mindpulse-muted mb-2">
                Email or Unique ID
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mindpulse-muted" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="email@example.com or MP-1234-A"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-mindpulse-text placeholder:text-mindpulse-muted/50 focus:outline-none focus:ring-2 focus:ring-mindpulse-purple/50 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-mindpulse-muted mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mindpulse-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-mindpulse-text placeholder:text-mindpulse-muted/50 focus:outline-none focus:ring-2 focus:ring-mindpulse-purple/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mindpulse-muted hover:text-mindpulse-text transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-mindpulse-coral text-sm text-center bg-mindpulse-coral/10 py-2 px-4 rounded-lg">
                ❌ {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-btn text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Sign In →"
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <Link
              href="/"
              className="text-xs text-mindpulse-muted hover:text-mindpulse-teal transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}