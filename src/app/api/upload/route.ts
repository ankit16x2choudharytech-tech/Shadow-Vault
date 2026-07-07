import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * POST /api/upload
 * Accepts a multipart/form-data upload with a "file" field.
 * Saves the file to public/uploads/ and returns its public URL.
 * Used by the admin Add Product form to attach the actual downloadable file
 * to a product. The returned URL is stored in the product's telegramFileId
 * field (repurposed as the secure download path).
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // basic size guard (50 MB max — adjust as needed)
    const MAX_BYTES = 50 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      return Response.json(
        { error: "File too large (max 50 MB)" },
        { status: 413 }
      );
    }

    // sanitize filename + add timestamp to avoid collisions
    const safeName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 80);
    const timestamp = Date.now();
    const fileName = `${timestamp}-${safeName}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    // ensure dir exists
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${fileName}`;
    return Response.json(
      { url: publicUrl, name: file.name, size: file.size },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/upload] error:", err);
    return Response.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
