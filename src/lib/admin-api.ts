import { apiError } from "@/lib/api-utils";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function requireAdminSession() {
  if (await isAdminAuthenticated()) return null;

  return apiError("Akses admin diperlukan.", 401);
}
