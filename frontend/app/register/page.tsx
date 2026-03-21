"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, Eye, EyeOff, BookOpen, Copy, CheckCircle2, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const DEPARTMENTS = [
  "Computer Science",
  "Information Technology",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Other"
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [course, setCourse] = useState("");
  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uniqueId, setUniqueId] = useState("");
  const [copied, setCopied] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await register(email, password, course, role);
      setUniqueId(res.uniqueId);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    }

    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(uniqueId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinue = () => {
    if (role === "counsellor") {
      router.push("/dashboard");
    } else {
      router.push("/student");
    }
  };

  // Success screen — show Unique ID
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-15 bg-mindpulse-teal animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] opacity-15 bg-mindpulse-purple animate-pulse" />
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="glass-card rounded-2xl p-8 border border-white/10 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-mindpulse-teal/20 to-mindpulse-purple/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-mindpulse-teal" />
            </div>

            <h2 className="text-2xl font-bold gradient-text mb-2">
              Registration Successful! 🎉
            </h2>
            <p className="text-mindpulse-muted mb-6 text-sm">
              Your anonymous identity has been created. Save your Unique ID — it&apos;s how you stay anonymous.
            </p>

            {/* Unique ID display */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
              <p className="text-xs text-mindpulse-muted mb-2">Your Unique ID</p>
              <div className="flex items-center justify-center gap-3">
                <code className="text-2xl font-mono font-bold text-mindpulse-teal tracking-wider">
                  {uniqueId}
                </code>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-mindpulse-teal" />
                  ) : (
                    <Copy className="w-4 h-4 text-mindpulse-muted" />
                  )}
                </button>
              </div>
              {copied && (
                <p className="text-xs text-mindpulse-teal mt-2">Copied to clipboard!</p>
              )}
            </div>

            <div className="bg-mindpulse-amber/10 border border-mindpulse-amber/20 rounded-lg p-3 mb-6 text-left">
              <p className="text-xs text-mindpulse-amber font-medium mb-1">⚠️ Important</p>
              <p className="text-xs text-mindpulse-muted">
                You can use this Unique ID or your email to log in. Your email is never shared with counsellors — only this ID is visible.
              </p>
            </div>

            <button
              onClick={handleContinue}
              className="w-full gradient-btn text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              Continue to Dashboard →
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <p className="text-mindpulse-muted text-sm">Create your anonymous account</p>
          <p className="text-xs text-mindpulse-muted/60 mt-1">
            Already have an account?{" "}
            <Link href="/login" className="text-mindpulse-teal hover:underline">
              Sign in →
            </Link>
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 border border-white/10">
          <h2 className="text-xl font-semibold text-mindpulse-text mb-6 text-center">
            Create Account
          </h2>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Role Selector */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  role === "student"
                    ? "bg-gradient-to-r from-mindpulse-purple to-mindpulse-teal text-white"
                    : "bg-white/5 border border-white/10 text-mindpulse-muted hover:bg-white/10"
                }`}
              >
                🎓 Student
              </button>
              <button
                type="button"
                onClick={() => setRole("counsellor")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  role === "counsellor"
                    ? "bg-gradient-to-r from-mindpulse-purple to-mindpulse-teal text-white"
                    : "bg-white/5 border border-white/10 text-mindpulse-muted hover:bg-white/10"
                }`}
              >
                🩺 Counsellor
              </button>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-mindpulse-muted mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mindpulse-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
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
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
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

            {/* Course / Department */}
            <div>
              <label className="block text-sm font-medium text-mindpulse-muted mb-2">
                Course / Department
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mindpulse-muted pointer-events-none" />
                <select
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-mindpulse-text focus:outline-none focus:ring-2 focus:ring-mindpulse-purple/50 transition-all appearance-none cursor-pointer"
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

            {/* Error */}
            {error && (
              <p className="text-mindpulse-coral text-sm text-center bg-mindpulse-coral/10 py-2 px-4 rounded-lg">
                ❌ {error}
              </p>
            )}

            {/* Privacy note */}
            <div className="bg-white/5 rounded-lg p-3 text-xs text-mindpulse-muted text-center">
              🔒 Your email is only used for login. Counsellors will <strong>never</strong> see your email — only your anonymous Unique ID.
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-btn text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Create Account →"
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
