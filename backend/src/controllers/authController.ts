import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { pool } from "../db/pool";
import { signToken } from "../utils/jwt";

const BCRYPT_ROUNDS = 10;

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body as { name?: string; email?: string; password?: string };

  if (!name || !email || !password) {
    res.status(400).json({ error: "name, email and password are required" });
    return;
  }

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rowCount && existing.rowCount > 0) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const result = await pool.query(
    "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'CUSTOMER') RETURNING id, name, email, role",
    [name, email, passwordHash]
  );

  const user = result.rows[0];
  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.status(201).json({ token, user });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const result = await pool.query("SELECT id, name, email, password, role FROM users WHERE email = $1", [email]);
  const user = result.rows[0];

  const genericError = () => res.status(401).json({ error: "Invalid email or password" });

  if (!user) {
    genericError();
    return;
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    genericError();
    return;
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = req.token;
  if (!token || !req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  // Recording the token as revoked is what makes it stop working after logout.
  await pool.query(
    "INSERT INTO revoked_tokens (token, user_id, revoked_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING",
    [token, req.user.userId]
  );
  res.json({ message: "Logged out successfully" });
}
