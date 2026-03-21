const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ── Generate Unique ID in format: MP-XXXX-X ───────────────────────
function generateUniqueId() {
  const digits = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
  return `MP-${digits}-${letter}`;
}

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false, // Never return password in queries by default
  },
  uniqueId: {
    type: String,
    unique: true,
    index: true,
  },
  course: {
    type: String,
    required: [true, "Course is required"],
    trim: true,
  },
  role: {
    type: String,
    enum: ["student", "counsellor"],
    default: "student",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ── Pre-save: Auto-generate uniqueId + Hash password ──────────────
UserSchema.pre("save", async function (next) {
  // Auto-generate uniqueId on first save
  if (!this.uniqueId) {
    let id = generateUniqueId();
    // Ensure uniqueness — retry if collision (extremely rare)
    let exists = await mongoose.model("User").findOne({ uniqueId: id });
    while (exists) {
      id = generateUniqueId();
      exists = await mongoose.model("User").findOne({ uniqueId: id });
    }
    this.uniqueId = id;
  }

  // Hash password only if modified
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance method: Compare password ─────────────────────────────
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Ensure email is NEVER included in JSON responses ──────────────
UserSchema.methods.toSafeJSON = function () {
  return {
    uniqueId: this.uniqueId,
    course: this.course,
    role: this.role,
    createdAt: this.createdAt,
  };
};

// ── Indexes ───────────────────────────────────────────────────────
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ uniqueId: 1 }, { unique: true });

module.exports = mongoose.model("User", UserSchema);
