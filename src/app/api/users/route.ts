import { db } from "@/lib/db";

/** GET /api/users — list all users (admin) */
export async function GET() {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    const safe = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      banned: u.banned,
      tier: u.tier,
      orders: u.orders,
      spent: u.spent,
      createdAt: u.createdAt.toISOString(),
    }));
    return Response.json({ data: safe });
  } catch (err) {
    console.error("[GET /api/users] error:", err);
    return Response.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

/** POST /api/users — register a new user */
export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return Response.json(
        { error: "Missing name, email or password" },
        { status: 400 }
      );
    }
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ error: "Email already registered" }, { status: 409 });
    }
    // Simple hash (demo). In production use bcrypt.
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
    console.error("[POST /api/users] error:", err);
    return Response.json({ error: "Failed to create user" }, { status: 500 });
  }
}
