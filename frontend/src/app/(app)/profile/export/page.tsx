"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  downloadPatientsExcel,
  ExportPreview,
  previewExport,
  STATUS_LABEL,
  PatientStatus,
} from "@/lib/patients-api";
import { ChevronRightIcon } from "@/components/icons";
import detailStyles from "../detail.module.css";
import styles from "./page.module.css";

const STATUS_BADGE_CLASS: Record<PatientStatus, string> = {
  not_screened: "badge-neutral",
  screened: "badge-warning",
  tracking: "badge-warning",
  completed: "badge-success",
};

export default function ProfileExportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [preview, setPreview] = useState<ExportPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== "staff") {
      router.replace("/");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user || user.role !== "staff") return;
    setLoadingPreview(true);
    setPreviewError(null);
    const timeout = setTimeout(async () => {
      try {
        const data = await previewExport({ from: from || undefined, to: to || undefined });
        setPreview(data);
      } catch {
        setPreviewError("โหลดข้อมูลตัวอย่างไม่สำเร็จ");
      } finally {
        setLoadingPreview(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [user, from, to]);

  if (!user || user.role !== "staff") return null;

  const onExport = async () => {
    setExportError(null);
    setExporting(true);
    try {
      await downloadPatientsExcel({ from: from || undefined, to: to || undefined });
    } catch {
      setExportError("ส่งออกข้อมูลไม่สำเร็จ");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={detailStyles.desktopPanel}>
      <Link href="/profile" className={detailStyles.backLink}>
        <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}>
          <ChevronRightIcon />
        </span>
        โปรไฟล์
      </Link>

      <div className={styles.header}>
        <span className={styles.headerTitle}>Export Excel</span>
        <button
          className={`btn btn-primary ${styles.headerExportBtn}`}
          onClick={onExport}
          disabled={exporting || loadingPreview || !preview || preview.count === 0}
        >
          {exporting ? "กำลังส่งออก..." : "ดาวน์โหลด Excel"}
        </button>
      </div>

      {exportError && <p className="errorText">{exportError}</p>}

      <div className={`card ${styles.rangeCard}`}>
        <div className={styles.rangeRow}>
          <div className="field">
            <label htmlFor="exportFrom">ตั้งแต่วันที่</label>
            <input
              id="exportFrom"
              className="input"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              max={to || undefined}
            />
          </div>
          <div className="field">
            <label htmlFor="exportTo">ถึงวันที่</label>
            <input
              id="exportTo"
              className="input"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              min={from || undefined}
            />
          </div>
        </div>
        <p className={styles.hint}>เว้นว่างไว้เพื่อส่งออกข้อมูลทั้งหมด</p>
      </div>

      <div className={styles.previewSection}>
        {loadingPreview && <p className={styles.hint}>กำลังตรวจสอบข้อมูล...</p>}
        {previewError && <p className="errorText">{previewError}</p>}

        {!loadingPreview && preview && (
          <>
            <div className={styles.previewSummary}>
              {preview.count === 0
                ? "ไม่พบข้อมูลในช่วงวันที่นี้"
                : from || to
                  ? `พบข้อมูล ${preview.count} คนในช่วงที่เลือก`
                  : `พบข้อมูลทั้งหมด ${preview.count} คน`}
            </div>

            {preview.count > 0 && (
              <div className={styles.previewList}>
                {preview.patients.map((p) => (
                  <div key={p.id} className={styles.previewRow}>
                    <span className={styles.previewCode}>{p.code}</span>
                    <span className={styles.previewName}>{p.fullName}</span>
                    <span className={`badge ${STATUS_BADGE_CLASS[p.status]}`}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
