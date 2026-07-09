import { db } from "@/lib/firebase";
import {
  hashPassword,
  createToken,
  setAuthCookie,
} from "@/lib/auth";
import {
  createFallbackUser,
  getFallbackUserByEmail,
  isFirestoreUnavailable,
} from "@/lib/fallback-data";

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

    let userId = "";
    try {
      const existingSnap = await db
        .collection("users")
        .where("email", "==", trimmedEmail)
        .limit(1)
        .get();
      if (!existingSnap.empty) {
        return Response.json(
          { error: "Email already registered" },
          { status: 409 }
        );
      }

      const hashed = await hashPassword(String(password));
      const ref = await db.collection("users").add({
        name: String(name).trim(),
        email: trimmedEmail,
        password: hashed,
        role: "customer",
        banned: false,
        tier: "Standard",
        orders: 0,
        spent: 0,
        createdAt: new Date(),
      });
      userId = ref.id;
    } catch (err) {
      if (isFirestoreUnavailable(err)) {
        const existingFallbackUser = getFallbackUserByEmail(trimmedEmail);
        if (existingFallbackUser) {
          return Response.json(
            { error: "Email already registered" },
            { status: 409 }
          );
        }

        const fallbackUser = await createFallbackUser({
          name: String(name).trim(),
          email: trimmedEmail,
          password: String(password),
        });
        userId = fallbackUser.id;
      } else {
        throw err;
      }
    }

    const token = createToken(userId, "customer");
    const response = Response.json(
      {
        user: {
          id: userId,
          name: String(name).trim(),
          email: trimmedEmail,
          role: "customer",
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
