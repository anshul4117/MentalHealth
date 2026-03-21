const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
require("dotenv").config();

const connectDB = require("./config/db");
const { generalLimiter } = require("./middleware/rateLimiter");
const { globalErrorHandler } = require("./middleware/errorHandler");

const app = express();

// ── Security Middleware ───────────────────────────────────────────
app.use(helmet());                          // Security headers (XSS, clickjack, HSTS)
app.use(mongoSanitize());                   // Prevent NoSQL injection ($gt, $ne attacks)
app.use(generalLimiter);                    // Rate limiting: 100 req / 15 min

// ── Parsing Middleware ────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));   // Body parser with size limit
app.use(express.urlencoded({ extended: true }));

// ── CORS ──────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://mind-pulse-iota.vercel.app",
    "https://mindpulse-lovat.vercel.app",
  ],
  credentials: true,
}));

// ── Request Logging ───────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));                   // Colored dev logs
} else {
  app.use(morgan("combined"));              // Apache-style production logs
}

// ── Routes ────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/checkin", require("./routes/checkin"));
app.use("/api/dashboard", require("./routes/dashboard"));

// ── Health Check ──────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "MindPulse API is running 🧠",
    version: "2.1.0",
    uptime: `${Math.floor(process.uptime())}s`,
    privacy: "All interactions use anonymous Unique IDs — no PII exposed.",
    roles: ["Student", "Counsellor"],
    endpoints: {
      auth: [
        "POST /api/auth/register   → Register (email, password, course)",
        "POST /api/auth/login      → Login (email or uniqueId + password)",
        "GET  /api/auth/me         → Get profile (no email returned)",
      ],
      student: [
        "POST   /api/checkin         → Submit check-in (JWT required)",
        "GET    /api/checkin/history  → Survey history + time filtering",
        "GET    /api/checkin/messages → Counsellor messages",
        "DELETE /api/checkin/data     → Delete all my data",
      ],
      counsellor: [
        "GET    /api/dashboard             → Dashboard stats + alerts",
        "POST   /api/dashboard/message      → Send message to student",
        "POST   /api/dashboard/resolve/:id  → Resolve alert",
        "GET    /api/dashboard/analytics    → Dept analytics",
      ],
    },
  });
});

// ── 404 Handler ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
  });
});

// ── Global Error Handler (must be LAST) ───────────────────────────
app.use(globalErrorHandler);

// ── Connect DB + Start Server ─────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`🚀 MindPulse server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
  });

  // ── Graceful Shutdown ─────────────────────────────────────────
  const shutdown = (signal) => {
    console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log("✅ Server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // ── Unhandled Errors ──────────────────────────────────────────
  process.on("unhandledRejection", (err) => {
    console.error("❌ Unhandled Rejection:", err.message);
    server.close(() => process.exit(1));
  });
});
