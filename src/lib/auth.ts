// ShadowVault — Auth helpers (bcrypt password hashing, JWT issuing, cookie mgmt)

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "@/lib/firebase";
import { NextResponse } from "next/server";

const COOKIE_NAME = "sv_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
}

/**
 * Hash a plaintext password using bcrypt with 10 salt rounds.
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

/**
 * Verify a plaintext password against a stored bcrypt hash.
 */
export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

/**
 * Sign a JWT containing { userId, role } that expires in 7 days.
 */
export function createToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, getJwtSecret(), {
    expiresIn: "7d",
  });
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
}

/**
 * Read the `sv_token` cookie from the incoming request headers, verify the
 * JWT, fetch the user from the DB and return it. Returns null when there is
 * no token, the token is invalid, the user does not exist, or the user is
 * banned.
 */
export async function getUserFromRequest(
  request: Request
): Promise<AuthenticatedUser | null> {
  try {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const token = parseCookieValue(cookieHeader, COOKIE_NAME);
    if (!token) return null;

    const payload = jwt.verify(token, getJwtSecret()) as {
      userId?: string;
      role?: string;
    };
    if (!payload?.userId) return null;

    const userDoc = await db.collection("users").doc(payload.userId).get();
    if (!userDoc.exists) return null;
    const user = userDoc.data() as {
      name?: string;
      email?: string;
      role?: string;
      banned?: boolean;
    };
    if (!user) return null;
    if (user.banned) return null;

    return {
      id: userDoc.id,
      name: user.name ?? "",
      email: user.email ?? "",
      role: user.role ?? "customer",
      banned: Boolean(user.banned),
    };
  } catch {
    return null;
  }
}

/**
 * Set the `sv_token` httpOnly cookie on the outgoing response. The `response`
 * parameter is accepted for API symmetry but the cookie is set via the
 * next/headers cookies() jar (the Next 16 recommended approach inside Route
 * Handlers).
 */
/* export async function setAuthCookie(
   response: Response,
   token: string
 ): Promise<void> {
   void response; // cookie is managed via next/headers cookies() jar
   const jar = await cookies();
   jar.set({
     name: COOKIE_NAME,
     value: token,
     httpOnly: true,
     sameSite: "lax",
     path: "/",
     maxAge: COOKIE_MAX_AGE,
   });
 }
*/
export function setAuthCookie(
  response: NextResponse,
  token: string
) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

/**
 * Clear the `sv_token` cookie.
 */
export async function clearAuthCookie(response: Response): Promise<void> {
  void response;
  const jar = await cookies();
  jar.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/** Parse a single cookie value out of a Cookie header string. */
function parseCookieValue(
  cookieHeader: string,
  name: string
): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${name}=`)) {
      return decodeURIComponent(trimmed.slice(name.length + 1));
    }
  }
  return null;
}
