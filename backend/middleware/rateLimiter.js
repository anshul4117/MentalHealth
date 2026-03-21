const rateLimit = require("express-rate-limit");

// General API rate limiter — 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests. Please try again after 15 minutes.",
  },
});

// Strict limiter for check-in POST — prevent spam submissions
const checkinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many check-ins. Please try again later.",
  },
});

module.exports = { generalLimiter, checkinLimiter };
