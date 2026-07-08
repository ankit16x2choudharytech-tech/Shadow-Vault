import { db } from "@/lib/db";
import {
  hashPassword,
  createToken,
  setAuthCookie,
} from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** POST /api/auth/register — create a new customer account */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return Response.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { name, email, password } = body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!name || !email || !password) {
      return Response.json(
        { error: "Missing name, email or password" },
        { status: 400 }
      );
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    if (!EMAIL_RE.test(trimmedEmail)) {
      return Response.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return Response.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({
      where: { email: trimmedEmail },
    });
    if (existing) {
      return Response.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const hashed = await hashPassword(String(password));
    const user = await db.user.create({
      data: {
        name: String(name).trim(),
        email: trimmedEmail,
        password: hashed,
        role: "customer",
      },
    });

    const token = createToken(user.id, user.role);
    const response = Response.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
    await setAuthCookie(response, token);
    return response;
  } catch (err) {
    console.error("[POST /api/auth/register] error:", err);
    return Response.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
