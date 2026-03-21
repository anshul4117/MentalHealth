// ── MindPulse API Utility ──────────────────────────────────────────
// Central helper for all backend API calls.
// Backend: https://mindpulse-backend-5190.onrender.com

const BASE_URL = "https://mindpulse-backend-5190.onrender.com";

// ── Token Management ──────────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mindpulse_token");
}

export function setToken(token: string) {
  localStorage.setItem("mindpulse_token", token);
}

export function clearToken() {
  localStorage.removeItem("mindpulse_token");
}

// ── Generic Fetch Wrapper ─────────────────────────────────────────
async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data as T;
}

// ══════════════════════════════════════════════════════════════════
// AUTH ENDPOINTS
// ══════════════════════════════════════════════════════════════════

export interface AuthUser {
  uniqueId: string;
  course: string;
  role: "student" | "counsellor";
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  uniqueId: string;
  user: AuthUser;
  token: string;
}

export interface MeResponse {
  success: boolean;
  user: AuthUser;
}

export function register(data: {
  email: string;
  password: string;
  course: string;
  role?: string;
}) {
  return apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function login(data: { identifier: string; password: string }) {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getMe() {
  return apiFetch<MeResponse>("/api/auth/me");
}

// ══════════════════════════════════════════════════════════════════
// STUDENT CHECK-IN ENDPOINTS
// ══════════════════════════════════════════════════════════════════

export interface CheckinPayload {
  mood: number;
  sleep: number;
  stress: number;
  note?: string;
  department: string;
  year?: number;
}

export interface CheckinEntry {
  tokenId: string;
  mood: number;
  sleep: number;
  stress: number;
  note?: string;
  department: string;
  createdAt: string;
}

export interface HistoryResponse {
  success: boolean;
  filter: string;
  summary: {
    totalCheckins: number;
    avgMood: number;
    avgStress: number;
    avgSleep: number;
    lastCheckin: string;
    period: string;
  } | null;
  checkins: CheckinEntry[];
}

export interface MessageEntry {
  tokenId: string;
  content: string;
  fromCounsellor: boolean;
  read: boolean;
  createdAt: string;
}

export interface MessagesResponse {
  success: boolean;
  unreadCount: number;
  messages: MessageEntry[];
}

export function submitCheckin(data: CheckinPayload) {
  return apiFetch<{ success: boolean; message: string; checkin: CheckinEntry }>(
    "/api/checkin",
    { method: "POST", body: JSON.stringify(data) }
  );
}

export function getHistory(params?: {
  filter?: string;
  month?: number;
  year?: number;
  from?: string;
  to?: string;
}) {
  const query = new URLSearchParams();
  if (params?.filter) query.set("filter", params.filter);
  if (params?.month) query.set("month", String(params.month));
  if (params?.year) query.set("year", String(params.year));
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  const qs = query.toString();
  return apiFetch<HistoryResponse>(`/api/checkin/history${qs ? `?${qs}` : ""}`);
}

export function getMessages() {
  return apiFetch<MessagesResponse>("/api/checkin/messages");
}

export function deleteMyData() {
  return apiFetch<{
    success: boolean;
    message: string;
    deleted: { checkins: number; alerts: number; messages: number };
  }>("/api/checkin/data", { method: "DELETE" });
}

// ══════════════════════════════════════════════════════════════════
// COUNSELLOR DASHBOARD ENDPOINTS
// ══════════════════════════════════════════════════════════════════

export interface DashboardAlert {
  tokenId: string;
  department: string;
  severity: string;
  reason: string;
  avgMood: number;
  createdAt: string;
  _id?: string;
}

export interface MoodTrendEntry {
  date: string;
  mood: number | null;
  stress: number | null;
  sleep: number | null;
  checkins: number;
  threshold: number;
}

export interface RecentCheckin {
  tokenId: string;
  department: string;
  mood: number;
  stress: number;
  sleep: number;
  createdAt: string;
}

export interface DashboardResponse {
  success: boolean;
  stats: {
    totalCheckins: number;
    atRiskCount: number;
    avgMood: number;
    interventions: number;
  };
  recentCheckins: RecentCheckin[];
  alerts: DashboardAlert[];
  moodTrend: MoodTrendEntry[];
}

export interface AnalyticsResponse {
  success: boolean;
  moodByDept: {
    department: string;
    avgMood: number;
    avgStress: number;
    avgSleep: number;
    checkins: number;
  }[];
  totalCheckins: number;
  totalResolved: number;
}

export function getDashboard() {
  return apiFetch<DashboardResponse>("/api/dashboard");
}

export function getAnalytics() {
  return apiFetch<AnalyticsResponse>("/api/dashboard/analytics");
}

export function resolveAlert(alertId: string) {
  return apiFetch<{ success: boolean; message: string }>(
    `/api/dashboard/resolve/${alertId}`,
    { method: "POST" }
  );
}

export function sendMessage(data: {
  tokenId: string;
  message: string;
  urgent?: boolean;
}) {
  return apiFetch<{ success: boolean; message: string }>(
    "/api/dashboard/message",
    { method: "POST", body: JSON.stringify(data) }
  );
}
