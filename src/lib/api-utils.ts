import { NextResponse } from "next/server";

export type JsonBody = Record<string, unknown>;

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function parseJsonBody(request: Request) {
  try {
    const body = (await request.json()) as unknown;

    if (body && typeof body === "object" && !Array.isArray(body)) {
      return body as JsonBody;
    }

    return null;
  } catch {
    return null;
  }
}

export function getString(body: JsonBody, key: string) {
  const value = body[key];

  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

export function getOptionalString(body: JsonBody, key: string) {
  const value = body[key];

  if (value === null) return null;
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export function getBoolean(body: JsonBody, key: string) {
  const value = body[key];

  return typeof value === "boolean" ? value : undefined;
}

export function getNumber(body: JsonBody, key: string) {
  const value = body[key];

  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

export function getStringArray(body: JsonBody, key: string) {
  const value = body[key];

  if (!Array.isArray(value)) return undefined;

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function isPrismaRecordNotFound(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2025"
  );
}
