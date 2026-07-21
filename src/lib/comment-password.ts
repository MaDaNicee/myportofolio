import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const hashLength = 64;

export const commentPasswordMinLength = 6;
export const commentPasswordMaxLength = 72;

export function validateCommentPassword(password: unknown) {
  if (typeof password !== "string") return "Password komentar wajib diisi.";

  const length = password.trim().length;

  if (length < commentPasswordMinLength) {
    return `Password komentar minimal ${commentPasswordMinLength} karakter.`;
  }

  if (length > commentPasswordMaxLength) {
    return `Password komentar maksimal ${commentPasswordMaxLength} karakter.`;
  }

  return null;
}

export async function hashCommentPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = (await scryptAsync(password, salt, hashLength)) as Buffer;

  return `scrypt:${salt}:${derivedKey.toString("base64url")}`;
}

export async function verifyCommentPassword(password: string, storedHash: string) {
  const [algorithm, salt, encodedHash] = storedHash.split(":");

  if (algorithm !== "scrypt" || !salt || !encodedHash) return false;

  try {
    const storedBuffer = Buffer.from(encodedHash, "base64url");
    const derivedKey = (await scryptAsync(password, salt, storedBuffer.length)) as Buffer;

    return storedBuffer.length === derivedKey.length && timingSafeEqual(storedBuffer, derivedKey);
  } catch {
    return false;
  }
}
