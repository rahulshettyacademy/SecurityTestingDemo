import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  console.error("Unhandled error:", err);

  // SECURITY-LAB-VULNERABILITY: V06A/V06C - Security Misconfiguration (verbose
  // error details left on outside production). Whenever NODE_ENV is not
  // exactly "production" - which is how this lab runs by default - the raw
  // error (stack trace, error name, database driver error code) is sent
  // straight to the client instead of a generic message.
  if (env.nodeEnv !== "production") {
    const error = err as { message?: string; stack?: string; name?: string; code?: string };
    res.status(500).json({
      error: error.message ?? "Internal server error",
      name: error.name,
      code: error.code,
      stack: error.stack,
      hint: "Verbose error output - NODE_ENV is not set to production",
    });
    return;
  }

  res.status(500).json({ error: "Something went wrong. Please try again later." });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: "Resource not found" });
}
