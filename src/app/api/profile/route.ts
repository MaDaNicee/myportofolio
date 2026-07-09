import { NextResponse } from "next/server";
import { apiError, getErrorMessage, parseJsonBody } from "@/lib/api-utils";
import { buildProfileCreateInput } from "@/lib/portfolio-input";
import { getPrisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const prisma = getPrisma();
    const data = await prisma.profile.findMany({
      orderBy: [{ createdAt: "asc" }],
    });

    return NextResponse.json(data);
  } catch (error) {
    return apiError(getErrorMessage(error, "Gagal mengambil data profile."), 500);
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminSession();

  if (unauthorized) return unauthorized;

  const body = await parseJsonBody(request);

  if (!body) return apiError("Body JSON tidak valid.");

  const result = buildProfileCreateInput(body);

  if ("error" in result) return apiError(result.error);

  try {
    const prisma = getPrisma();
    const data = await prisma.profile.create({
      data: result.data,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return apiError(getErrorMessage(error, "Gagal membuat data Profile."), 500);
  }
}
