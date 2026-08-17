import crypto from "crypto";

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

const sessions = new Map<string, number>(); // token -> expiraEm

function cleanup() {
  const now = Date.now();
  for (const [token, expires] of sessions) {
    if (expires < now) sessions.delete(token);
  }
}

export function createSession(): string {
  cleanup();
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

export function isValidSession(token: string): boolean {
  const expires = sessions.get(token);
  if (!expires) return false;
  if (expires < Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

export function destroySession(token: string) {
  sessions.delete(token);
}

export function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL || "admin@local";
}

export function getAdminPassword(): string | undefined {
  return process.env.ADMIN_PASSWORD;
}

/** Comparação em tempo constante para evitar timing attacks */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
