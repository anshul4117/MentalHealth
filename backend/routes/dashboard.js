const express = require("express");
const router = express.Router();
const Checkin = require("../models/Checkin");
const Alert = require("../models/Alert");
const Message = require("../models/Message");
const { asyncHandler } = require("../middleware/errorHandler");
const { protect, authorize } = require("../middleware/auth");

// ══════════════════════════════════════════════════════════════════
// COUNSELLOR ROUTES (JWT + counsellor role required)
// PII FIREWALL: No email or personal data is EVER returned.
// All student references use ONLY uniqueId (tokenId field).
// ══════════════════════════════════════════════════════════════════

// ── GET /api/dashboard — Full counsellor dashboard data ───────────
router.get("/", protect, authorize("counsellor"), asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Run all queries in PARALLEL ────────────────────────────────
  const [
    totalCheckins,
    atRiskCount,
    interventions,
    todayCheckins,
    recentCheckins,
    alerts,
    moodTrend,
  ] = await Promise.all([
    Checkin.countDocuments({ createdAt: { $gte: today } }),
    Alert.countDocuments({ resolved: false }),
    Alert.countDocuments({ resolved: true }),
    Checkin.find({ createdAt: { $gte: today } })
      .select("mood")
      .lean(),
    // Only return anonymized fields — tokenId (uniqueId), dept, mood, stress, sleep
    Checkin.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("tokenId department mood stress sleep createdAt -_id")
      .lean(),
    Alert.find({ resolved: false })
      .sort({ severity: -1, createdAt: -1 })
      .limit(10)
      .select("tokenId department severity reason avgMood createdAt -_id")
      .lean(),
    Checkin.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          avgMood: { $avg: "$mood" },
          avgStress: { $avg: "$stress" },
          avgSleep: { $avg: "$sleep" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const avgMood = todayCheckins.length > 0
    ? (todayCheckins.reduce((sum, c) => sum + c.mood, 0) / todayCheckins.length).toFixed(1)
    : 0;

  // Format mood trend
  const formattedMoodTrend = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split("T")[0];
    const dayData = moodTrend.find((d) => d._id === dateKey);

    formattedMoodTrend.push({
      date: date.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      mood: dayData ? parseFloat(dayData.avgMood.toFixed(2)) : null,
      stress: dayData ? parseFloat(dayData.avgStress.toFixed(2)) : null,
      sleep: dayData ? parseFloat(dayData.avgSleep.toFixed(2)) : null,
      checkins: dayData ? dayData.count : 0,
      threshold: 2.5,
    });
  }

  res.json({
    success: true,
    stats: {
      totalCheckins,
      atRiskCount,
      avgMood: parseFloat(avgMood),
      interventions,
    },
    recentCheckins,
    alerts,
    moodTrend: formattedMoodTrend,
  });
}));

// ── POST /api/dashboard/resolve/:alertId — Resolve an alert ──────
router.post("/resolve/:alertId", protect, authorize("counsellor"), asyncHandler(async (req, res) => {
  const alert = await Alert.findById(req.params.alertId);

  if (!alert) {
    return res.status(404).json({
      success: false,
      error: "Alert not found.",
    });
  }

  alert.resolved = true;
  await alert.save();

  res.json({
    success: true,
    message: "Alert resolved successfully.",
  });
}));

// ── POST /api/dashboard/message — Send anonymous message to student
// Counsellor addresses student by uniqueId ONLY — no email access
router.post("/message", protect, authorize("counsellor"), asyncHandler(async (req, res) => {
  const { tokenId, message, urgent } = req.body;

  if (!tokenId || !message) {
    return res.status(400).json({
      success: false,
      error: "tokenId (student uniqueId) and message are required.",
    });
  }

  if (message.length > 1000) {
    return res.status(400).json({
      success: false,
      error: "Message must be under 1000 characters.",
    });
  }

  // Sanitize message
  const sanitizedMessage = message
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .trim();

  const newMessage = await Message.create({
    tokenId,
    content: sanitizedMessage,
    fromCounsellor: true,
  });

  if (urgent) {
    const alert = await Alert.findOne({ tokenId, resolved: false });
    if (alert) {
      alert.message = sanitizedMessage;
      alert.severity = "high";
      await alert.save();
    }
  }

  res.json({
    success: true,
    message: "Anonymous message sent to student.",
    data: {
      tokenId: newMessage.tokenId,
      content: newMessage.content,
      createdAt: newMessage.createdAt,
    },
  });
}));

// ── GET /api/dashboard/analytics — Department-level analytics ─────
router.get("/analytics", protect, authorize("counsellor"), asyncHandler(async (req, res) => {
  const [moodByDept, totalCheckins, totalResolved] = await Promise.all([
    Checkin.aggregate([
      {
        $group: {
          _id: "$department",
          avgMood: { $avg: "$mood" },
          avgStress: { $avg: "$stress" },
          avgSleep: { $avg: "$sleep" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Checkin.countDocuments(),
    Alert.countDocuments({ resolved: true }),
  ]);

  const formattedDepts = moodByDept.map((d) => ({
    department: d._id || "General",
    avgMood: parseFloat(d.avgMood.toFixed(2)),
    avgStress: parseFloat(d.avgStress.toFixed(2)),
    avgSleep: parseFloat(d.avgSleep.toFixed(2)),
    checkins: d.count,
  }));

  res.json({
    success: true,
    moodByDept: formattedDepts,
    totalCheckins,
    totalResolved,
  });
}));

module.exports = router;
