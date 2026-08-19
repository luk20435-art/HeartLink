"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { EyeIcon, EyeOffIcon, HeartPulseLogo, HeartbeatDivider, MailIcon } from "@/components/icons";
import styles from "../auth.module.css";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(identifier, password, remember);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.card} onSubmit={onSubmit}>
        <div className={styles.logo}>
          <HeartPulseLogo className={styles.logoMark} />
          <span className={styles.title}>HeartLink:</span>
          <span className={styles.subtitle}>Smart Volunteer Platform</span>
        </div>

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

        <div className={styles.iconField}>
          <EyeIcon className={styles.fieldIcon} />
          <input
            id="password"
            className={styles.iconInput}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="รหัสผ่าน"
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

        <div className={styles.rememberRow}>
          <label className={styles.rememberLabel}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            จำรหัสผ่าน
          </label>
          <Link href="/forgot-password" className={styles.forgotLink}>
            ลืมรหัสผ่าน?
          </Link>
        </div>

        {error && <p className="errorText">{error}</p>}

        <button type="submit" className={styles.gradientButton} disabled={submitting}>
          {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>

        <p className={styles.footerLink}>
          ยังไม่มีบัญชี? <Link href="/register">ลงทะเบียน</Link>
        </p>
      </form>

      <HeartbeatDivider className={styles.heartbeatDivider} />
    </div>
  );
}
