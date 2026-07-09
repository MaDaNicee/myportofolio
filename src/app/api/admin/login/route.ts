import { NextResponse } from "next/server";
import { apiError, getErrorMessage, getString, parseJsonBody } from "@/lib/api-utils";
import { createAdminSessionToken, setAdminSessionCookie, verifyAdminPassword } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await parseJsonBody(request);

  if (!body) return apiError("Body JSON tidak valid.");

  const password = getString(body, "password");

  if (!password) return apiError("Password wajib diisi.");

  try {
    if (!verifyAdminPassword(password)) {
      return apiError("Password admin salah.", 401);
    }

    const response = NextResponse.json({ ok: true });

    setAdminSessionCookie(response, createAdminSessionToken());

    return response;
  } catch (error) {
    return apiError(getErrorMessage(error, "Login admin gagal."), 500);
  }
}
