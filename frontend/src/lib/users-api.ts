import { AuthUser } from "./auth";
import { API_URL, authHeaders } from "./api-client";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const message = await res
      .json()
      .then((d) => (Array.isArray(d.message) ? d.message.join(", ") : d.message))
      .catch(() => undefined);
    throw new Error(message ?? "เกิดข้อผิดพลาด กรุณาลองใหม่");
  }
  return res.json();
}

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string;
  email?: string;
  organization?: string;
  position?: string;
}

export async function updateProfile(input: UpdateProfileInput): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/users/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input),
  });
  return handle<AuthUser>(res);
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/users/me/password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return handle<AuthUser>(res);
}

export async function uploadAvatar(file: File): Promise<AuthUser> {
  const formData = new FormData();
  formData.append("avatar", file);
  const res = await fetch(`${API_URL}/users/me/avatar`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  return handle<AuthUser>(res);
}

export function avatarSrc(avatarUrl: string | null) {
  if (!avatarUrl) return null;
  return `${API_URL}${avatarUrl}`;
}

export interface AdminUser extends AuthUser {
  createdAt: string;
  patientCount: number | null;
}

export async function listUsers(): Promise<AdminUser[]> {
  const res = await fetch(`${API_URL}/users`, { headers: authHeaders(), cache: "no-store" });
  return handle<AdminUser[]>(res);
}
