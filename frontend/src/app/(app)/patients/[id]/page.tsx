"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPatient, Patient, PatientStatus, STATUS_LABEL } from "@/lib/patients-api";
import {
  DTX_CATEGORY_LABEL,
  HealthRecord,
  listHealthRecords,
  RISK_LEVEL_LABEL,
  saveHealthRecord,
  SaveHealthRecordInput,
  SelfCareBehavior,
  SELF_CARE_LABEL,
  VISIT_LABEL,
} from "@/lib/health-records-api";
import { UnauthorizedError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import {
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldIcon,
  SmokeOffIcon,
  UserIcon,
} from "@/components/icons";
import styles from "./page.module.css";

const RISK_BADGE_CLASS: Record<string, string> = {
  low: "badge-success",
  medium: "badge-warning",
  high: "badge-danger",
  very_high: "badge-danger",
};

const DTX_BADGE_CLASS: Record<string, string> = {
  normal: "badge-success",
  at_risk: "badge-warning",
  suspected: "badge-danger",
};

const STATUS_BADGE_CLASS: Record<PatientStatus, string> = {
  not_screened: "badge-neutral",
  screened: "badge-warning",
  tracking: "badge-warning",
  completed: "badge-success",
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { logout } = useAuth();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [visit, setVisit] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const [p, r] = await Promise.all([getPatient(id), listHealthRecords(id)]);
      setPatient(p);
      setRecords(r);
      setError(null);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        logout();
        router.replace("/login");
        return;
      }
      setError("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const recordByVisit = useMemo(() => {
    const map = new Map<number, HealthRecord>();
    records.forEach((r) => map.set(r.visitNumber, r));
    return map;
  }, [records]);

  if (loading) return null;
  if (error || !patient) return <p className="errorText">{error ?? "ไม่พบข้อมูล"}</p>;

  const initials = patient.fullName.trim().charAt(0) || "?";

  return (
    <div>
      <div className={`card ${styles.header}`}>
        <div className={styles.headerTop}>
          <span className={styles.avatar}>{initials}</span>
          <div className={styles.headerInfo}>
            <div className={styles.name}>{patient.fullName}</div>
            <div className={styles.badgeRow}>
              <span className={`badge badge-neutral ${styles.codeBadge}`}>{patient.code}</span>
              <span className={styles.metaItem}>
                <ClockIcon className={styles.metaIcon} />
                อายุ {patient.age} ปี
              </span>
              <span className={styles.metaItem}>
                <UserIcon className={styles.metaIcon} />
                {patient.sex === "male" ? "ชาย" : "หญิง"}
              </span>
              <span className={`badge ${STATUS_BADGE_CLASS[patient.status]} ${styles.statusBadge}`}>
                {patient.status !== "not_screened" && <CheckCircleIcon className={styles.metaIcon} />}
                {STATUS_LABEL[patient.status]}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.infoGrid}>
          <div className={styles.infoTile}>
            <span className={`${styles.infoIcon} ${styles.infoIconPink}`}>
              <PhoneIcon />
            </span>
            <div>
              <div className={styles.infoLabel}>เบอร์โทร</div>
              <div className={styles.infoValue}>{patient.phone ?? "-"}</div>
            </div>
          </div>
          <div className={styles.infoTile}>
            <span className={`${styles.infoIcon} ${styles.infoIconPurple}`}>
              <ShieldIcon />
            </span>
            <div>
              <div className={styles.infoLabel}>สิทธิการรักษา</div>
              <div className={styles.infoValue}>{patient.treatmentRight ?? "-"}</div>
            </div>
          </div>
          <div className={styles.infoTile}>
            <span className={`${styles.infoIcon} ${styles.infoIconPurple}`}>
              <SmokeOffIcon />
            </span>
            <div>
              <div className={styles.infoLabel}>สูบบุหรี่</div>
              <div className={styles.infoValue}>{patient.smoker ? "สูบ" : "ไม่สูบ"}</div>
            </div>
          </div>
        </div>

        <div className={`${styles.infoTile} ${styles.addressTile}`}>
          <span className={`${styles.infoIcon} ${styles.infoIconTeal}`}>
            <MapPinIcon />
          </span>
          <div>
            <div className={styles.infoLabel}>ที่อยู่</div>
            <div className={styles.infoValue}>{patient.address ?? "-"}</div>
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        {[1, 2, 3, 4].map((v) => (
          <button
            key={v}
            className={`${styles.tab} ${visit === v ? styles.tabActive : ""} ${
              recordByVisit.has(v) ? styles.tabDone : ""
            }`}
            onClick={() => setVisit(v)}
          >
            {recordByVisit.has(v) ? "✓ " : ""}
            {VISIT_LABEL[v]}
          </button>
        ))}
      </div>

      <div className="card">
        <VisitForm
          key={visit}
          patient={patient}
          visitNumber={visit}
          existing={recordByVisit.get(visit) ?? null}
          onSaved={(record) => {
            setRecords((prev) => [...prev.filter((r) => r.visitNumber !== record.visitNumber), record]);
            load();
          }}
        />
      </div>
    </div>
  );
}

function VisitForm({
  patient,
  visitNumber,
  existing,
  onSaved,
}: {
  patient: Patient;
  visitNumber: number;
  existing: HealthRecord | null;
  onSaved: (record: HealthRecord) => void;
}) {
  const hasSelfCare = visitNumber >= 2;
  const has2Q = visitNumber === 1;

  const blank = {
    visitDate: todayIso(),
    weightKg: "",
    systolicBp: "",
    diastolicBp: "",
    heartRate: "",
    waistCm: "",
    dtxFpg: "",
    selfCareBehavior: "same" as SelfCareBehavior,
    notes: "",
    q1Depressed: false,
    q2Anhedonia: false,
  };

  const [visitDate, setVisitDate] = useState(existing?.visitDate ?? blank.visitDate);
  const [weightKg, setWeightKg] = useState(existing?.weightKg?.toString() ?? "");
  const [systolicBp, setSystolicBp] = useState(existing?.systolicBp?.toString() ?? "");
  const [diastolicBp, setDiastolicBp] = useState(existing?.diastolicBp?.toString() ?? "");
  const [heartRate, setHeartRate] = useState(existing?.heartRate?.toString() ?? "");
  const [waistCm, setWaistCm] = useState(existing?.waistCm?.toString() ?? "");
  const [dtxFpg, setDtxFpg] = useState(existing?.dtxFpg?.toString() ?? "");
  const [selfCareBehavior, setSelfCareBehavior] = useState<SelfCareBehavior>(
    existing?.selfCareBehavior ?? blank.selfCareBehavior,
  );
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [q1Depressed, setQ1Depressed] = useState(existing?.q1Depressed ?? false);
  const [q2Anhedonia, setQ2Anhedonia] = useState(existing?.q2Anhedonia ?? false);

  const [saved, setSaved] = useState<HealthRecord | null>(existing);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onClear = () => {
    setVisitDate(blank.visitDate);
    setWeightKg(blank.weightKg);
    setSystolicBp(blank.systolicBp);
    setDiastolicBp(blank.diastolicBp);
    setHeartRate(blank.heartRate);
    setWaistCm(blank.waistCm);
    setDtxFpg(blank.dtxFpg);
    setSelfCareBehavior(blank.selfCareBehavior);
    setNotes(blank.notes);
    setQ1Depressed(blank.q1Depressed);
    setQ2Anhedonia(blank.q2Anhedonia);
    setError(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const input: SaveHealthRecordInput = {
        visitDate,
        weightKg: weightKg ? Number(weightKg) : undefined,
        systolicBp: systolicBp ? Number(systolicBp) : undefined,
        diastolicBp: diastolicBp ? Number(diastolicBp) : undefined,
        heartRate: heartRate ? Number(heartRate) : undefined,
        waistCm: waistCm ? Number(waistCm) : undefined,
        dtxFpg: dtxFpg ? Number(dtxFpg) : undefined,
        notes: notes.trim() || undefined,
      };
      if (hasSelfCare) {
        input.selfCareBehavior = selfCareBehavior;
      }
      if (has2Q) {
        input.q1Depressed = q1Depressed;
        input.q2Anhedonia = q2Anhedonia;
      }
      const record = await saveHealthRecord(patient.id, visitNumber, input);
      setSaved(record);
      onSaved(record);
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className={styles.formGrid}>
        <div className="field">
          <label>วันที่รับบริการ</label>
          <input
            className="input"
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>น้ำหนัก (กก.)</label>
          <input
            className="input"
            type="number"
            step="0.1"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
          />
        </div>
        <div className="field">
          <label>ความดันโลหิต ตัวบน (SBP)</label>
          <input
            className="input"
            type="number"
            value={systolicBp}
            onChange={(e) => setSystolicBp(e.target.value)}
          />
        </div>
        <div className="field">
          <label>ความดันโลหิต ตัวล่าง (DBP)</label>
          <input
            className="input"
            type="number"
            value={diastolicBp}
            onChange={(e) => setDiastolicBp(e.target.value)}
          />
        </div>
        <div className="field">
          <label>อัตราเต้นหัวใจ (ครั้ง/นาที)</label>
          <input
            className="input"
            type="number"
            value={heartRate}
            onChange={(e) => setHeartRate(e.target.value)}
          />
        </div>
        <div className="field">
          <label>เส้นรอบเอว (ซม.)</label>
          <input
            className="input"
            type="number"
            step="0.1"
            value={waistCm}
            onChange={(e) => setWaistCm(e.target.value)}
          />
        </div>
        <div className="field">
          <label>น้ำตาล DTX/FPG (mg/dl)</label>
          <input
            className="input"
            type="number"
            value={dtxFpg}
            onChange={(e) => setDtxFpg(e.target.value)}
          />
        </div>
        {hasSelfCare && (
          <div className="field">
            <label>พฤติกรรมการดูแลตนเอง</label>
            <select
              className="select"
              value={selfCareBehavior}
              onChange={(e) => setSelfCareBehavior(e.target.value as SelfCareBehavior)}
            >
              {(Object.keys(SELF_CARE_LABEL) as SelfCareBehavior[]).map((k) => (
                <option key={k} value={k}>
                  {SELF_CARE_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className={`field ${styles.fullSpan}`}>
          <label>หมายเหตุ</label>
          <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      {has2Q && (
        <div className={styles.fullSpan} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="field">
            <label>ใน 2 สัปดาห์ที่ผ่านมารวมถึงวันนี้ ท่านรู้สึกหดหู่ เศร้า หรือท้อแท้สิ้นหวังหรือไม่</label>
            <div className={styles.radioRow}>
              <label>
                <input
                  type="radio"
                  checked={q1Depressed}
                  onChange={() => setQ1Depressed(true)}
                />
                มี
              </label>
              <label>
                <input
                  type="radio"
                  checked={!q1Depressed}
                  onChange={() => setQ1Depressed(false)}
                />
                ไม่มี
              </label>
            </div>
          </div>
          <div className="field">
            <label>ใน 2 สัปดาห์ที่ผ่านมารวมถึงวันนี้ ท่านรู้สึกเบื่อ ทำอะไรก็ไม่เพลิดเพลินหรือไม่</label>
            <div className={styles.radioRow}>
              <label>
                <input
                  type="radio"
                  checked={q2Anhedonia}
                  onChange={() => setQ2Anhedonia(true)}
                />
                มี
              </label>
              <label>
                <input
                  type="radio"
                  checked={!q2Anhedonia}
                  onChange={() => setQ2Anhedonia(false)}
                />
                ไม่มี
              </label>
            </div>
          </div>
        </div>
      )}

      {error && <p className="errorText">{error}</p>}

      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "กำลังบันทึก..." : "บันทึก"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onClear} disabled={submitting}>
          ล้างข้อมูล
        </button>
      </div>

      {saved && (
        <div className={styles.resultBox}>
          {saved.bmi != null && (
            <div className={styles.resultItem}>
              <span className={styles.resultLabel}>BMI</span>
              <span className={styles.resultValue}>{saved.bmi}</span>
            </div>
          )}
          {saved.cvdRiskPercent != null && saved.cvdRiskLevel && (
            <div className={styles.resultItem}>
              <span className={styles.resultLabel}>ความเสี่ยง CVD ใน 10 ปี</span>
              <span className={styles.resultValue}>{saved.cvdRiskPercent}%</span>
              <span className={`badge ${RISK_BADGE_CLASS[saved.cvdRiskLevel]}`}>
                {RISK_LEVEL_LABEL[saved.cvdRiskLevel]}
              </span>
            </div>
          )}
          {saved.dtxCategory && (
            <div className={styles.resultItem}>
              <span className={styles.resultLabel}>ผล DTX/FPG หลังปรับเปลี่ยนพฤติกรรม</span>
              <span className={`badge ${DTX_BADGE_CLASS[saved.dtxCategory]}`}>
                {DTX_CATEGORY_LABEL[saved.dtxCategory]}
              </span>
            </div>
          )}
          {has2Q && (
            <div className={styles.resultItem}>
              <span className={styles.resultLabel}>แบบประเมิน 2Q</span>
              <span
                className={`badge ${q1Depressed || q2Anhedonia ? "badge-danger" : "badge-success"}`}
              >
                {q1Depressed || q2Anhedonia ? "มีความเสี่ยง" : "ปกติ"}
              </span>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
