const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { asyncHandler } = require("./errorHandler");

/**
 * protect — Verifies JWT token and attaches user to request.
 * JWT payload contains ONLY { uniqueId, role } — NEVER email.
 * This is the PII firewall: downstream routes only see uniqueId.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;
  console.log("Token : ", token);

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Not authorized. Please login to access this resource.",
    });
  }

  try {
    // Verify token — payload: { uniqueId, role }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach ONLY uniqueId and role to request — NO email
    req.user = {
      uniqueId: decoded.uniqueId,
      role: decoded.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Token is invalid or expired. Please login again.",
    });
  }
});

/**
 * authorize — Role-based access control.
 * Usage: authorize("counsellor") or authorize("student", "counsellor")
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(" or ")}.`,
      });
    }
    next();
  };
};

/**
 * Generate JWT token — contains ONLY uniqueId + role (PII firewall).
 * Expires in 7 days.
 */
const generateToken = (user) => {
  return jwt.sign(
    { uniqueId: user.uniqueId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

module.exports = { protect, authorize, generateToken };
