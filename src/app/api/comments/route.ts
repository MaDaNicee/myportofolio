import { NextResponse } from "next/server";
import { apiError, getErrorMessage, parseJsonBody } from "@/lib/api-utils";
import { buildCommentCreateInput } from "@/lib/portfolio-input";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const prisma = getPrisma();
    const data = await prisma.comment.findMany({
      orderBy: [{ createdAt: "desc" }],
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

  try {
    const prisma = getPrisma();
    const data = await prisma.comment.create({
      data: result.data,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return apiError(getErrorMessage(error, "Gagal membuat data Comment."), 500);
  }
}
