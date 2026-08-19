export type CvdRiskLevel = 'low' | 'medium' | 'high' | 'very_high';
export type DtxCategory = 'normal' | 'at_risk' | 'suspected';

export interface CvdRiskInput {
  age: number;
  sex: 'male' | 'female';
  smoker: boolean;
  diabetic: boolean;
  systolicBp: number;
  /** Waist circumference in cm — this app doesn't collect cholesterol, so the
   * official tool's waist-circumference (non-lab) variant is the correct match. */
  waistCm: number;
}

export interface CvdRiskResult {
  /** Raw Cox model linear predictor — a technical value, not a "points" scale. Kept for the audit trail (e.g. Excel export), not meant to be shown to users as the headline number. */
  score: number;
  riskPercent: number;
  level: CvdRiskLevel;
}

/**
 * Official Thai CV Risk Score (Rama-EGAT), non-laboratory / waist-circumference variant —
 * transcribed directly from the published calculator's own source code:
 * https://www.rama.mahidol.ac.th/cardio_vascular_risk/thai_cv_risk_score/scripts/formular.js
 * (function TASCVDformular, the `wc > 0` branch — chosen over the cholesterol and
 * waist-to-height-ratio branches because it matches exactly the data this app already
 * collects: age, sex, smoking, diabetes, systolic BP, waist circumference in cm).
 *
 * This REPLACES the earlier hand-built WHO/ISH-style approximation that was never
 * verified — these coefficients are the real published ones. Per the source tool's own
 * disclaimer, this scoring is intended for Thai adults aged 35-70 without existing
 * cardiovascular disease, and "ไม่สามารถใช้แทนการตัดสินใจของแพทย์ได้" (cannot replace a
 * physician's judgment) — keep surfacing that caveat in the UI/README.
 */
export function computeCvdRisk(input: CvdRiskInput): CvdRiskResult {
  const sex = input.sex === 'male' ? 1 : 0;
  const smoke = input.smoker ? 1 : 0;
  const dm = input.diabetic ? 1 : 0;

  const fullScore =
    0.08372 * input.age +
    0.05988 * sex +
    0.02034 * input.systolicBp +
    0.59953 * dm +
    0.01283 * input.waistCm +
    0.459 * smoke;

  const SURVIVAL_ROOT = 0.964588;
  const BASELINE_CONSTANT = 7.31047;
  const predictedRisk = 1 - Math.pow(SURVIVAL_ROOT, Math.exp(fullScore - BASELINE_CONSTANT));

  const riskPercent = Math.round(predictedRisk * 1000) / 10; // one decimal place
  const level: CvdRiskLevel =
    predictedRisk < 0.1 ? 'low' : predictedRisk < 0.2 ? 'medium' : predictedRisk <= 0.3 ? 'high' : 'very_high';

  return {
    score: Math.round(fullScore * 1000) / 1000,
    riskPercent,
    level,
  };
}

export function classifyDtx(dtx: number): DtxCategory {
  if (dtx >= 126) return 'suspected';
  if (dtx >= 100) return 'at_risk';
  return 'normal';
}
