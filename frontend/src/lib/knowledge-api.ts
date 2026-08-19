import { apiGet, API_URL, authHeaders } from "./api-client";

export type KnowledgeType = "video" | "poster";

export interface KnowledgeItem {
  id: string;
  title: string;
  type: KnowledgeType;
  videoUrl: string | null;
  imageUrl: string | null;
  description: string | null;
  createdById: string | null;
  createdAt: string;
}

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

export function listKnowledge() {
  return apiGet<KnowledgeItem[]>("/knowledge");
}

export async function createVideoKnowledge(input: {
  title: string;
  description?: string;
  videoUrl: string;
}) {
  const formData = new FormData();
  formData.append("title", input.title);
  formData.append("type", "video");
  formData.append("videoUrl", input.videoUrl);
  if (input.description) formData.append("description", input.description);
  const res = await fetch(`${API_URL}/knowledge`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  return handle<KnowledgeItem>(res);
}

export async function createPosterKnowledge(input: {
  title: string;
  description?: string;
  file: File;
}) {
  const formData = new FormData();
  formData.append("title", input.title);
  formData.append("type", "poster");
  formData.append("poster", input.file);
  if (input.description) formData.append("description", input.description);
  const res = await fetch(`${API_URL}/knowledge`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  return handle<KnowledgeItem>(res);
}

export async function deleteKnowledge(id: string) {
  const res = await fetch(`${API_URL}/knowledge/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handle<{ deleted: boolean }>(res);
}

export function knowledgeImageSrc(imageUrl: string | null) {
  if (!imageUrl) return null;
  return `${API_URL}${imageUrl}`;
}

export function youtubeEmbedUrl(url: string): string | null {
  const patterns = [
    /youtu\.be\/([\w-]{6,})/,
    /youtube\.com\/watch\?v=([\w-]{6,})/,
    /youtube\.com\/embed\/([\w-]{6,})/,
    /youtube\.com\/shorts\/([\w-]{6,})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
}
