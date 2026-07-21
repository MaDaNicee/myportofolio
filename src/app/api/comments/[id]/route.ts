import { NextResponse } from "next/server";
import {
  apiError,
  getErrorMessage,
  isPrismaRecordNotFound,
  parseJsonBody,
} from "@/lib/api-utils";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  validateCommentPassword,
  verifyCommentPassword,
} from "@/lib/comment-password";
import { buildCommentUpdateInput } from "@/lib/portfolio-input";
import { getPrisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const runtime = "nodejs";

const publicCommentSelect = {
  id: true,
  name: true,
  role: true,
  message: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function authorizeCommentMutation(passwordHash: string | null, password: unknown) {
  if (await isAdminAuthenticated()) return null;

  if (!passwordHash) {
    return apiError("Komentar lama ini hanya dapat dikelola melalui admin.", 403);
  }

  const passwordError = validateCommentPassword(password);

  if (passwordError) return apiError(passwordError);

  const isPasswordValid = await verifyCommentPassword(password as string, passwordHash);

  return isPasswordValid ? null : apiError("Password komentar salah.", 403);
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const prisma = getPrisma();
    const data = await prisma.comment.findUnique({
      where: { id },
      select: publicCommentSelect,
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
    const existing = await prisma.comment.findUnique({
      where: { id },
      select: { passwordHash: true },
    });

    if (!existing) return apiError("Data Comment tidak ditemukan.", 404);

    const unauthorized = await authorizeCommentMutation(existing.passwordHash, body.password);

    if (unauthorized) return unauthorized;

    const data = await prisma.comment.update({
      where: { id },
      data: result.data,
      select: publicCommentSelect,
    });

    return NextResponse.json(data);
  } catch (error) {
    if (isPrismaRecordNotFound(error)) return apiError("Data Comment tidak ditemukan.", 404);

    return apiError(getErrorMessage(error, "Gagal memperbarui data Comment."), 500);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const prisma = getPrisma();
    const existing = await prisma.comment.findUnique({
      where: { id },
      select: { passwordHash: true },
    });

    if (!existing) return apiError("Data Comment tidak ditemukan.", 404);

    const isAdmin = await isAdminAuthenticated();
    let password: unknown;

    if (!isAdmin) {
      const body = await parseJsonBody(request);

      if (!body) return apiError("Password komentar wajib diisi.");
      password = body.password;
    }

    const unauthorized = isAdmin
      ? null
      : await authorizeCommentMutation(existing.passwordHash, password);

    if (unauthorized) return unauthorized;

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
