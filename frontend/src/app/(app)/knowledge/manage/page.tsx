"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { listKnowledge } from "@/lib/knowledge-api";
import { BookIcon, ChevronRightIcon, PlayCircleIcon } from "@/components/icons";
import styles from "./page.module.css";

export default function KnowledgeManagePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [counts, setCounts] = useState<{ poster: number; video: number } | null>(null);

  useEffect(() => {
    if (user && user.role !== "staff") {
      router.replace("/knowledge");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user || user.role !== "staff") return;
    listKnowledge()
      .then((items) => {
        setCounts({
          poster: items.filter((i) => i.type === "poster").length,
          video: items.filter((i) => i.type === "video").length,
        });
      })
      .catch(() => setCounts({ poster: 0, video: 0 }));
  }, [user]);

  if (!user || user.role !== "staff") return null;

  return (
    <div>
      <Link href="/knowledge" className={styles.backLink}>
        <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}>
          <ChevronRightIcon />
        </span>
        ชุดความรู้
      </Link>

      <div className={styles.headerTitle}>จัดการเนื้อหา</div>

      <div className={styles.list}>
        <Link href="/knowledge/media" className={`card ${styles.categoryCard}`}>
          <span className={`${styles.iconBadge} ${styles.iconBadgeMedia}`}>
            <BookIcon />
          </span>
          <div className={styles.categoryBody}>
            <div className={styles.categoryTitle}>สื่อความรู้</div>
            <div className={styles.categoryDesc}>
              เรียนรู้ความรู้ที่เป็นประโยชน์{counts ? ` · ${counts.poster} รายการ` : ""}
            </div>
          </div>
          <span className={styles.categoryChevron}>
            <ChevronRightIcon />
          </span>
        </Link>

        <Link href="/knowledge/videos" className={`card ${styles.categoryCard}`}>
          <span className={`${styles.iconBadge} ${styles.iconBadgeVideo}`}>
            <PlayCircleIcon />
          </span>
          <div className={styles.categoryBody}>
            <div className={styles.categoryTitle}>วิดีโอ</div>
            <div className={styles.categoryDesc}>
              ดูวิดีโอความรู้เพื่อสุขภาพ{counts ? ` · ${counts.video} รายการ` : ""}
            </div>
          </div>
          <span className={styles.categoryChevron}>
            <ChevronRightIcon />
          </span>
        </Link>
      </div>
    </div>
  );
}
