import { NextResponse } from "next/server";
import {
  apiError,
  getErrorMessage,
  isPrismaRecordNotFound,
  parseJsonBody,
} from "@/lib/api-utils";
import { buildCommentUpdateInput } from "@/lib/portfolio-input";
import { getPrisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const prisma = getPrisma();
    const data = await prisma.comment.findUnique({
      where: { id },
    });

    if (!data) return apiError("Data Comment tidak ditemukan.", 404);

    return NextResponse.json(data);
  } catch (error) {
    return apiError(getErrorMessage(error, "Gagal mengambil data Comment."), 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await parseJsonBody(request);

  if (!body) return apiError("Body JSON tidak valid.");

  const result = buildCommentUpdateInput(body);

  if ("error" in result) return apiError(result.error);

  try {
    const prisma = getPrisma();
    const data = await prisma.comment.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json(data);
  } catch (error) {
    if (isPrismaRecordNotFound(error)) return apiError("Data Comment tidak ditemukan.", 404);

    return apiError(getErrorMessage(error, "Gagal memperbarui data Comment."), 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const unauthorized = await requireAdminSession();

  if (unauthorized) return unauthorized;

  const { id } = await context.params;

  try {
    const prisma = getPrisma();
    const deleted = await prisma.comment.deleteMany({
      where: { id },
    });

    if (deleted.count === 0) return apiError("Data Comment tidak ditemukan.", 404);

    return NextResponse.json({ message: "Data Comment berhasil dihapus." });
  } catch (error) {
    if (isPrismaRecordNotFound(error)) return apiError("Data Comment tidak ditemukan.", 404);

    return apiError(getErrorMessage(error, "Gagal menghapus data Comment."), 500);
  }
}
