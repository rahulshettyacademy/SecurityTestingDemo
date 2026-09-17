import { NextFunction, Request, Response } from "express";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong. Please try again later." });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: "Resource not found" });
}
