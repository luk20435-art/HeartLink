import { apiGet, apiPost } from "./api-client";
import { KnowledgeType } from "./knowledge-api";

export type KnowledgeSessionResult = "given" | "other";

export interface KnowledgeSession {
  id: string;
  patientId: string;
  volunteerId: string | null;
  givenDate: string;
  mediaType: KnowledgeType;
  knowledgeItemId: string | null;
  itemTitleSnapshot: string;
  result: KnowledgeSessionResult;
  note: string | null;
  createdAt: string;
}

export interface CreateKnowledgeSessionInput {
  givenDate: string;
  mediaType: KnowledgeType;
  knowledgeItemId: string;
  result: KnowledgeSessionResult;
  note?: string;
}

export function listKnowledgeSessions(patientId: string) {
  return apiGet<KnowledgeSession[]>(`/patients/${patientId}/knowledge-sessions`);
}

export function createKnowledgeSession(patientId: string, input: CreateKnowledgeSessionInput) {
  return apiPost<KnowledgeSession>(`/patients/${patientId}/knowledge-sessions`, input);
}

export const RESULT_LABEL: Record<KnowledgeSessionResult, string> = {
  given: "ให้ความรู้แล้ว",
  other: "อื่นๆ",
};
