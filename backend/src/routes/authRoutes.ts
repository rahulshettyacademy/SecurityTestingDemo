import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, logout, register } from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// Fixes V04A (No Login Rate Limiting): bounds how many login attempts a
// single IP can make in a short window. 5/minute is deliberately tight so
// the lab's own regression test (and a live demo) can trip it quickly;
// a real deployment would tune this to its own traffic patterns.
const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});

router.post("/register", asyncHandler(register));
router.post("/login", loginRateLimiter, asyncHandler(login));
router.post("/logout", authenticate, asyncHandler(logout));

export default router;
