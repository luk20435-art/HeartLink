"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { AdminUser, avatarSrc, listUsers } from "@/lib/users-api";
import { UnauthorizedError } from "@/lib/api-client";
import styles from "./page.module.css";

export default function UsersAdminPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== "staff") {
      router.replace("/");
      return;
    }
    if (!user) return;
    listUsers()
      .then(setUsers)
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

  const total = users?.length ?? 0;
  const volunteerCount = users?.filter((u) => u.role === "volunteer").length ?? 0;
  const staffCount = users?.filter((u) => u.role === "staff").length ?? 0;

  return (
    <div>
      <div className={styles.headerTitle}>จัดการผู้ใช้งาน</div>

      {error && <p className="errorText">{error}</p>}

      {users && (
        <>
          <div className={styles.statGrid}>
            <div className={`card ${styles.statTile}`}>
              <span className={styles.statValue}>{total}</span>
              <span className={styles.statLabel}>ผู้ใช้งานทั้งหมด</span>
            </div>
            <div className={`card ${styles.statTile}`}>
              <span className={styles.statValue}>{volunteerCount}</span>
              <span className={styles.statLabel}>อสม.</span>
            </div>
            <div className={`card ${styles.statTile}`}>
              <span className={styles.statValue}>{staffCount}</span>
              <span className={styles.statLabel}>เจ้าหน้าที่หน่วยงาน</span>
            </div>
          </div>

          <div className={`card ${styles.tableWrap}`}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ชื่อ-นามสกุล</th>
                  <th>บทบาท</th>
                  <th>เบอร์โทร</th>
                  <th>อีเมล</th>
                  <th>หน่วยงาน / ตำแหน่ง</th>
                  <th>จำนวนผู้ป่วยที่ดูแล</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const src = avatarSrc(u.avatarUrl);
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className={styles.nameCell}>
                          {src ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={src} alt="" className={styles.avatar} />
                          ) : (
                            <span className={styles.avatar}>{u.fullName.charAt(0) || "?"}</span>
                          )}
                          {u.fullName}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${u.role === "staff" ? "badge-neutral" : "badge-success"}`}>
                          {u.role === "staff" ? "เจ้าหน้าที่หน่วยงาน" : "อสม."}
                        </span>
                      </td>
                      <td>{u.phone}</td>
                      <td>{u.email}</td>
                      <td>{[u.organization, u.position].filter(Boolean).join(" / ") || "-"}</td>
                      <td>{u.patientCount ?? "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
