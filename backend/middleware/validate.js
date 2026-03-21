/**
 * Input validation middleware for MindPulse check-ins.
 * Works with JWT-authenticated requests — tokenId comes from JWT, not body.
 */

const validateCheckin = (req, res, next) => {
  const { mood, sleep, stress, note, department, year } = req.body || {};

  // ── Required fields (tokenId comes from JWT via req.user.uniqueId) ──
  if (mood === undefined || sleep === undefined || stress === undefined) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: mood, sleep, and stress are required.",
      received: {
        mood: mood !== undefined ? mood : null,
        sleep: sleep !== undefined ? sleep : null,
        stress: stress !== undefined ? stress : null,
      },
    });
  }

  // ── Numeric validation ──
  const moodNum = Number(mood);
  const sleepNum = Number(sleep);
  const stressNum = Number(stress);

  if (isNaN(moodNum) || isNaN(sleepNum) || isNaN(stressNum)) {
    return res.status(400).json({
      success: false,
      error: "mood, sleep, and stress must be valid numbers.",
    });
  }

  if (moodNum < 1 || moodNum > 5) {
    return res.status(400).json({
      success: false,
      error: "mood must be between 1 and 5.",
    });
  }

  if (sleepNum < 0 || sleepNum > 12) {
    return res.status(400).json({
      success: false,
      error: "sleep must be between 0 and 12 hours.",
    });
  }

  if (stressNum < 0 || stressNum > 10) {
    return res.status(400).json({
      success: false,
      error: "stress must be between 0 and 10.",
    });
  }

  // ── Note sanitization — strip HTML, limit length ──
  let sanitizedNote = "";
  if (note) {
    sanitizedNote = String(note)
      .replace(/<[^>]*>/g, "")       // Strip HTML tags
      .replace(/[<>]/g, "")          // Remove stray angle brackets
      .trim()
      .substring(0, 500);            // Max 500 chars
  }

  // ── Department validation ──
  const allowedDepartments = [
    "Computer Science", "Engineering", "Medicine",
    "Law", "Psychology", "Business", "General",
  ];
  const dept = allowedDepartments.includes(department) ? department : "General";

  // ── Year validation ──
  const yearNum = Number(year) || 1;
  const validYear = yearNum >= 1 && yearNum <= 6 ? yearNum : 1;

  // ── Attach sanitized data (tokenId NOT here — comes from JWT) ──
  req.validatedBody = {
    mood: moodNum,
    sleep: sleepNum,
    stress: stressNum,
    note: sanitizedNote,
    department: dept,
    year: validYear,
  };

  next();
};

module.exports = { validateCheckin };
