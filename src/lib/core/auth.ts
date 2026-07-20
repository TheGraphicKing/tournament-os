/**
 * Auth for the core REST contract (the separate-service fallback).
 * Two mechanisms, both constant-time:
 *   • GET  (core pulls entry-list): Bearer token — `authorization: Bearer <CORE_API_KEY>`.
 *   • POST (core pushes results):   HMAC-SHA256 signature of the raw body
 *     in `x-core-signature`, keyed by CORE_SHARED_SECRET (mirrors how the
 *     Razorpay webhook is verified — APP_RULES 8.5).
 * Secrets live in env vars only; never the client.
 */
import "server-only";
import crypto from "node:crypto";

function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  // Length must be compared safely too — pad to equal length first.
  if (ab.length !== bb.length) {
    // Still run a comparison to keep timing uniform, then fail.
    crypto.timingSafeEqual(ab, ab);
    return false;
  }
  return crypto.timingSafeEqual(ab, bb);
}

/** True when the request carries the expected Bearer token. */
export function verifyBearer(request: Request): boolean {
  const expected = process.env.CORE_API_KEY;
  if (!expected) return false; // misconfigured → deny (fail closed)
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return false;
  return timingSafeEqualStr(token, expected);
}

/** True when `x-core-signature` is a valid HMAC of the raw body. */
export function verifySignature(rawBody: string, request: Request): boolean {
  const secret = process.env.CORE_SHARED_SECRET;
  if (!secret) return false; // fail closed
  const provided = request.headers.get("x-core-signature") ?? "";
  if (!provided) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeEqualStr(provided, expected);
}
