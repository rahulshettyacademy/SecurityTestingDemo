import { Router } from "express";
import { createOrder, getOrderById, listOrders } from "../controllers/orderController";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(authenticate);
router.get("/", asyncHandler(listOrders));
router.get("/:orderId", asyncHandler(getOrderById));
router.post("/", asyncHandler(createOrder));

export default router;
