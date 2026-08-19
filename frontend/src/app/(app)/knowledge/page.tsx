"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { listPatients, Patient, RISK_LEVEL_LABEL } from "@/lib/patients-api";
import { UnauthorizedError } from "@/lib/api-client";
import styles from "./page.module.css";

const RISK_BADGE_CLASS: Record<string, string> = {
  low: "badge-success",
  medium: "badge-warning",
  high: "badge-danger",
  very_high: "badge-danger",
};

export default function KnowledgePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await listPatients({ search: search || undefined });
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
  }, [search]);

  return (
    <div>
      <div className={styles.header}>
        <span className={styles.headerTitle}>ชุดความรู้</span>
        {user?.role === "staff" && (
          <Link href="/knowledge/manage" className="btn btn-secondary">
            จัดการเนื้อหา
          </Link>
        )}
      </div>

      <input
        className={`input ${styles.search}`}
        placeholder="ค้นหาชื่อ / รหัสผู้รับบริการ"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className={styles.sectionLabel}>รายชื่อกลุ่มเสี่ยง</div>

      {error && <p className="errorText">{error}</p>}

      {!loading && patients.length === 0 && !error && (
        <div className={`card ${styles.empty}`}>ยังไม่มีรายชื่อกลุ่มเสี่ยง</div>
      )}

      <div className={styles.grid}>
        {patients.map((p) => (
          <Link
            key={p.id}
            href={`/knowledge/patients/${p.id}`}
            className={`card ${styles.patientCard}`}
          >
            <span className={styles.avatar}>{p.fullName.trim().charAt(0) || "?"}</span>
            <div className={styles.patientInfo}>
              <div className={styles.patientName}>{p.fullName}</div>
              <div className={styles.patientMeta}>
                {p.code} · อายุ {p.age} ปี · {p.sex === "male" ? "ชาย" : "หญิง"}
              </div>
            </div>
            {p.riskLevel && (
              <span className={`badge ${RISK_BADGE_CLASS[p.riskLevel]}`}>
                ระดับความเสี่ยง {RISK_LEVEL_LABEL[p.riskLevel]}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
