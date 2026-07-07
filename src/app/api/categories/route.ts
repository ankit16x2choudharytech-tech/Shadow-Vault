import { db } from "@/lib/db";
import type { Category } from "@/lib/types";

function transformCategory(raw: any): Category {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    icon: raw.icon,
    description: raw.description ?? null,
    color: raw.color,
    createdAt: raw.createdAt?.toISOString?.() ?? raw.createdAt,
  };
}

export async function GET() {
  try {
    const rawCategories = await db.category.findMany({
      orderBy: { createdAt: "asc" },
    });
    const categories = rawCategories.map(transformCategory);
    return Response.json({ data: categories });
  } catch (err) {
    console.error("[GET /api/categories] error:", err);
    return Response.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
