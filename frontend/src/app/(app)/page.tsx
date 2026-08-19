"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getPatientStats, PatientStats, STATUS_LABEL } from "@/lib/patients-api";
import { UnauthorizedError } from "@/lib/api-client";
import { ClipboardIcon, StarIcon, UserIcon, UsersIcon } from "@/components/icons";
import { StatusDonut } from "@/components/StatusDonut";
import styles from "./page.module.css";

const STATUS_COLOR: Record<string, string> = {
  not_screened: "var(--status-not-screened)",
  screened: "var(--status-screened)",
  tracking: "var(--status-tracking)",
  completed: "var(--status-completed)",
};

const STATUS_ORDER = ["not_screened", "screened", "tracking", "completed"] as const;

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPatientStats()
      .then(setStats)
      .catch((err) => {
        if (err instanceof UnauthorizedError) {
          logout();
          router.replace("/login");
          return;
        }
        setError("โหลดข้อมูลสรุปไม่สำเร็จ");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className={styles.greeting}>สวัสดี, {user?.fullName}</div>
      <div className={styles.sub}>
        {user?.role === "staff" ? "เจ้าหน้าที่หน่วยงาน" : "อาสาสมัครสาธารณสุขประจำหมู่บ้าน"}
      </div>

      {error && <p className="errorText">{error}</p>}

      {stats && (
        <>
          <div className={styles.statGrid}>
            <div className={`card ${styles.statTile}`}>
              <span className={styles.statValue}>{stats.total}</span>
              <span className={styles.statLabel}>กลุ่มเสี่ยงทั้งหมด</span>
            </div>
            {STATUS_ORDER.map((key) => (
              <div key={key} className={`card ${styles.statTile}`}>
                <span className={styles.statValue}>{stats.byStatus[key]}</span>
                <span className={styles.statLabel}>{STATUS_LABEL[key]}</span>
              </div>
            ))}
          </div>

          <div className={`card ${styles.summaryCard}`}>
            <StatusDonut
              total={stats.total}
              centerLabel="คน"
              segments={STATUS_ORDER.map((key) => ({
                key,
                label: STATUS_LABEL[key],
                value: stats.byStatus[key],
                color: STATUS_COLOR[key],
              }))}
            />
            <div className={styles.legend}>
              {STATUS_ORDER.map((key) => {
                const value = stats.byStatus[key];
                const pct = stats.total ? Math.round((value / stats.total) * 100) : 0;
                return (
                  <div key={key} className={styles.legendRow}>
                    <span
                      className={styles.legendSwatch}
                      style={{ background: STATUS_COLOR[key] }}
                    />
                    <span className={styles.legendLabel}>{STATUS_LABEL[key]}</span>
                    <span className={styles.legendValue}>
                      {value} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div className={styles.grid}>
        <Link href="/patients" className={`card ${styles.actionCard}`}>
          <span className={styles.actionIcon}>
            <UsersIcon />
          </span>
          <div>
            <div className={styles.actionTitle}>กลุ่มเสี่ยง</div>
            <div className={styles.actionDesc}>ดูรายชื่อและสถานะการติดตาม</div>
          </div>
        </Link>

        <Link href="/patients/new" className={`card ${styles.actionCard}`}>
          <span className={styles.actionIcon}>
            <ClipboardIcon />
          </span>
          <div>
            <div className={styles.actionTitle}>เพิ่มกลุ่มเสี่ยง</div>
            <div className={styles.actionDesc}>บันทึกผู้รับบริการรายใหม่</div>
          </div>
        </Link>

        {user?.role === "staff" && (
          <Link href="/users" className={`card ${styles.actionCard}`}>
            <span className={styles.actionIcon}>
              <UserIcon />
            </span>
            <div>
              <div className={styles.actionTitle}>จัดการผู้ใช้งาน</div>
              <div className={styles.actionDesc}>ดูจำนวน อสม./เจ้าหน้าที่ และภาระงาน</div>
            </div>
          </Link>
        )}

        {user?.role === "staff" && (
          <Link href="/survey-results" className={`card ${styles.actionCard}`}>
            <span className={styles.actionIcon}>
              <StarIcon />
            </span>
            <div>
              <div className={styles.actionTitle}>แบบประเมินความพึงพอใจ</div>
              <div className={styles.actionDesc}>ดูคะแนนเฉลี่ยและความคิดเห็นจากผู้ใช้งาน</div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
