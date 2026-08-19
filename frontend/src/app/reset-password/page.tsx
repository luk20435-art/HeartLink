"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { confirmPasswordReset } from "@/lib/auth";
import { EyeIcon, EyeOffIcon, HeartPulseLogo, HeartbeatDivider } from "@/components/icons";
import styles from "../auth.module.css";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const identifier = searchParams.get("identifier") ?? "";
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!identifier || !token) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <HeartPulseLogo className={styles.logoMark} />
            <span className={styles.title}>ลิงก์ไม่ถูกต้อง</span>
            <span className={styles.subtitle}>ลิงก์รีเซ็ตรหัสผ่านไม่ครบถ้วนหรือไม่ถูกต้อง</span>
          </div>
          <Link href="/forgot-password" className={styles.gradientButton} style={{ display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
            ขอลิงก์ใหม่
          </Link>
        </div>
        <HeartbeatDivider className={styles.heartbeatDivider} />
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmNewPassword) {
      setError("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }
    setSubmitting(true);
    try {
      await confirmPasswordReset(identifier, token, newPassword);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "รีเซ็ตรหัสผ่านไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <HeartPulseLogo className={styles.logoMark} />
            <span className={styles.title}>ตั้งรหัสผ่านใหม่สำเร็จ</span>
            <span className={styles.subtitle}>เข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที</span>
          </div>
          <button className={styles.gradientButton} onClick={() => router.push("/login")}>
            ไปหน้าเข้าสู่ระบบ
          </button>
        </div>
        <HeartbeatDivider className={styles.heartbeatDivider} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <form className={styles.card} onSubmit={onSubmit}>
        <div className={styles.logo}>
          <HeartPulseLogo className={styles.logoMark} />
          <span className={styles.title}>ตั้งรหัสผ่านใหม่</span>
          <span className={styles.subtitle}>{identifier}</span>
        </div>

        <div className={styles.iconField}>
          <EyeIcon className={styles.fieldIcon} />
          <input
            id="newPassword"
            className={styles.iconInput}
            type={showPassword ? "text" : "password"}
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="รหัสผ่านใหม่"
            required
          />
          <button
            type="button"
            className={styles.eyeToggle}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

        <div className={styles.iconField}>
          <EyeIcon className={styles.fieldIcon} />
          <input
            id="confirmNewPassword"
            className={styles.iconInput}
            type={showPassword ? "text" : "password"}
            minLength={6}
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            placeholder="ยืนยันรหัสผ่านใหม่"
            required
          />
        </div>

        {error && <p className="errorText">{error}</p>}

        <button type="submit" className={styles.gradientButton} disabled={submitting}>
          {submitting ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่"}
        </button>
      </form>

      <HeartbeatDivider className={styles.heartbeatDivider} />
    </div>
  );
}
