import { Patient, RISK_LEVEL_LABEL } from "@/lib/patients-api";
import styles from "./shared.module.css";

const RISK_BADGE_CLASS: Record<string, string> = {
  low: "badge-success",
  medium: "badge-warning",
  high: "badge-danger",
  very_high: "badge-danger",
};

export function PatientHeader({ patient }: { patient: Patient }) {
  return (
    <div className={`card ${styles.patientHeader}`}>
      <span className={styles.avatar}>{patient.fullName.trim().charAt(0) || "?"}</span>
      <div className={styles.info}>
        <div className={styles.name}>{patient.fullName}</div>
        <div className={styles.meta}>
          {patient.code} · อายุ {patient.age} ปี · {patient.sex === "male" ? "ชาย" : "หญิง"}
        </div>
      </div>
      {patient.riskLevel && (
        <span className={`badge ${RISK_BADGE_CLASS[patient.riskLevel]}`}>
          ระดับความเสี่ยง {RISK_LEVEL_LABEL[patient.riskLevel]}
        </span>
      )}
    </div>
  );
}
