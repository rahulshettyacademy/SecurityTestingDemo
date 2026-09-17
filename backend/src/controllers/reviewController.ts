import { Request, Response } from "express";
import { pool } from "../db/pool";

export async function listReviewsForProduct(req: Request, res: Response): Promise<void> {
  const productId = parseInt(req.params.id, 10);
  if (Number.isNaN(productId)) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }

  const result = await pool.query(
    `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS author
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.product_id = $1
     ORDER BY r.created_at DESC`,
    [productId]
  );
  res.json(result.rows);
}

export async function createReview(req: Request, res: Response): Promise<void> {
  const productId = parseInt(req.params.id, 10);
  const { rating, comment } = req.body as { rating?: number; comment?: string };

  if (Number.isNaN(productId) || !rating || !comment) {
    res.status(400).json({ error: "rating and comment are required" });
    return;
  }

  if (rating < 1 || rating > 5) {
    res.status(400).json({ error: "rating must be between 1 and 5" });
    return;
  }

  const productExists = await pool.query("SELECT id FROM products WHERE id = $1", [productId]);
  if (productExists.rowCount === 0) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const result = await pool.query(
    `INSERT INTO reviews (product_id, user_id, rating, comment, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id, rating, comment, created_at`,
    [productId, req.user!.userId, rating, comment]
  );

  res.status(201).json(result.rows[0]);
}
