import { Request, Response } from "express";
import { pool } from "../db/pool";

export async function getProfile(req: Request, res: Response): Promise<void> {
  const result = await pool.query("SELECT id, name, email, role FROM users WHERE id = $1", [req.user!.userId]);
  if (result.rowCount === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(result.rows[0]);
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const { name } = req.body as { name?: string };
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const result = await pool.query(
    "UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, email, role",
    [name, req.user!.userId]
  );
  res.json(result.rows[0]);
}
