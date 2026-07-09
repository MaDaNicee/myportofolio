import { NextResponse } from "next/server";
import {
  apiError,
  getErrorMessage,
  isPrismaRecordNotFound,
  parseJsonBody,
} from "@/lib/api-utils";
import { buildProfileUpdateInput } from "@/lib/portfolio-input";
import { getPrisma, withPrismaRetry } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-api";
import { deleteReplacedUploadedFiles, deleteUploadedFilesFromRecord } from "@/lib/uploaded-files";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const prisma = getPrisma();
    const data = await withPrismaRetry(() =>
      prisma.profile.findUnique({
        where: { id },
      }),
    );

    if (!data) return apiError("Data Profile tidak ditemukan.", 404);

    return NextResponse.json(data);
  } catch (error) {
    return apiError(getErrorMessage(error, "Gagal mengambil data Profile."), 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const unauthorized = await requireAdminSession();

  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const body = await parseJsonBody(request);

  if (!body) return apiError("Body JSON tidak valid.");

  const result = buildProfileUpdateInput(body);

  if ("error" in result) return apiError(result.error);

  try {
    const prisma = getPrisma();
    const existing = await withPrismaRetry(() =>
      prisma.profile.findUnique({
        where: { id },
      }),
    );

    if (!existing) return apiError("Data Profile tidak ditemukan.", 404);

    const data = await withPrismaRetry(() =>
      prisma.profile.update({
        where: { id },
        data: result.data,
      }),
    );

    await deleteReplacedUploadedFiles(existing, data, ["avatar", "cvUrl"]);

    return NextResponse.json(data);
  } catch (error) {
    if (isPrismaRecordNotFound(error)) return apiError("Data Profile tidak ditemukan.", 404);

    return apiError(getErrorMessage(error, "Gagal memperbarui data Profile."), 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const unauthorized = await requireAdminSession();

  if (unauthorized) return unauthorized;

  const { id } = await context.params;

  try {
    const prisma = getPrisma();
    const existing = await withPrismaRetry(() =>
      prisma.profile.findUnique({
        where: { id },
      }),
    );

    if (!existing) return apiError("Data Profile tidak ditemukan.", 404);

    const deleted = await withPrismaRetry(() =>
      prisma.profile.deleteMany({
        where: { id },
      }),
    );

    if (deleted.count === 0) return apiError("Data Profile tidak ditemukan.", 404);

    await deleteUploadedFilesFromRecord(existing, ["avatar", "cvUrl"]);

    return NextResponse.json({ message: "Data Profile berhasil dihapus." });
  } catch (error) {
    if (isPrismaRecordNotFound(error)) return apiError("Data Profile tidak ditemukan.", 404);

    return apiError(getErrorMessage(error, "Gagal menghapus data Profile."), 500);
  }
}
