import { unlink } from "node:fs/promises";
import path from "node:path";

type UploadRecord = Record<string, unknown>;

const uploadPrefix = "/uploads/";

function isSafeUploadedPath(value: unknown): value is string {
  if (typeof value !== "string") return false;

  const normalized = path.posix.normalize(value);

  return normalized === value && normalized.startsWith(uploadPrefix) && !normalized.includes("\0");
}

async function deleteUploadedFile(uploadPath: string) {
  const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
  const filePath = path.resolve(process.cwd(), "public", uploadPath.replace(/^\/+/, ""));

  if (!filePath.startsWith(`${uploadsRoot}${path.sep}`)) return;

  try {
    await unlink(filePath);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return;

    console.warn(`Gagal menghapus file upload: ${uploadPath}`, error);
  }
}

export async function deleteUploadedFiles(paths: unknown[]) {
  const uniquePaths = [...new Set(paths.filter(isSafeUploadedPath))];

  await Promise.all(uniquePaths.map((uploadPath) => deleteUploadedFile(uploadPath)));
}

export async function deleteUploadedFilesFromRecord(record: UploadRecord | null, fields: string[]) {
  if (!record) return;

  await deleteUploadedFiles(fields.map((field) => record[field]));
}

export async function deleteReplacedUploadedFiles(before: UploadRecord | null, after: UploadRecord | null, fields: string[]) {
  if (!before || !after) return;

  await deleteUploadedFiles(
    fields
      .filter((field) => before[field] !== after[field])
      .map((field) => before[field]),
  );
}
