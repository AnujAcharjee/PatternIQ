export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { apiHandler, requireAuth } from "@/lib/handler";
import { ok } from "@/lib/api-response";
import { ApiError } from "@/lib/errors";
import { AuthContext } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

export const POST = apiHandler(async (req: NextRequest, { auth }: { auth: AuthContext | null }) => {
  requireAuth(auth);

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    throw ApiError.badRequest("No file provided");
  }

  // Validate mime type
  const mimeType = file.type;
  if (!mimeType.startsWith("image/")) {
    throw ApiError.badRequest("Only image files are supported");
  }

  // Max size: 10MB
  if (file.size > 10 * 1024 * 1024) {
    throw ApiError.badRequest("Image file size exceeds 10MB limit");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const ext = path.extname(file.name) || ".png";
  const safeBaseName = path
    .basename(file.name, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 40);
  const fileName = `${Date.now()}_${safeBaseName}${ext}`;
  const filePath = path.join(uploadsDir, fileName);

  await fs.writeFile(filePath, buffer);

  const publicUrl = `/uploads/${fileName}`;

  return ok({ url: publicUrl, fileName }, "Image uploaded successfully");
});
