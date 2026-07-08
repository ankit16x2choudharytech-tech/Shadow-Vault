import { db } from "@/lib/db";

/**
 * GET /api/users — list all users (admin).
 * Password field is excluded via Prisma select.
 */
export async function GET() {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        tier: true,
        orders: true,
        spent: true,
        createdAt: true,
      },
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
    return Response.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
