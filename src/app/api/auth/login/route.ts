import { db } from "@/lib/firebase";
import {
  verifyPassword,
  createToken,
  setAuthCookie,
} from "@/lib/auth";

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
    const snap = await db
      .collection("users")
      .where("email", "==", trimmedEmail)
      .limit(1)
      .get();
    if (snap.empty) {
      return Response.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const userDoc = snap.docs[0];
    const user = userDoc.data() as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
      banned?: boolean;
    };

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

    const token = createToken(userDoc.id, user.role ?? "customer");
    const response = Response.json({
      user: {
        id: userDoc.id,
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
