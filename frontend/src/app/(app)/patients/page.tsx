"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listPatients, Patient, PatientStatus, STATUS_LABEL } from "@/lib/patients-api";
import { UnauthorizedError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const TABS: { value: PatientStatus | "all"; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "not_screened", label: "ยังไม่ได้คัดกรอง" },
  { value: "screened", label: "คัดกรองแล้ว" },
  { value: "tracking", label: "ให้ความรู้แล้ว" },
  { value: "completed", label: "ติดตามครบ 3 ครั้ง" },
];

const STATUS_BADGE_CLASS: Record<PatientStatus, string> = {
  not_screened: "badge-neutral",
  screened: "badge-warning",
  tracking: "badge-warning",
  completed: "badge-success",
};

export default function PatientsPage() {
  const { logout } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<PatientStatus | "all">("all");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await listPatients({
          search: search || undefined,
          status: tab === "all" ? undefined : tab,
        });
        setPatients(data);
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, tab]);

  const initials = useMemo(
    () => (name: string) => name.trim().charAt(0) || "?",
    [],
  );

  return (
    <div>
      <div className={styles.header}>
        <span className={styles.headerTitle}>กลุ่มเสี่ยง</span>
        <Link href="/patients/new" className="btn btn-primary">
          + เพิ่มรายชื่อ
        </Link>
      </div>

      <div className={styles.toolbar}>
        <input
          className="input"
          placeholder="ค้นหาชื่อ-นามสกุล"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button
              key={t.value}
              className={`${styles.tab} ${tab === t.value ? styles.tabActive : ""}`}
              onClick={() => setTab(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="errorText">{error}</p>}

      {!loading && patients.length === 0 && !error && (
        <div className={`card ${styles.empty}`}>ยังไม่มีรายชื่อกลุ่มเสี่ยงในหมวดนี้</div>
      )}

      <div className={styles.grid}>
        {patients.map((p) => (
          <Link key={p.id} href={`/patients/${p.id}`} className={`card ${styles.patientCard}`}>
            <span className={styles.avatar}>{initials(p.fullName)}</span>
            <div className={styles.patientInfo}>
              <div className={styles.patientName}>{p.fullName}</div>
              <div className={styles.patientMeta}>
                {p.code} · อายุ {p.age} ปี
              </div>
            </div>
            <span className={`badge ${STATUS_BADGE_CLASS[p.status]}`}>
              {STATUS_LABEL[p.status]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
