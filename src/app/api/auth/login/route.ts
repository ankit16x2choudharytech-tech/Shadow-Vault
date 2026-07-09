import { db } from "@/lib/firebase";
import {
  verifyPassword,
  createToken,
  setAuthCookie,
} from "@/lib/auth";
import {
  getFallbackUserByEmail,
  isFirestoreUnavailable,
} from "@/lib/fallback-data";

/** POST /api/auth/login — validate credentials and issue a JWT cookie */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return Response.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { email, password } = body as {
      email?: string;
      password?: string;
      role?: string;
    };

    // `role` in the body is intentionally ignored — role is derived from the
    // user record, not the request.
    void (body as { role?: string }).role;

    if (!email || !password) {
      return Response.json(
        { error: "Missing email or password" },
        { status: 400 }
      );
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    let userDoc: {
      id: string;
      data: () => {
        name?: string;
        email?: string;
        password?: string;
        role?: string;
        banned?: boolean;
      };
    } | null = null;

    try {
      const snap = await db
        .collection("users")
        .where("email", "==", trimmedEmail)
        .limit(1)
        .get();
      if (!snap.empty) {
        userDoc = snap.docs[0] as typeof userDoc;
      }
    } catch (err) {
      if (!isFirestoreUnavailable(err)) {
        throw err;
      }
    }

    let user: {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
      banned?: boolean;
    } | null = null;
    let userId = "";

    if (userDoc) {
      user = userDoc.data();
      userId = userDoc.id;
    } else {
      const fallbackUser = getFallbackUserByEmail(trimmedEmail);
      if (fallbackUser) {
        user = {
          name: fallbackUser.name,
          email: fallbackUser.email,
          password: fallbackUser.password,
          role: fallbackUser.role,
          banned: fallbackUser.banned,
        };
        userId = fallbackUser.id;
      }
    }

    if (!user) {
      return Response.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const ok = await verifyPassword(String(password), user.password ?? "");
    if (!ok) {
      return Response.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (user.banned) {
      return Response.json(
        { error: "Your account has been banned" },
        { status: 403 }
      );
    }

    const token = createToken(userId, user.role ?? "customer");
    const response = Response.json({
      user: {
        id: userId,
        name: user.name ?? "",
        email: user.email ?? "",
        role: user.role ?? "customer",
      },
    });
    await setAuthCookie(response, token);
    return response;
  } catch (err) {
    console.error("[POST /api/auth/login] error:", err);
    return Response.json({ error: "Login failed" }, { status: 500 });
  }
}
