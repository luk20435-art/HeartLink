"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, UserRole } from "@/lib/auth";
import {
  EyeIcon,
  EyeOffIcon,
  HeartPulseLogo,
  HeartbeatDivider,
  MailIcon,
  PhoneIcon,
  UserIcon,
  UsersIcon,
} from "@/components/icons";
import styles from "../auth.module.css";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("volunteer");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }
    setSubmitting(true);
    try {
      await register({ fullName, phone, email, password, role });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.card} onSubmit={onSubmit}>
        <div className={styles.logo}>
          <HeartPulseLogo className={styles.logoMark} />
          <span className={styles.title}>ลงทะเบียน</span>
          <span className={styles.subtitle}>เลือกบทบาทผู้ใช้งาน</span>
        </div>

        <div className={styles.roleGrid}>
          <button
            type="button"
            className={`${styles.roleCard} ${role === "volunteer" ? styles.roleCardActive : ""}`}
            onClick={() => setRole("volunteer")}
          >
            <UsersIcon />
            อสม.
          </button>
          <button
            type="button"
            className={`${styles.roleCard} ${role === "staff" ? styles.roleCardActive : ""}`}
            onClick={() => setRole("staff")}
          >
            <UserIcon />
            เจ้าหน้าที่หน่วยงาน
          </button>
        </div>

        <div className={styles.iconField}>
          <UserIcon className={styles.fieldIcon} />
          <input
            id="fullName"
            className={styles.iconInput}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="ชื่อ-นามสกุล"
            required
          />
        </div>

        <div className={styles.iconField}>
          <PhoneIcon className={styles.fieldIcon} />
          <input
            id="phone"
            className={styles.iconInput}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="เบอร์โทรศัพท์"
            required
          />
        </div>

        <div className={styles.iconField}>
          <MailIcon className={styles.fieldIcon} />
          <input
            id="email"
            className={styles.iconInput}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="อีเมล"
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
            minLength={6}
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
            id="confirmPassword"
            className={styles.iconInput}
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="ยืนยันรหัสผ่าน"
            minLength={6}
            required
          />
          <button
            type="button"
            className={styles.eyeToggle}
            onClick={() => setShowConfirmPassword((v) => !v)}
            aria-label={showConfirmPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
          >
            {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

        {error && <p className="errorText">{error}</p>}

        <button type="submit" className={styles.gradientButton} disabled={submitting}>
          {submitting ? "กำลังลงทะเบียน..." : "ลงทะเบียน"}
        </button>

        <p className={styles.footerLink}>
          มีบัญชีอยู่แล้ว? <Link href="/login">เข้าสู่ระบบ</Link>
        </p>
      </form>

      <HeartbeatDivider className={styles.heartbeatDivider} />
    </div>
  );
}
