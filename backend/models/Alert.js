const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema({
  tokenId: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    default: "General",
  },
  severity: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "low",
  },
  reason: {
    type: String,
    default: "",
  },
  avgMood: {
    type: Number,
  },
  resolved: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ── Indexes for fast queries ──────────────────────────────────────
AlertSchema.index({ tokenId: 1, resolved: 1 });            // Alert lookup by student
AlertSchema.index({ resolved: 1, severity: -1, createdAt: -1 }); // Dashboard alerts

module.exports = mongoose.model("Alert", AlertSchema);
