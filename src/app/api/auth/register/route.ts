import { db } from "@/lib/db";

/** POST /api/auth/register — create a new customer account */
export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return Response.json(
        { error: "Missing name, email or password" },
        { status: 400 }
      );
    }
    if (password.length < 4) {
      return Response.json(
        { error: "Password must be at least 4 characters" },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashed = `hash_${Buffer.from(password).toString("base64")}`;
    const user = await db.user.create({
      data: { name, email, password: hashed, role: "customer" },
    });

    return Response.json(
      {
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/auth/register] error:", err);
    return Response.json({ error: "Registration failed" }, { status: 500 });
  }
}
