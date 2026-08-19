"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getPatient, Patient } from "@/lib/patients-api";
import {
  KnowledgeSession,
  listKnowledgeSessions,
  RESULT_LABEL,
} from "@/lib/knowledge-sessions-api";
import { UnauthorizedError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { ChevronRightIcon, PlayCircleIcon, BookIcon } from "@/components/icons";
import { PatientHeader } from "../PatientHeader";
import sharedStyles from "../shared.module.css";
import styles from "./page.module.css";

const RESULT_BADGE_CLASS: Record<string, string> = {
  given: "badge-success",
  other: "badge-neutral",
};

function formatThaiDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

export default function KnowledgeHistoryPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const router = useRouter();
  const { logout } = useAuth();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<KnowledgeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getPatient(patientId), listKnowledgeSessions(patientId)])
      .then(([p, s]) => {
        setPatient(p);
        setSessions(s);
      })
      .catch((err) => {
        if (err instanceof UnauthorizedError) {
          logout();
          router.replace("/login");
          return;
        }
        setError("โหลดข้อมูลไม่สำเร็จ");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  return (
    <div>
      <Link href={`/knowledge/patients/${patientId}`} className={sharedStyles.backLink}>
        <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}>
          <ChevronRightIcon />
        </span>
        ชุดความรู้ 4 Intervention
      </Link>

      <div className={sharedStyles.title}>ประวัติการให้ความรู้</div>

      {error && <p className="errorText">{error}</p>}

      {patient && <PatientHeader patient={patient} />}

      {!loading && sessions.length === 0 && !error && (
        <div className={`card ${styles.empty}`}>ยังไม่มีประวัติการให้ความรู้</div>
      )}

      <div className={styles.list}>
        {sessions.map((s) => (
          <div key={s.id} className={`card ${styles.sessionCard}`}>
            <span className={styles.mediaIcon}>
              {s.mediaType === "video" ? <PlayCircleIcon /> : <BookIcon />}
            </span>
            <div className={styles.sessionBody}>
              <div className={styles.sessionTitle}>{s.itemTitleSnapshot}</div>
              <div className={styles.sessionMeta}>{formatThaiDate(s.givenDate)}</div>
              {s.note && <div className={styles.sessionNote}>{s.note}</div>}
            </div>
            <span className={`badge ${RESULT_BADGE_CLASS[s.result]}`}>
              {RESULT_LABEL[s.result]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
