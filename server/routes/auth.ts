import { Router } from "express";

export const authRouter = Router();

// In PostgreSQL-only mode without authentication, admin is always open
// This returns a mock admin session
authRouter.get("/session", (_req, res) => {
  res.json({
    user: {
      id: "local-admin",
      email: "admin@local",
    },
    isAdmin: true,
  });
});

authRouter.post("/login", (_req, res) => {
  res.json({
    user: {
      id: "local-admin",
      email: "admin@local",
    },
    isAdmin: true,
  });
});

authRouter.post("/logout", (_req, res) => {
  res.json({ success: true });
});
