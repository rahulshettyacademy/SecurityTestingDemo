import { Router } from "express";
import { login, logout, register } from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/logout", authenticate, asyncHandler(logout));

export default router;
