import { Request, Response, NextFunction } from "express";
import { isValidSession, safeEqual } from "../sessions";

/**
 * Protege as rotas administrativas.
 * Aceita dois tipos de credencial no header `Authorization: Bearer <valor>`:
 *  1. Um token de sessão obtido em POST /api/auth/login (senha do admin)
 *  2. A chave fixa ADMIN_API_KEY (uso máquina-a-máquina / ERP)
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const apiKey = process.env.ADMIN_API_KEY;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!apiKey && !adminPassword) {
    res.status(503).json({
      error:
        "Servidor mal configurado: defina ADMIN_PASSWORD (e/ou ADMIN_API_KEY) no .env e reinicie o backend.",
    });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  if (isValidSession(token)) {
    next();
    return;
  }

  if (apiKey && safeEqual(token, apiKey)) {
    next();
    return;
  }

  res.status(403).json({ error: "Forbidden: Invalid credentials" });
}
