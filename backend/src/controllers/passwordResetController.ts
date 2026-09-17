import crypto from "crypto";
import { Request, Response } from "express";
import { pool } from "../db/pool";
import { env } from "../config/env";

const TOKEN_TTL_MINUTES = 30;

// Training app has no real email provider: the reset link is printed to the
// backend console (and echoed in the response during local development only)
// so students can complete the flow without external services.
export async function requestPasswordReset(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email?: string };
  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }

  const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  const genericResponse = { message: "If that email exists, a password reset link has been generated." };

  if (userResult.rowCount === 0) {
    res.json(genericResponse);
    return;
  }

  const user = userResult.rows[0];
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  await pool.query(
    "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
    [user.id, token, expiresAt]
  );

  console.log(`[password-reset] Reset link for ${email}: http://localhost:3000/reset-password?token=${token}`);

  if (env.nodeEnv === "development") {
    res.json({ ...genericResponse, devToken: token });
    return;
  }

  res.json(genericResponse);
}

export async function confirmPasswordReset(req: Request, res: Response): Promise<void> {
  const { token, newPassword } = req.body as { token?: string; newPassword?: string };
  if (!token || !newPassword) {
    res.status(400).json({ error: "token and newPassword are required" });
    return;
  }

  const tokenResult = await pool.query(
    "SELECT id, user_id, expires_at, used FROM password_reset_tokens WHERE token = $1",
    [token]
  );

  if (tokenResult.rowCount === 0) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }

  const resetToken = tokenResult.rows[0];
  if (resetToken.used || new Date(resetToken.expires_at) < new Date()) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }

  // SECURITY-LAB-VULNERABILITY: V05 - Cryptographic Failure (plaintext password storage)
  // The new password is written to the database exactly as submitted, with
  // no hashing, matching the same flaw in authController.register/login.
  await pool.query("UPDATE users SET password = $1 WHERE id = $2", [newPassword, resetToken.user_id]);
  await pool.query("UPDATE password_reset_tokens SET used = TRUE WHERE id = $1", [resetToken.id]);

  res.json({ message: "Password has been reset successfully" });
}
