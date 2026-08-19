"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SURVEY_SECTIONS, SubmitSurveyInput, submitSurvey } from "@/lib/survey-api";
import styles from "./page.module.css";

function RatingRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className={styles.ratingRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`${styles.ratingBtn} ${value === n ? styles.ratingBtnActive : ""}`}
          onClick={() => onChange(n)}
          aria-label={`ระดับ ${n}`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

const RATING_SCALE = [
  { n: 5, label: "ดีที่สุด" },
  { n: 4, label: "ดีมาก" },
  { n: 3, label: "ดี" },
  { n: 2, label: "พอใช้" },
  { n: 1, label: "ควรปรับปรุง" },
];

export default function SurveyPage() {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const setScore = (key: string, value: number) => setScores((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const allKeys = SURVEY_SECTIONS.flatMap((s) => s.questions.map((q) => q.key));
    const missing = allKeys.some((key) => !scores[key]);
    if (missing) {
      setError("กรุณาให้คะแนนทุกข้อ");
      return;
    }

    setSubmitting(true);
    try {
      const input = { ...scores, comment: comment.trim() || undefined } as SubmitSurveyInput;
      await submitSurvey(input);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ส่งแบบประเมินไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={styles.desktopPanel}>
        <div className={`card ${styles.thankYou} ${styles.innerCard}`}>
          <span className={styles.thankYouIcon}>🙏</span>
          <div style={{ fontWeight: 700 }}>ขอบคุณสำหรับความคิดเห็น</div>
          <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
            ความคิดเห็นของท่านจะช่วยให้เราพัฒนาแอปพลิเคชันให้ดียิ่งขึ้น
          </p>
          <button className="btn btn-secondary" onClick={() => router.push("/profile")}>
            กลับไปหน้าโปรไฟล์
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.desktopPanel}>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
        แบบประเมินประสิทธิผลและความพึงพอใจต่อการใช้แอปพลิเคชัน
      </h1>
      <p className={styles.subtitle}>HeartLink : Smart Volunteer Platform</p>

      <div className={`card ${styles.legendCard} ${styles.innerCard}`}>
        <div className={styles.legendTitle}>เกณฑ์การให้คะแนน</div>
        <div className={styles.legendGrid}>
          {RATING_SCALE.map(({ n, label }) => (
            <div key={n} className={styles.legendItem}>
              <span className={styles.legendNum}>{n}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit} className={styles.form}>
        {SURVEY_SECTIONS.map((section) => (
          <div key={section.title} className={`card ${styles.sectionCard} ${styles.innerCard}`}>
            <div className={styles.sectionTitle}>{section.title}</div>
            <div className={styles.questionList}>
              {section.questions.map((q) => (
                <div key={q.key} className={styles.questionRow}>
                  <div className={styles.questionText}>
                    {q.no}. {q.text}
                  </div>
                  <RatingRow value={scores[q.key] ?? 0} onChange={(v) => setScore(q.key, v)} />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className={`card ${styles.innerCard} ${styles.commentCard}`}>
          <div className="field">
            <label>ความคิดเห็นเพิ่มเติม (ถ้ามี)</label>
            <textarea className="textarea" value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
        </div>

        {error && <p className="errorText">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "กำลังส่ง..." : "ส่งแบบประเมิน"}
        </button>
      </form>
    </div>
  );
}
