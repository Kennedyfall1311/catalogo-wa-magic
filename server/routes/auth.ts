import { Router } from "express";
import {
  createSession,
  destroySession,
  isValidSession,
  getAdminEmail,
  getAdminPassword,
  safeEqual,
} from "../sessions";

export const authRouter = Router();

function bearer(req: any): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice(7);
}

function isAuthorized(token: string | null): boolean {
  if (!token) return false;
  if (isValidSession(token)) return true;
  const apiKey = process.env.ADMIN_API_KEY;
  return !!apiKey && safeEqual(token, apiKey);
}

const ADMIN_USER = { id: "local-admin", email: getAdminEmail() };

// Sessão atual — só retorna admin se o token for válido
authRouter.get("/session", (req, res) => {
  const token = bearer(req);
  if (!isAuthorized(token)) {
    res.status(401).json({ user: null, isAdmin: false });
    return;
  }
  res.json({ user: { ...ADMIN_USER, email: getAdminEmail() }, isAdmin: true });
});

// Login com e-mail + senha definidos em ADMIN_EMAIL / ADMIN_PASSWORD
authRouter.post("/login", (req, res) => {
  const password = getAdminPassword();
  if (!password) {
    res.status(503).json({
      error:
        "ADMIN_PASSWORD não configurada no servidor. Defina ADMIN_PASSWORD no arquivo .env e reinicie o backend.",
    });
    return;
  }

  const { email, password: sentPassword } = req.body ?? {};
  const emailOk =
    typeof email === "string" &&
    email.trim().toLowerCase() === getAdminEmail().trim().toLowerCase();
  const passOk = typeof sentPassword === "string" && safeEqual(sentPassword, password);

  if (!emailOk || !passOk) {
    res.status(401).json({ error: "E-mail ou senha inválidos" });
    return;
  }

  const token = createSession();
  res.json({ token, user: { ...ADMIN_USER, email: getAdminEmail() }, isAdmin: true });
});

authRouter.post("/logout", (req, res) => {
  const token = bearer(req);
  if (token) destroySession(token);
  res.json({ success: true });
});
