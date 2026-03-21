/**
 * Async handler wrapper — eliminates try/catch boilerplate in routes.
 * Usage: router.get("/", asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global error handler — catches all unhandled errors.
 * Must be registered as the LAST middleware in Express.
 */
const globalErrorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";

  console.error(`❌ [${req.method}] ${req.originalUrl} →`, err.message);

  res.status(statusCode).json({
    success: false,
    error: isProduction && statusCode === 500
      ? "Internal server error"
      : err.message,
    ...(! isProduction && { stack: err.stack }),
  });
};

module.exports = { asyncHandler, globalErrorHandler };
