import { db } from "@/lib/firebase";
import { createToken, hashPassword, setAuthCookie } from "@/lib/auth";
import { getFallbackUserByEmail, createFallbackUser, isFirestoreUnavailable } from "@/lib/fallback-data";

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token: string;
  refresh_token?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

async function exchangeCode(code: string, redirectUri: string) {
  const tokenUrl = "https://oauth2.googleapis.com/token";
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getEnv("GOOGLE_CLIENT_ID"),
      client_secret: getEnv("GOOGLE_CLIENT_SECRET"),
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<GoogleTokenResponse>;
}

async function fetchProfile(accessToken: string) {
  const profileUrl = "https://www.googleapis.com/oauth2/v3/userinfo";
  const res = await fetch(profileUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google userinfo fetch failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<GoogleUserInfo>;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    if (!code) {
      return Response.json({ error: "Authorization code missing" }, { status: 400 });
    }

    const origin = url.origin;
    const redirectUri = `${origin}/api/auth/google/callback`;
    const tokenData = await exchangeCode(code, redirectUri);
    const profile = await fetchProfile(tokenData.access_token);

    const email = profile.email.toLowerCase();
    const userName = profile.name || email.split("@")[0];

    let userId = "";
    try {
      const snapshot = await db.collection("users").where("email", "==", email).limit(1).get();
      if (!snapshot.empty) {
        userId = snapshot.docs[0].id;
      } else {
        const ref = await db.collection("users").add({
          name: userName,
          email,
          password: await hashPassword(Math.random().toString(36).slice(2)),
          role: "customer",
          banned: false,
          tier: "Standard",
          orders: 0,
          spent: 0,
          createdAt: new Date(),
          googleAuth: true,
        });
        userId = ref.id;
      }
    } catch (err) {
      if (isFirestoreUnavailable(err)) {
        const existingFallbackUser = getFallbackUserByEmail(email);
        if (existingFallbackUser) {
          userId = existingFallbackUser.id;
        } else {
          const fallbackUser = await createFallbackUser({
            name: userName,
            email,
            password: Math.random().toString(36).slice(2),
          });
          userId = fallbackUser.id;
        }
      } else {
        throw err;
      }
    }

    const token = createToken(userId, "customer");
    const response = Response.redirect("/", 302);
    await setAuthCookie(response, token);
    return response;
   }
//   catch (err: any) {
//   console.error(err);

//   return Response.json(
//     {
//       error: err.message,
//       stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
//     },
//     { status: 500 }
//   );
// }
 catch (err) {
    console.error("[GET /api/auth/google/callback] error:", err);
    return Response.json({ error: "Google login failed" }, { status: 500 });
   }
}
