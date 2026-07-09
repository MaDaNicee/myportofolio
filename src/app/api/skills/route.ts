import { NextResponse } from "next/server";
import { apiError, getErrorMessage, parseJsonBody } from "@/lib/api-utils";
import { buildSkillCreateInput } from "@/lib/portfolio-input";
import { getPrisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const prisma = getPrisma();
    const data = await prisma.skill.findMany({
      orderBy: [{ group: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(data);
  } catch (error) {
    return apiError(getErrorMessage(error, "Gagal mengambil data skills."), 500);
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminSession();

  if (unauthorized) return unauthorized;

  const body = await parseJsonBody(request);

  if (!body) return apiError("Body JSON tidak valid.");

  const result = buildSkillCreateInput(body);

  if ("error" in result) return apiError(result.error);

  try {
    const prisma = getPrisma();
    const data = await prisma.skill.create({
      data: result.data,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return apiError(getErrorMessage(error, "Gagal membuat data Skill."), 500);
  }
}
