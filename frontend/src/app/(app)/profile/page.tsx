"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { avatarSrc, uploadAvatar } from "@/lib/users-api";
import {
  ChevronRightIcon,
  DownloadIcon,
  LockIcon,
  LogoutIcon,
  PencilIcon,
  StarIcon,
  UserIcon,
} from "@/components/icons";
import styles from "./page.module.css";

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  if (!user) return null;

  const onPickAvatar = () => fileInputRef.current?.click();

  const onAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    setUploadingAvatar(true);
    try {
      const updated = await uploadAvatar(file);
      updateUser(updated);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  return (
    <div className={styles.desktopPanel}>
      <div className={styles.avatarSection}>
        <div className={styles.avatarWrap}>
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarSrc(user.avatarUrl) ?? undefined} alt="" className={styles.avatar} />
          ) : (
            <span className={styles.avatarFallback}>{user.fullName.charAt(0) || "?"}</span>
          )}
          <button
            type="button"
            className={styles.avatarEditBtn}
            onClick={onPickAvatar}
            disabled={uploadingAvatar}
            aria-label="เปลี่ยนรูปโปรไฟล์"
          >
            <PencilIcon />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={onAvatarSelected}
          />
        </div>
        <div className={styles.name}>{user.fullName}</div>
        <div className={styles.subLabel}>
          {user.role === "staff" ? "เจ้าหน้าที่หน่วยงาน" : "อสม."} · {user.phone}
        </div>
        {avatarError && <p className="errorText">{avatarError}</p>}
        {uploadingAvatar && <p className={styles.subLabel}>กำลังอัปโหลด...</p>}
      </div>

      <div className={styles.menuList}>
        <Link href="/profile/info" className={`card ${styles.menuItem}`}>
          <span className={styles.menuIcon}>
            <UserIcon />
          </span>
          <span className={styles.menuLabel}>ข้อมูลผู้ใช้งาน</span>
          <span className={styles.menuChevron}>
            <ChevronRightIcon />
          </span>
        </Link>

        <Link href="/profile/edit" className={`card ${styles.menuItem}`}>
          <span className={styles.menuIcon}>
            <PencilIcon />
          </span>
          <span className={styles.menuLabel}>แก้ไขข้อมูล</span>
          <span className={styles.menuChevron}>
            <ChevronRightIcon />
          </span>
        </Link>

        <Link href="/profile/password" className={`card ${styles.menuItem}`}>
          <span className={styles.menuIcon}>
            <LockIcon />
          </span>
          <span className={styles.menuLabel}>เปลี่ยนรหัสผ่าน</span>
          <span className={styles.menuChevron}>
            <ChevronRightIcon />
          </span>
        </Link>

        {user.role === "staff" && (
          <Link href="/profile/export" className={`card ${styles.menuItem}`}>
            <span className={styles.menuIcon}>
              <DownloadIcon />
            </span>
            <span className={styles.menuLabel}>Export Excel</span>
            <span className={styles.menuChevron}>
              <ChevronRightIcon />
            </span>
          </Link>
        )}

        <button
          className={`card ${styles.menuItem}`}
          onClick={() => {
            logout();
            router.replace("/login");
          }}
        >
          <span className={`${styles.menuIcon} ${styles.logoutIcon}`}>
            <LogoutIcon />
          </span>
          <span className={`${styles.menuLabel} ${styles.logoutLabel}`}>ออกจากระบบ</span>
        </button>
      </div>

      <Link href="/survey" className={`card ${styles.surveyCard}`}>
        <span className={styles.surveyIcon}>
          <StarIcon />
        </span>
        <span className={styles.surveyLabel}>แบบประเมินความพึงพอใจต่อการใช้แอปพลิเคชัน</span>
        <span className={styles.menuChevron}>
          <ChevronRightIcon />
        </span>
      </Link>

      <div className={styles.version}>เวอร์ชัน 1.0.0</div>
    </div>
  );
}
