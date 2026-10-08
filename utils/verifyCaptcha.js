// utils/verifyCaptcha.js
const RECAPTCHA_URL = "https://www.google.com/recaptcha/api/siteverify";
const MIN_SCORE     = 0.5; // 0.0 (bot) to 1.0 (human) — 0.5 is standard threshold

/**
 * Verifies a reCAPTCHA v3 token with Google.
 * @param {string} token  — token from frontend executeRecaptcha()
 * @param {string} action — expected action name (e.g. "contact_form")
 * @returns {{ success: boolean, score?: number, error?: string }}
 */
exports.verifyCaptcha = async (token, action = "") => {
  if (!token) {
    return { success: false, error: "No CAPTCHA token provided" };
  }

  try {
    const params = new URLSearchParams({
      secret:   process.env.RECAPTCHA_SECRET_KEY,
      response: token,
    });

    const res = await fetch(`${RECAPTCHA_URL}?${params}`, { method: "POST" });

    if (!res.ok) {
      return { success: false, error: "CAPTCHA service unavailable" };
    }

    const data = await res.json();

    // ── Google verification failed ──
    if (!data.success) {
      return { success: false, error: "CAPTCHA verification failed", codes: data["error-codes"] };
    }

    // ── score too low — likely a bot ──
    if (data.score < MIN_SCORE) {
      return { success: false, error: "CAPTCHA score too low", score: data.score };
    }

    // ── action mismatch (optional but recommended) ──
    if (action && data.action !== action) {
      return { success: false, error: "CAPTCHA action mismatch" };
    }

    return { success: true, score: data.score };

  } catch (error) {
    console.error("CAPTCHA verification error:", error.message);
    return { success: false, error: "CAPTCHA verification error" };
  }
};