import { apiGet, apiPost, API_URL, authHeaders } from "./api-client";

export type PatientSex = "male" | "female";
export type PatientStatus = "not_screened" | "screened" | "tracking" | "completed";
export type PatientRiskLevel = "low" | "medium" | "high" | "very_high";

export interface Patient {
  id: string;
  code: string;
  fullName: string;
  age: number;
  sex: PatientSex;
  phone: string | null;
  address: string | null;
  treatmentRight: string | null;
  smoker: boolean;
  heightCm: number | null;
  joinDate: string;
  volunteerId: string;
  createdAt: string;
  status: PatientStatus;
  riskLevel: PatientRiskLevel | null;
}

export const RISK_LEVEL_LABEL: Record<PatientRiskLevel, string> = {
  low: "ต่ำ",
  medium: "ปานกลาง",
  high: "สูง",
  very_high: "สูงมาก",
};

export interface CreatePatientInput {
  fullName: string;
  age: number;
  sex: PatientSex;
  phone?: string;
  address?: string;
  treatmentRight?: string;
  smoker?: boolean;
  heightCm?: number;
}

export function listPatients(params: { search?: string; status?: PatientStatus } = {}) {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiGet<Patient[]>(`/patients${suffix}`);
}

export function getPatient(id: string) {
  return apiGet<Patient>(`/patients/${id}`);
}

export function createPatient(input: CreatePatientInput) {
  return apiPost<Patient>("/patients", input);
}

export const STATUS_LABEL: Record<PatientStatus, string> = {
  not_screened: "ยังไม่ได้คัดกรอง",
  screened: "คัดกรองแล้ว",
  tracking: "ให้ความรู้แล้ว",
  completed: "ติดตามครบ 3 ครั้ง",
};

export interface PatientStats {
  total: number;
  byStatus: Record<PatientStatus, number>;
  dueToday: number;
}

export function getPatientStats() {
  return apiGet<PatientStats>("/patients/stats");
}

export interface ExportPreview {
  count: number;
  patients: { id: string; code: string; fullName: string; status: PatientStatus }[];
}

export function previewExport(range?: { from?: string; to?: string }) {
  const qs = new URLSearchParams();
  if (range?.from) qs.set("from", range.from);
  if (range?.to) qs.set("to", range.to);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiGet<ExportPreview>(`/patients/export/preview${suffix}`);
}

export async function downloadPatientsExcel(range?: { from?: string; to?: string }) {
  const qs = new URLSearchParams();
  if (range?.from) qs.set("from", range.from);
  if (range?.to) qs.set("to", range.to);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await fetch(`${API_URL}/patients/export/excel${suffix}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error("ส่งออกข้อมูลไม่สำเร็จ");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "patients-export.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
