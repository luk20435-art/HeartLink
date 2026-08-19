"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { changePassword } from "@/lib/users-api";
import { ChevronRightIcon } from "@/components/icons";
import styles from "../detail.module.css";

export default function ProfilePasswordPage() {
  const { user, updateUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmNewPassword) {
      setError("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }

    setSaving(true);
    try {
      const updated = await changePassword(currentPassword, newPassword);
      updateUser(updated);
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.desktopPanel}>
      <Link href="/profile" className={styles.backLink}>
        <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}>
          <ChevronRightIcon />
        </span>
        โปรไฟล์
      </Link>

      <div className={styles.title}>เปลี่ยนรหัสผ่าน</div>

      <form className={`card ${styles.form}`} onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="currentPassword">รหัสผ่านปัจจุบัน</label>
          <input
            id="currentPassword"
            className="input"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="newPassword">รหัสผ่านใหม่</label>
          <input
            id="newPassword"
            className="input"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="confirmNewPassword">ยืนยันรหัสผ่านใหม่</label>
          <input
            id="confirmNewPassword"
            className="input"
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>

        {error && <p className="errorText">{error}</p>}
        {success && <p className={styles.successText}>เปลี่ยนรหัสผ่านเรียบร้อยแล้ว</p>}

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
        </button>
      </form>
    </div>
  );
}
