import { NextResponse } from "next/server";
import {
  apiError,
  getErrorMessage,
  isPrismaRecordNotFound,
  parseJsonBody,
} from "@/lib/api-utils";
import { buildProjectUpdateInput } from "@/lib/portfolio-input";
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
      prisma.project.findUnique({
        where: { id },
      }),
    );

    if (!data) return apiError("Data Project tidak ditemukan.", 404);

    return NextResponse.json(data);
  } catch (error) {
    return apiError(getErrorMessage(error, "Gagal mengambil data Project."), 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const unauthorized = await requireAdminSession();

  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const body = await parseJsonBody(request);

  if (!body) return apiError("Body JSON tidak valid.");

  const result = buildProjectUpdateInput(body);

  if ("error" in result) return apiError(result.error);

  try {
    const prisma = getPrisma();
    const existing = await withPrismaRetry(() =>
      prisma.project.findUnique({
        where: { id },
      }),
    );

    if (!existing) return apiError("Data Project tidak ditemukan.", 404);

    const data = await withPrismaRetry(() =>
      prisma.project.update({
        where: { id },
        data: result.data,
      }),
    );

    await deleteReplacedUploadedFiles(existing, data, ["imageUrl"]);

    return NextResponse.json(data);
  } catch (error) {
    if (isPrismaRecordNotFound(error)) return apiError("Data Project tidak ditemukan.", 404);

    return apiError(getErrorMessage(error, "Gagal memperbarui data Project."), 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const unauthorized = await requireAdminSession();

  if (unauthorized) return unauthorized;

  const { id } = await context.params;

  try {
    const prisma = getPrisma();
    const existing = await withPrismaRetry(() =>
      prisma.project.findUnique({
        where: { id },
      }),
    );

    if (!existing) return apiError("Data Project tidak ditemukan.", 404);

    const deleted = await withPrismaRetry(() =>
      prisma.project.deleteMany({
        where: { id },
      }),
    );

    if (deleted.count === 0) return apiError("Data Project tidak ditemukan.", 404);

    await deleteUploadedFilesFromRecord(existing, ["imageUrl"]);

    return NextResponse.json({ message: "Data Project berhasil dihapus." });
  } catch (error) {
    if (isPrismaRecordNotFound(error)) return apiError("Data Project tidak ditemukan.", 404);

    return apiError(getErrorMessage(error, "Gagal menghapus data Project."), 500);
  }
}
