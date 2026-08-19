"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getPatient, Patient } from "@/lib/patients-api";
import { UnauthorizedError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import {
  ChevronRightIcon,
  ClipboardCheckIcon,
  HistoryIcon,
  PlayCircleIcon,
  BookIcon,
} from "@/components/icons";
import { PatientHeader } from "./PatientHeader";
import sharedStyles from "./shared.module.css";
import styles from "./page.module.css";

export default function KnowledgeInterventionMenuPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const router = useRouter();
  const { logout } = useAuth();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPatient(patientId)
      .then(setPatient)
      .catch((err) => {
        if (err instanceof UnauthorizedError) {
          logout();
          router.replace("/login");
          return;
        }
        setError("ไม่พบข้อมูลผู้รับบริการ");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  return (
    <div>
      <Link href="/knowledge" className={sharedStyles.backLink}>
        <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}>
          <ChevronRightIcon />
        </span>
        ชุดความรู้
      </Link>

      <div className={sharedStyles.title}>ชุดความรู้ 4 Intervention</div>

      {error && <p className="errorText">{error}</p>}

      {patient && (
        <>
          <PatientHeader patient={patient} />

          <div className={styles.menuList}>
            <Link href={`/knowledge/patients/${patientId}/videos`} className={`card ${styles.menuItem}`}>
              <span className={styles.menuIcon}>
                <PlayCircleIcon />
              </span>
              <span className={styles.menuLabel}>วิดีโอให้ความรู้</span>
              <span className={styles.menuChevron}>
                <ChevronRightIcon />
              </span>
            </Link>

            <Link href={`/knowledge/patients/${patientId}/posters`} className={`card ${styles.menuItem}`}>
              <span className={styles.menuIcon}>
                <BookIcon />
              </span>
              <span className={styles.menuLabel}>โปสเตอร์ให้ความรู้</span>
              <span className={styles.menuChevron}>
                <ChevronRightIcon />
              </span>
            </Link>

            <Link href={`/knowledge/patients/${patientId}/record`} className={`card ${styles.menuItem}`}>
              <span className={styles.menuIcon}>
                <ClipboardCheckIcon />
              </span>
              <span className={styles.menuLabel}>บันทึกการให้ความรู้</span>
              <span className={styles.menuChevron}>
                <ChevronRightIcon />
              </span>
            </Link>

            <Link href={`/knowledge/patients/${patientId}/history`} className={`card ${styles.menuItem}`}>
              <span className={styles.menuIcon}>
                <HistoryIcon />
              </span>
              <span className={styles.menuLabel}>ประวัติการให้ความรู้</span>
              <span className={styles.menuChevron}>
                <ChevronRightIcon />
              </span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
