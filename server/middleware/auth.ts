import { Request, Response, NextFunction } from "express";

/**
 * Middleware that requires a valid API key for admin operations.
 * The key must be set via the ADMIN_API_KEY environment variable.
 * Clients send it in the Authorization header: `Bearer <key>`
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const apiKey = process.env.ADMIN_API_KEY;

  if (!apiKey) {
    // If no key is configured, block all admin operations in production
    if (process.env.NODE_ENV === "production") {
      res.status(503).json({ error: "Server misconfigured: ADMIN_API_KEY not set" });
      return;
    }
    // In development without a key, allow requests (backward compatible)
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  if (token !== apiKey) {
    res.status(403).json({ error: "Forbidden: Invalid API key" });
    return;
  }

  next();
}
