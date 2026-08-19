"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth";
import { HeartPulseLogo, HeartbeatDivider, MailIcon } from "@/components/icons";
import styles from "../auth.module.css";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ message: string; devResetUrl?: string } | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await requestPasswordReset(identifier.trim());
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ส่งคำขอไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <HeartPulseLogo className={styles.logoMark} />
          <span className={styles.title}>ลืมรหัสผ่าน</span>
          <span className={styles.subtitle}>กรอกอีเมลหรือเบอร์โทรศัพท์ที่ใช้สมัครสมาชิก</span>
        </div>

        {!result ? (
          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className={styles.iconField}>
              <MailIcon className={styles.fieldIcon} />
              <input
                id="identifier"
                className={styles.iconInput}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="อีเมล หรือ เบอร์โทรศัพท์"
                required
              />
            </div>

            {error && <p className="errorText">{error}</p>}

            <button type="submit" className={styles.gradientButton} disabled={submitting}>
              {submitting ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
            </button>
          </form>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 14, color: "var(--color-text)" }}>{result.message}</p>
            {result.devResetUrl && (
              <div
                style={{
                  background: "var(--color-warning-bg)",
                  color: "var(--color-warning)",
                  borderRadius: "var(--radius-sm)",
                  padding: 12,
                  fontSize: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <strong>โหมดพัฒนา:</strong> ระบบยังไม่ได้เชื่อมต่อผู้ให้บริการอีเมลจริง จึงแสดงลิงก์ให้กดตรงนี้แทน
                <Link href={result.devResetUrl.replace(/^https?:\/\/[^/]+/, "")} className={styles.forgotLink}>
                  ไปหน้าตั้งรหัสผ่านใหม่
                </Link>
              </div>
            )}
          </div>
        )}

        <p className={styles.footerLink}>
          <Link href="/login">กลับไปหน้าเข้าสู่ระบบ</Link>
        </p>
      </div>

      <HeartbeatDivider className={styles.heartbeatDivider} />
    </div>
  );
}
