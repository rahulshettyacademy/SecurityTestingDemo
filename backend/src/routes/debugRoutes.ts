import { Router } from "express";
import { env } from "../config/env";

const router = Router();

// SECURITY-LAB-VULNERABILITY: V06B - Security Misconfiguration (exposed debug endpoint)
// This diagnostic endpoint requires no authentication and is reachable by
// anyone. Only harmless, synthetic values are returned (never real secrets),
// but a debug endpoint like this is often left enabled by mistake in a real
// deployment and can hand an attacker useful internal architecture details.
router.get("/config", (req, res) => {
  res.json({
    environment: env.nodeEnv,
    databaseHost: env.db.host,
    applicationVersion: "1.0.0",
    jwtExpiresIn: env.jwtExpiresIn,
  });
});

export default router;
