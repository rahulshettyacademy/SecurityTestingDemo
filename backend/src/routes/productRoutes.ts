import { Router } from "express";
import { getProductById, listProducts, searchProducts } from "../controllers/productController";
import { createReview, listReviewsForProduct } from "../controllers/reviewController";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// Specific routes must be registered before the /:id catch-all.
router.get("/search", asyncHandler(searchProducts));
router.get("/", asyncHandler(listProducts));
router.get("/:id", asyncHandler(getProductById));
router.get("/:id/reviews", asyncHandler(listReviewsForProduct));
router.post("/:id/reviews", authenticate, asyncHandler(createReview));

export default router;
