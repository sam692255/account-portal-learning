import { createHash, randomBytes } from "node:crypto";
import { pool } from "./db.js";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export async function createSession(userId: string): Promise<{
  token: string;
  expiresAt: Date;
}> {
  // Generate a random token for the client to use.
  const token = randomBytes(32).toString("base64url");

  // Store only its SHA-256 hash in PostgreSQL.
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await pool.query(
    `INSERT INTO public.user_sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [tokenHash, userId, expiresAt],
  );

  return { token, expiresAt };
}