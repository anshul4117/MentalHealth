const express = require("express");
const router = express.Router();
const Checkin = require("../models/Checkin");
const Alert = require("../models/Alert");
const Message = require("../models/Message");
const { asyncHandler } = require("../middleware/errorHandler");
const { validateCheckin } = require("../middleware/validate");
const { checkinLimiter } = require("../middleware/rateLimiter");
const { protect } = require("../middleware/auth");

// ── Risk Detection Logic ──────────────────────────────────────────
async function detectAndSaveRisk(uniqueId, department) {
  const recent = await Checkin.find({ tokenId: uniqueId })
    .sort({ createdAt: -1 })
    .limit(7)
    .lean();

  if (recent.length < 3) return;

  const avgMood = recent.reduce((sum, c) => sum + c.mood, 0) / recent.length;
  const avgStress = recent.reduce((sum, c) => sum + c.stress, 0) / recent.length;
  const avgSleep = recent.reduce((sum, c) => sum + c.sleep, 0) / recent.length;

  let consecutiveLow = 0;
  for (const c of recent) {
    if (c.mood <= 2) consecutiveLow++;
    else break;
  }

  let severity = null;
  let reason = "";

  if (avgMood < 2 || consecutiveLow >= 3) {
    severity = "high";
    reason = `Critical: Avg mood ${avgMood.toFixed(1)}, ${consecutiveLow} consecutive low days`;
  } else if (avgMood < 2.8 || (avgStress > 8 && avgSleep < 4)) {
    severity = "medium";
    reason = `Warning: Declining mood trend (avg ${avgMood.toFixed(1)}) over ${recent.length} days`;
  } else if (avgMood < 3.2) {
    severity = "low";
    reason = "Below average mood this week";
  }

  if (severity && severity !== "low") {
    const existing = await Alert.findOne({ tokenId: uniqueId, resolved: false });
    if (!existing) {
      await Alert.create({ tokenId: uniqueId, department, severity, reason, avgMood });
    } else {
      existing.severity = severity;
      existing.reason = reason;
      existing.avgMood = avgMood;
      await existing.save();
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// STUDENT ROUTES (JWT Protected — uses req.user.uniqueId)
// ══════════════════════════════════════════════════════════════════

// ── POST /api/checkin — Submit a mood check-in ────────────────────
// Uses JWT uniqueId — student can only submit for themselves
router.post("/", protect, checkinLimiter, validateCheckin, asyncHandler(async (req, res) => {
  const uniqueId = req.user.uniqueId; // From JWT — not from body
  const { mood, sleep, stress, note, department, year } = req.validatedBody;

  const checkin = await Checkin.create({
    tokenId: uniqueId,
    mood,
    sleep,
    stress,
    note,
    department,
    year,
  });

  // Run risk detection in background (fire-and-forget)
  detectAndSaveRisk(uniqueId, department).catch((err) => {
    console.error("Risk detection error:", err.message);
  });

  res.status(201).json({
    success: true,
    message: "Check-in recorded successfully",
    checkin: {
      uniqueId: checkin.tokenId,
      mood: checkin.mood,
      sleep: checkin.sleep,
      stress: checkin.stress,
      note: checkin.note,
      department: checkin.department,
      createdAt: checkin.createdAt,
    },
  });
}));

// ── GET /api/checkin/history — Get mood history with time filtering
// Query params:
//   ?filter=monthly&month=3&year=2026   → specific month
//   ?filter=yearly&year=2026            → full year
//   ?filter=custom&from=2026-01-01&to=2026-03-21 → custom range
//   No filter = last 30 check-ins
router.get("/history", protect, asyncHandler(async (req, res) => {
  const uniqueId = req.user.uniqueId;
  const { filter, month, year, from, to } = req.query;

  // Build date filter
  let dateFilter = {};

  if (filter === "monthly" && month && year) {
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 1);
    dateFilter = { createdAt: { $gte: startDate, $lt: endDate } };
  } else if (filter === "yearly" && year) {
    const startDate = new Date(Number(year), 0, 1);
    const endDate = new Date(Number(year) + 1, 0, 1);
    dateFilter = { createdAt: { $gte: startDate, $lt: endDate } };
  } else if (filter === "custom" && from && to) {
    const startDate = new Date(from);
    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999); // Include full end day

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: "Invalid date format. Use YYYY-MM-DD.",
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        error: "'from' date must be before 'to' date.",
      });
    }

    dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };
  }

  // Build query
  const query = { tokenId: uniqueId, ...dateFilter };

  const checkins = await Checkin.find(query)
    .sort({ createdAt: -1 })
    .limit(filter ? 500 : 30) // More results for filtered queries
    .select("-_id -__v") // Exclude internal fields
    .lean();

  // Calculate summary stats
  const summary = checkins.length > 0 ? {
    totalCheckins: checkins.length,
    avgMood: parseFloat((checkins.reduce((s, c) => s + c.mood, 0) / checkins.length).toFixed(1)),
    avgStress: parseFloat((checkins.reduce((s, c) => s + c.stress, 0) / checkins.length).toFixed(1)),
    avgSleep: parseFloat((checkins.reduce((s, c) => s + c.sleep, 0) / checkins.length).toFixed(1)),
    lastCheckin: checkins[0].createdAt,
    period: filter || "recent",
  } : null;

  res.json({
    success: true,
    filter: filter || "recent",
    summary,
    checkins,
  });
}));

// ── GET /api/checkin/messages — Get counsellor messages ────────────
// Uses JWT uniqueId — student can only see their own messages
router.get("/messages", protect, asyncHandler(async (req, res) => {
  const uniqueId = req.user.uniqueId;

  const messages = await Message.find({ tokenId: uniqueId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const unreadCount = messages.filter((m) => !m.read).length;

  // Mark unread messages as read
  await Message.updateMany(
    { tokenId: uniqueId, read: false },
    { $set: { read: true } }
  );

  res.json({
    success: true,
    unreadCount,
    messages,
  });
}));

// ── DELETE /api/checkin/data — Delete all student data ─────────────
// Uses JWT uniqueId — student can only delete their own data
router.delete("/data", protect, asyncHandler(async (req, res) => {
  const uniqueId = req.user.uniqueId;

  // Delete all data for this user — check-ins, alerts, messages
  const [checkinResult, alertResult, messageResult] = await Promise.all([
    Checkin.deleteMany({ tokenId: uniqueId }),
    Alert.deleteMany({ tokenId: uniqueId }),
    Message.deleteMany({ tokenId: uniqueId }),
  ]);

  res.json({
    success: true,
    message: "All your data has been permanently deleted.",
    deleted: {
      checkins: checkinResult.deletedCount,
      alerts: alertResult.deletedCount,
      messages: messageResult.deletedCount,
    },
  });
}));

module.exports = router;