"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import BottomNav from "./BottomNav";
import { HeartPulseMark, LogoutIcon } from "./icons";
import styles from "./AppShell.module.css";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>
            <HeartPulseMark />
          </span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>HeartLink</span>
            <span className={styles.brandTagline}>Smart Volunteer Platform</span>
          </span>
        </div>
        <div className={styles.userArea}>
          <span className={styles.userName}>{user?.fullName}</span>
          <button
            className={styles.logoutBtn}
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            aria-label="ออกจากระบบ"
          >
            <LogoutIcon className={styles.logoutIcon} />
            <span className={styles.logoutLabel}>ออกจากระบบ</span>
          </button>
        </div>
      </header>
      <div className={styles.body}>
        <BottomNav />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
