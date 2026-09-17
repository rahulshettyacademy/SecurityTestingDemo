import { Request, Response } from "express";
import { pool } from "../db/pool";

export async function listUsers(req: Request, res: Response): Promise<void> {
  const result = await pool.query("SELECT id, name, email, role FROM users ORDER BY id");
  res.json(result.rows);
}
