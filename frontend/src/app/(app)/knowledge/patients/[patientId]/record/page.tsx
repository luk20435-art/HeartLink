"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getPatient, Patient } from "@/lib/patients-api";
import { KnowledgeItem, KnowledgeType, listKnowledge } from "@/lib/knowledge-api";
import { createKnowledgeSession, KnowledgeSessionResult } from "@/lib/knowledge-sessions-api";
import { UnauthorizedError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { ChevronRightIcon } from "@/components/icons";
import { PatientHeader } from "../PatientHeader";
import sharedStyles from "../shared.module.css";
import styles from "./page.module.css";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function KnowledgeRecordPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const router = useRouter();
  const { logout } = useAuth();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [givenDate, setGivenDate] = useState(todayIso());
  const [mediaType, setMediaType] = useState<KnowledgeType>("video");
  const [knowledgeItemId, setKnowledgeItemId] = useState("");
  const [result, setResult] = useState<KnowledgeSessionResult>("given");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    Promise.all([getPatient(patientId), listKnowledge()])
      .then(([p, allItems]) => {
        setPatient(p);
        setItems(allItems);
      })
      .catch((err) => {
        if (err instanceof UnauthorizedError) {
          logout();
          router.replace("/login");
          return;
        }
        setLoadError("โหลดข้อมูลไม่สำเร็จ");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const itemsForType = items.filter((i) => i.type === mediaType);

  useEffect(() => {
    // reset the selected topic whenever the media type changes, since the
    // options list itself changes
    setKnowledgeItemId("");
  }, [mediaType]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!knowledgeItemId) {
      setError("กรุณาเลือกโครงการ/หัวข้อที่ให้ความรู้");
      return;
    }
    setSubmitting(true);
    try {
      await createKnowledgeSession(patientId, {
        givenDate,
        mediaType,
        knowledgeItemId,
        result,
        note: result === "other" ? note.trim() || undefined : undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div>
        <div className={`card ${styles.thankYou}`}>
          <span className={styles.thankYouIcon}>✅</span>
          <div style={{ fontWeight: 700 }}>บันทึกการให้ความรู้เรียบร้อยแล้ว</div>
          <div className={styles.thankYouActions}>
            <Link href={`/knowledge/patients/${patientId}/history`} className="btn btn-secondary">
              ดูประวัติ
            </Link>
            <Link href={`/knowledge/patients/${patientId}`} className="btn btn-primary">
              กลับเมนู
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link href={`/knowledge/patients/${patientId}`} className={sharedStyles.backLink}>
        <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}>
          <ChevronRightIcon />
        </span>
        ชุดความรู้ 4 Intervention
      </Link>

      <div className={sharedStyles.title}>บันทึกการให้ความรู้</div>

      {loadError && <p className="errorText">{loadError}</p>}

      {patient && (
        <>
          <PatientHeader patient={patient} />

          <form onSubmit={onSubmit} className={`card ${styles.form}`}>
            <div className="field">
              <label htmlFor="givenDate">วันที่ให้ความรู้</label>
              <input
                id="givenDate"
                className="input"
                type="date"
                value={givenDate}
                onChange={(e) => setGivenDate(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>สื่อที่ใช้</label>
              <div className={styles.radioRow}>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="mediaType"
                    checked={mediaType === "video"}
                    onChange={() => setMediaType("video")}
                  />
                  วิดีโอให้ความรู้
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="mediaType"
                    checked={mediaType === "poster"}
                    onChange={() => setMediaType("poster")}
                  />
                  โปสเตอร์ให้ความรู้
                </label>
              </div>
            </div>

            <div className="field">
              <label htmlFor="knowledgeItemId">โครงการ/หัวข้อที่ให้ความรู้</label>
              <select
                id="knowledgeItemId"
                className="select"
                value={knowledgeItemId}
                onChange={(e) => setKnowledgeItemId(e.target.value)}
                required
              >
                <option value="" disabled>
                  เลือกหัวข้อ
                </option>
                {itemsForType.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.title}
                  </option>
                ))}
              </select>
              {itemsForType.length === 0 && (
                <p className={styles.hint}>
                  ยังไม่มีเนื้อหาประเภทนี้ — ไปที่ &quot;จัดการเนื้อหา&quot; เพื่อเพิ่มก่อน
                </p>
              )}
            </div>

            <div className="field">
              <label>ผลการให้ความรู้</label>
              <div className={styles.radioColumn}>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="result"
                    checked={result === "given"}
                    onChange={() => setResult("given")}
                  />
                  ให้ความรู้แล้ว
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="result"
                    checked={result === "other"}
                    onChange={() => setResult("other")}
                  />
                  อื่นๆ
                </label>
              </div>
              {result === "other" && (
                <textarea
                  className="textarea"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="ไม่บังคับใส่"
                  style={{ marginTop: 8 }}
                />
              )}
            </div>

            {error && <p className="errorText">{error}</p>}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || itemsForType.length === 0}
            >
              {submitting ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
