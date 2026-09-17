import { Router } from "express";
import { login, logout, register } from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post("/register", asyncHandler(register));

// SECURITY-LAB-VULNERABILITY: V04A - No login rate limiting
// This route has no throttling/lockout middleware in front of it, so a
// script can submit unlimited login attempts per second against any email.
router.post("/login", asyncHandler(login));

router.post("/logout", authenticate, asyncHandler(logout));

export default router;
