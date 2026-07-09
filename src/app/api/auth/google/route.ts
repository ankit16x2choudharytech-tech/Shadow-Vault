/*import { type NextRequest } from "next/server";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const SCOPE = ["openid", "email", "profile"].join(" ");

function getClientId(): string {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) {
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }
  return id;
}

export async function GET(request: Request) {
  try {
    const clientId = getClientId();
    const origin = new URL(request.url).origin;
    const redirectUri = `${origin}/api/auth/google/callback`;

    const authUrl = new URL(GOOGLE_AUTH_URL);
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", SCOPE);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");

    return Response.redirect(authUrl.toString(), 302);
  } catch (error) {
    console.error("[GET /api/auth/google] error:", error);
    return Response.json(
      { error: "Google login is not configured" },
      { status: 500 }
    );
  }
}
*/

import { NextResponse } from "next/server";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const SCOPE = ["openid", "email", "profile"].join(" ");

function getClientId(): string {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) {
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }
  return id;
}

export async function GET(request: Request) {
  try {
    const clientId = getClientId();
    const origin = new URL(request.url).origin;
    const redirectUri = `${origin}/api/auth/google/callback`;

    const authUrl = new URL(GOOGLE_AUTH_URL);
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", SCOPE);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");

    return NextResponse.redirect(authUrl.toString(), 302);
  } catch (error) {
    console.error("[GET /api/auth/google] error:", error);
    return NextResponse.json(
      { error: "Google login is not configured" },
      { status: 500 }
    );
  }
}
