import fs from "fs";
import path from "path";

const MAX_UPLOAD_SIZE = 50 * 1024 * 1024; // 50MB

function getUploadFileName(originalName: string): string {
  const ext = path.extname(originalName) || "";
  const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 32);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${base || "upload"}-${suffix}${ext}`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof (file as any).arrayBuffer !== "function") {
      return Response.json(
        { error: "No file was uploaded. Use multipart/form-data with a file field named 'file'." },
        { status: 400 }
      );
    }

    const fileName = (file as any).name || `upload-${Date.now()}`;
    const size = Number((file as any).size ?? 0);
    if (size > MAX_UPLOAD_SIZE) {
      return Response.json(
        { error: "File size exceeds the 50MB upload limit." },
        { status: 413 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    fs.mkdirSync(uploadDir, { recursive: true });

    const safeName = getUploadFileName(fileName.toString());
    const filePath = path.join(uploadDir, safeName);
    const buffer = Buffer.from(await (file as any).arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    return Response.json({ url: `/uploads/${safeName}` });
  } catch (error) {
    console.error("/api/upload error:", error);
    return Response.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
