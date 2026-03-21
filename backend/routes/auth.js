const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { asyncHandler } = require("../middleware/errorHandler");
const { protect, generateToken } = require("../middleware/auth");
const { checkinLimiter } = require("../middleware/rateLimiter");

// ══════════════════════════════════════════════════════════════════
// AUTH ROUTES — Identity Layer (PII stays here, never leaks out)
// ══════════════════════════════════════════════════════════════════

// ── POST /api/auth/register ───────────────────────────────────────
// Input:  { email, password, course }
// Output: { uniqueId, course, role, token } — NO email in response
router.post("/register", checkinLimiter, asyncHandler(async (req, res) => {
  const { email, password, course, role } = req.body;

  // ── Validate required fields ──
  if (!email || !password || !course) {
    return res.status(400).json({
      success: false,
      error: "Please provide email, password, and course.",
    });
  }

  // ── Validate email format ──
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({
      success: false,
      error: "Please provide a valid email address.",
    });
  }

  // ── Validate password length ──
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: "Password must be at least 6 characters.",
    });
  }

  // ── Check if email already registered ──
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: "An account with this email already exists.",
    });
  }

  // ── Validate role (only allow student or counsellor) ──
  const validRole = ["student", "counsellor"].includes(role) ? role : "student";

  // ── Create user (uniqueId auto-generated, password auto-hashed) ──
  const user = await User.create({
    email: email.toLowerCase().trim(),
    password,
    course: course.trim(),
    role: validRole,
  });

  // ── Generate JWT (contains uniqueId + role ONLY — no email) ──
  const token = generateToken(user);

  // ── Response: NEVER return email ──
  res.status(201).json({
    success: true,
    message: "Registration successful. Save your Unique ID — it's your anonymous identity.",
    uniqueId: user.uniqueId,
    user: user.toSafeJSON(),
    token,
  });
}));

// ── POST /api/auth/login ──────────────────────────────────────────
// Input:  { identifier (email OR uniqueId), password }
// Output: { uniqueId, course, role, token } — NO email in response
router.post("/login", checkinLimiter, asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      error: "Please provide your email or Unique ID, and password.",
    });
  }

  // ── Determine if identifier is email or uniqueId ──
  const isEmail = /^\S+@\S+\.\S+$/.test(identifier);
  const query = isEmail
    ? { email: identifier.toLowerCase().trim() }
    : { uniqueId: identifier.trim() };

  // ── Find user (include password for comparison) ──
  const user = await User.findOne(query).select("+password");

  if (!user) {
    return res.status(401).json({
      success: false,
      error: "Invalid credentials. Please check your email/ID and password.",
    });
  }

  // ── Compare password ──
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: "Invalid credentials. Please check your email/ID and password.",
    });
  }

  // ── Generate JWT (uniqueId + role ONLY) ──
  const token = generateToken(user);

  // ── Response: NEVER return email ──
  res.json({
    success: true,
    message: "Login successful.",
    uniqueId: user.uniqueId,
    user: user.toSafeJSON(),
    token,
  });
}));

// ── GET /api/auth/me — Get current user profile ───────────────────
// Returns: { uniqueId, course, role } — NEVER email
router.get("/me", protect, asyncHandler(async (req, res) => {
  const user = await User.findOne({ uniqueId: req.user.uniqueId });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: "User not found.",
    });
  }

  res.json({
    success: true,
    user: user.toSafeJSON(),
  });
}));

module.exports = router;
