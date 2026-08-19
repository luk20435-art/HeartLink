"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { updateProfile } from "@/lib/users-api";
import { ChevronRightIcon } from "@/components/icons";
import styles from "../detail.module.css";

export default function ProfileEditPage() {
  const { user, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [organization, setOrganization] = useState(user?.organization ?? "");
  const [position, setPosition] = useState(user?.position ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      const updated = await updateProfile({ fullName, phone, email, organization, position });
      updateUser(updated);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกข้อมูลไม่สำเร็จ");
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

      <div className={styles.title}>แก้ไขข้อมูล</div>

      <form className={`card ${styles.form}`} onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="fullName">ชื่อ-นามสกุล</label>
          <input
            id="fullName"
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="phone">เบอร์โทร</label>
          <input
            id="phone"
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="email">อีเมล</label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="organization">หน่วยงาน</label>
          <input
            id="organization"
            className="input"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="position">ตำแหน่ง</label>
          <input
            id="position"
            className="input"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
        </div>

        {error && <p className="errorText">{error}</p>}
        {success && <p className={styles.successText}>บันทึกข้อมูลเรียบร้อยแล้ว</p>}

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
        </button>
      </form>
    </div>
  );
}
