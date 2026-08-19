"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  listAllSurveys,
  overallAverage,
  questionAverage,
  sectionAverage,
  SURVEY_SECTIONS,
  SurveyResponseWithRespondent,
} from "@/lib/survey-api";
import { UnauthorizedError } from "@/lib/api-client";
import styles from "./page.module.css";

export default function SurveyResultsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [responses, setResponses] = useState<SurveyResponseWithRespondent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== "staff") {
      router.replace("/");
      return;
    }
    if (!user) return;
    listAllSurveys()
      .then(setResponses)
      .catch((err) => {
        if (err instanceof UnauthorizedError) {
          logout();
          router.replace("/login");
          return;
        }
        setError("โหลดข้อมูลไม่สำเร็จ");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user || user.role !== "staff") return null;

  const total = responses?.length ?? 0;
  const grandAverage = overallAverage(responses ?? []);
  const withComment = responses?.filter((r) => r.comment) ?? [];

  return (
    <div>
      <div className={styles.headerTitle}>แบบประเมินความพึงพอใจ</div>

      {error && <p className="errorText">{error}</p>}

      {responses && (
        <>
          <div className={styles.statGrid}>
            <div className={`card ${styles.statTile}`}>
              <span className={styles.statValue}>{total}</span>
              <span className={styles.statLabel}>จำนวนผู้ตอบแบบประเมิน</span>
            </div>
            <div className={`card ${styles.statTile} ${styles.statTileHighlight}`}>
              <span className={styles.statValue}>{total ? grandAverage.toFixed(2) : "-"}</span>
              <span className={styles.statLabel}>คะแนนรวมเฉลี่ย (เต็ม 5, ทั้ง 20 ข้อ)</span>
            </div>
          </div>

          {total === 0 ? (
            <div className={`card ${styles.empty}`}>
              <p>ยังไม่มีผู้ตอบแบบประเมิน</p>
            </div>
          ) : (
            <>
              <div className={styles.sectionAvgGrid}>
                {SURVEY_SECTIONS.map((section) => (
                  <div key={section.title} className={`card ${styles.sectionAvgTile}`}>
                    <span className={styles.sectionAvgValue}>
                      {sectionAverage(section, responses).toFixed(2)}
                    </span>
                    <span className={styles.sectionAvgLabel}>{section.title}</span>
                  </div>
                ))}
              </div>

              <div className={`card ${styles.tableWrap}`}>
                <div className={styles.tableHeader}>คะแนนเฉลี่ยรายข้อ</div>
                <table className={`${styles.table} ${styles.questionTable}`}>
                  <thead>
                    <tr>
                      <th>ข้อ</th>
                      <th>รายการประเมิน</th>
                      <th>คะแนนเฉลี่ย</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SURVEY_SECTIONS.map((section) => (
                      <Fragment key={section.title}>
                        <tr className={styles.sectionRow}>
                          <td colSpan={3}>{section.title}</td>
                        </tr>
                        {section.questions.map((q) => (
                          <tr key={q.key}>
                            <td>{q.no}</td>
                            <td>{q.text}</td>
                            <td>{questionAverage(q.key, responses).toFixed(2)}</td>
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={`card ${styles.tableWrap}`}>
                <div className={styles.tableHeader}>รายชื่อผู้ตอบแบบประเมิน</div>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ผู้ตอบแบบประเมิน</th>
                      <th>บทบาท</th>
                      <th>คะแนนเฉลี่ย</th>
                      <th>วันที่ตอบ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((r) => (
                      <tr key={r.id}>
                        <td>{r.respondent.fullName}</td>
                        <td>
                          <span
                            className={`badge ${r.respondent.role === "staff" ? "badge-neutral" : "badge-success"}`}
                          >
                            {r.respondent.role === "staff" ? "เจ้าหน้าที่หน่วยงาน" : "อสม."}
                          </span>
                        </td>
                        <td>{overallAverage([r]).toFixed(2)} / 5</td>
                        <td>{new Date(r.createdAt).toLocaleDateString("th-TH")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {withComment.length > 0 && (
                <div className={styles.commentSection}>
                  <div className={styles.commentHeader}>ความคิดเห็นเพิ่มเติม</div>
                  <div className={styles.commentList}>
                    {withComment.map((r) => (
                      <div key={r.id} className={`card ${styles.commentCard}`}>
                        <p className={styles.commentText}>{r.comment}</p>
                        <span className={styles.commentMeta}>
                          — {r.respondent.fullName} ·{" "}
                          {new Date(r.createdAt).toLocaleDateString("th-TH")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
