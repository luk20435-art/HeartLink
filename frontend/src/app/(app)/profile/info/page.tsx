"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ChevronRightIcon } from "@/components/icons";
import styles from "../detail.module.css";

export default function ProfileInfoPage() {
  const { user } = useAuth();
  if (!user) return null;

  const rows: [string, string][] = [
    ["ชื่อ-นามสกุล", user.fullName],
    ["บทบาท", user.role === "staff" ? "เจ้าหน้าที่หน่วยงาน" : "อสม."],
    ["เบอร์โทร", user.phone],
    ["อีเมล", user.email],
    ["หน่วยงาน", user.organization || "-"],
    ["ตำแหน่ง", user.position || "-"],
  ];

  return (
    <div className={styles.desktopPanel}>
      <Link href="/profile" className={styles.backLink}>
        <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}>
          <ChevronRightIcon />
        </span>
        โปรไฟล์
      </Link>

      <div className={styles.title}>ข้อมูลผู้ใช้งาน</div>

      <div className={`card ${styles.infoList}`}>
        {rows.map(([label, value]) => (
          <div key={label} className={styles.infoRow}>
            <span className={styles.infoLabel}>{label}</span>
            <span className={styles.infoValue}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
