import { Request, Response } from "express";
import { pool } from "../db/pool";

export async function listProducts(req: Request, res: Response): Promise<void> {
  const result = await pool.query(
    "SELECT id, name, description, category, price, stock, image_url FROM products ORDER BY id"
  );
  res.json(result.rows);
}

export async function searchProducts(req: Request, res: Response): Promise<void> {
  const name = (req.query.name as string) ?? "";

  // Parameterized query: user input is always treated as data, never as SQL syntax.
  const result = await pool.query(
    "SELECT id, name, description, category, price, stock, image_url FROM products WHERE name ILIKE $1 ORDER BY id",
    [`%${name}%`]
  );
  res.json(result.rows);
}

export async function getProductById(req: Request, res: Response): Promise<void> {
  const productId = parseInt(req.params.id, 10);
  if (Number.isNaN(productId)) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }

  const result = await pool.query(
    "SELECT id, name, description, category, price, stock, image_url FROM products WHERE id = $1",
    [productId]
  );

  if (result.rowCount === 0) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(result.rows[0]);
}
