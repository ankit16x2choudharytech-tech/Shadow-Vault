import { db } from "@/lib/db";

/** POST /api/auth/login — validate credentials against the User table */
export async function POST(request: Request) {
  try {
    const { email, password, role } = await request.json();
    if (!email || !password) {
      return Response.json({ error: "Missing email or password" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // verify password (demo hash: hash_<base64>)
    const hashed = `hash_${Buffer.from(password).toString("base64")}`;
    if (user.password !== hashed) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // check ban
    if (user.banned) {
      return Response.json({ error: "Your account has been banned. Contact support." }, { status: 403 });
    }

    // role check: if admin login requested, user must be admin
    if (role === "admin" && user.role !== "admin") {
      return Response.json({ error: "You do not have admin access" }, { status: 403 });
    }

    return Response.json({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[POST /api/auth/login] error:", err);
    return Response.json({ error: "Login failed" }, { status: 500 });
  }
}
