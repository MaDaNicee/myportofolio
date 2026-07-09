import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { apiError, getErrorMessage } from "@/lib/api-utils";
import { requireAdminSession } from "@/lib/admin-api";

export const runtime = "nodejs";

const maxUploadSize = 10 * 1024 * 1024;
const allowedFileTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["application/pdf", "pdf"],
]);

const uploadFolderMap: Record<string, Record<string, string>> = {
  profile: {
    avatar: "profile/photos",
    cvUrl: "profile/documents",
  },
  projects: {
    imageUrl: "projects",
  },
  certificates: {
    imageUrl: "certificates",
  },
};

function getUploadSubfolder(resource: FormDataEntryValue | null, field: FormDataEntryValue | null) {
  if (typeof resource !== "string" || typeof field !== "string") return "misc";

  const sanitizedResource = resource.replace(/[^a-z0-9-]/gi, "").toLowerCase();

  return uploadFolderMap[resource]?.[field] ?? (sanitizedResource || "misc");
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminSession();

  if (unauthorized) return unauthorized;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return apiError("File wajib diupload.");
    }

    if (!allowedFileTypes.has(file.type)) {
      return apiError("Format file harus JPG, PNG, WEBP, GIF, atau PDF.");
    }

    if (file.size > maxUploadSize) {
      return apiError("Ukuran file maksimal 10MB.");
    }

    const extension = allowedFileTypes.get(file.type) ?? "bin";
    const subfolder = getUploadSubfolder(formData.get("resource"), formData.get("field"));
    const uploadFolder = path.join(process.cwd(), "public", "uploads", ...subfolder.split("/"));
    const filename = `${Date.now()}-${randomUUID()}.${extension}`;
    const destination = path.join(uploadFolder, filename);
    const bytes = Buffer.from(await file.arrayBuffer());

    await mkdir(uploadFolder, { recursive: true });
    await writeFile(destination, bytes);

    return NextResponse.json({ path: `/uploads/${subfolder}/${filename}` }, { status: 201 });
  } catch (error) {
    return apiError(getErrorMessage(error, "Upload file gagal."), 500);
  }
}
