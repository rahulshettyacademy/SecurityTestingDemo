import { Router } from "express";
import { listUsers } from "../controllers/adminController";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// SECURITY-LAB-VULNERABILITY: V01 - Broken Access Control (vertical privilege escalation)
// Only authenticate() runs here; the requireAdmin role check has been removed.
// Any authenticated user - CUSTOMER or ADMIN - can call GET /api/admin/users.
router.use(authenticate);
router.get("/users", asyncHandler(listUsers));

export default router;
