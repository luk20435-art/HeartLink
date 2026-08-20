import { apiGet, apiPut } from "./api-client";

export type CvdRiskLevel = "low" | "medium" | "high" | "very_high";
export type DtxCategory = "normal" | "at_risk" | "suspected";
export type SelfCareBehavior = "good" | "needs_improvement";

export interface HealthRecord {
  id: string;
  patientId: string;
  visitNumber: number;
  visitDate: string;
  weightKg: number | null;
  bmi: number | null;
  systolicBp: number | null;
  diastolicBp: number | null;
  heartRate: number | null;
  waistCm: number | null;
  dtxFpg: number | null;
  dtxCategory: DtxCategory | null;
  cvdScore: number | null;
  cvdRiskPercent: number | null;
  cvdRiskLevel: CvdRiskLevel | null;
  selfCareBehavior: SelfCareBehavior | null;
  notes: string | null;
  q1Depressed: boolean | null;
  q2Anhedonia: boolean | null;
  createdAt: string;
}

export interface SaveHealthRecordInput {
  visitDate: string;
  weightKg?: number;
  systolicBp?: number;
  diastolicBp?: number;
  heartRate?: number;
  waistCm?: number;
  dtxFpg?: number;
  selfCareBehavior?: SelfCareBehavior;
  notes?: string;
  q1Depressed?: boolean;
  q2Anhedonia?: boolean;
}

export function listHealthRecords(patientId: string) {
  return apiGet<HealthRecord[]>(`/patients/${patientId}/health-records`);
}

export function saveHealthRecord(
  patientId: string,
  visitNumber: number,
  input: SaveHealthRecordInput,
) {
  return apiPut<HealthRecord>(`/patients/${patientId}/health-records/${visitNumber}`, input);
}

export const RISK_LEVEL_LABEL: Record<CvdRiskLevel, string> = {
  low: "เสี่ยงน้อย",
  medium: "เสี่ยงปานกลาง",
  high: "เสี่ยงสูง",
  very_high: "เสี่ยงสูงมาก",
};

export const DTX_CATEGORY_LABEL: Record<DtxCategory, string> = {
  normal: "ปกติ",
  at_risk: "เสี่ยง",
  suspected: "สงสัยป่วย",
};

export const SELF_CARE_LABEL: Record<SelfCareBehavior, string> = {
  good: "พฤติกรรมการดูแลตนเองดี",
  needs_improvement: "พฤติกรรมการดูแลตนเองต้องปรับปรุง",
};

export const VISIT_LABEL: Record<number, string> = {
  1: "ก่อนเข้าร่วมโครงการ",
  2: "ติดตามครั้งที่ 1",
  3: "ติดตามครั้งที่ 2",
  4: "ติดตามครั้งที่ 3",
};
