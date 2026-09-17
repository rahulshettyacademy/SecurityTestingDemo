import { Router } from "express";
import { listUsers } from "../controllers/adminController";
import { authenticate, requireAdmin } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(authenticate, requireAdmin);
router.get("/users", asyncHandler(listUsers));

export default router;
