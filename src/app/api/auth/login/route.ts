import { db } from "@/lib/db";
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
    };

    if (!email || !password) {
      return Response.json(
        { error: "Missing email or password" },
        { status: 400 }
      );
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const user = await db.user.findUnique({
      where: { email: trimmedEmail },
    });
    if (!user) {
      return Response.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const ok = await verifyPassword(String(password), user.password);
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

    const token = createToken(user.id, user.role);
    const response = Response.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
    await setAuthCookie(response, token);
    return response;
  } catch (err) {
    console.error("[POST /api/auth/login] error:", err);
    return Response.json({ error: "Login failed" }, { status: 500 });
  }
}
