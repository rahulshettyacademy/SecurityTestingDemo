import { NextFunction, Request, Response } from "express";
import { pool } from "../db/pool";
import { TokenPayload, verifyToken } from "../utils/jwt";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
      token?: string;
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }
  return header.substring("Bearer ".length);
}

/**
 * Verifies the JWT and rejects tokens that were explicitly revoked at logout.
 * Training note: this revocation check is what makes "logout" actually work.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const payload = verifyToken(token);
    const revoked = await pool.query("SELECT 1 FROM revoked_tokens WHERE token = $1", [token]);
    if (revoked.rowCount && revoked.rowCount > 0) {
      res.status(401).json({ error: "Session has been logged out" });
      return;
    }
    req.user = payload;
    req.token = token;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== "ADMIN") {
    res.status(403).json({ error: "Administrator access required" });
    return;
  }
  next();
}
