import { Router } from "express";
import { confirmPasswordReset, requestPasswordReset } from "../controllers/passwordResetController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post("/request", asyncHandler(requestPasswordReset));
router.post("/confirm", asyncHandler(confirmPasswordReset));

export default router;
