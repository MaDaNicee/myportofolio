import { NextResponse } from "next/server";
import { apiError, getErrorMessage, parseJsonBody } from "@/lib/api-utils";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  hashCommentPassword,
  validateCommentPassword,
} from "@/lib/comment-password";
import { buildCommentCreateInput } from "@/lib/portfolio-input";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

const publicCommentSelect = {
  id: true,
  name: true,
  role: true,
  message: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function GET() {
  try {
    const prisma = getPrisma();
    const data = await prisma.comment.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: publicCommentSelect,
    });

    return NextResponse.json(data);
  } catch (error) {
    return apiError(getErrorMessage(error, "Gagal mengambil data comments."), 500);
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody(request);

  if (!body) return apiError("Body JSON tidak valid.");

  const result = buildCommentCreateInput(body);

  if ("error" in result) return apiError(result.error);

  const isAdmin = await isAdminAuthenticated();
  const password = typeof body.password === "string" ? body.password : "";

  if (!isAdmin || password) {
    const passwordError = validateCommentPassword(password);

    if (passwordError) return apiError(passwordError);
  }

  try {
    const prisma = getPrisma();
    const passwordHash = password ? await hashCommentPassword(password) : null;
    const data = await prisma.comment.create({
      data: {
        ...result.data,
        passwordHash,
      },
      select: publicCommentSelect,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return apiError(getErrorMessage(error, "Gagal membuat data Comment."), 500);
  }
}
