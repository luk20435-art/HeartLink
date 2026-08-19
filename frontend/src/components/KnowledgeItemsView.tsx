"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  createPosterKnowledge,
  createVideoKnowledge,
  deleteKnowledge,
  knowledgeImageSrc,
  KnowledgeItem,
  KnowledgeType,
  listKnowledge,
  youtubeEmbedUrl,
} from "@/lib/knowledge-api";
import { BookIcon, ChevronRightIcon, CloseIcon, PlayCircleIcon } from "./icons";
import styles from "./KnowledgeItemsView.module.css";

export function KnowledgeItemsView({
  type,
  title,
  allowManage = true,
  backHref = "/knowledge",
  backLabel = "ชุดความรู้",
}: {
  type: KnowledgeType;
  title: string;
  /** Hide the staff add/delete controls — used when browsing content from within a patient's record, where content management lives elsewhere. */
  allowManage?: boolean;
  backHref?: string;
  backLabel?: string;
}) {
  const { user } = useAuth();
  const isStaff = user?.role === "staff" && allowManage;

  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<KnowledgeItem | null>(null);
  const [brokenThumbIds, setBrokenThumbIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!viewingItem) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewingItem(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [viewingItem]);

  const [showForm, setShowForm] = useState(false);
  const [itemTitle, setItemTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    listKnowledge()
      .then((all) => setItems(all.filter((i) => i.type === type)))
      .catch(() => setError("โหลดข้อมูลไม่สำเร็จ"))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [type]);

  const resetForm = () => {
    setItemTitle("");
    setDescription("");
    setVideoUrl("");
    setFile(null);
    setFormError(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      if (type === "video") {
        if (!videoUrl.trim()) throw new Error("กรุณาระบุลิงก์วิดีโอ");
        await createVideoKnowledge({
          title: itemTitle.trim(),
          description: description.trim() || undefined,
          videoUrl: videoUrl.trim(),
        });
      } else {
        if (!file) throw new Error("กรุณาเลือกไฟล์รูปโปสเตอร์");
        await createPosterKnowledge({
          title: itemTitle.trim(),
          description: description.trim() || undefined,
          file,
        });
      }
      resetForm();
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("ต้องการลบเนื้อหานี้หรือไม่?")) return;
    await deleteKnowledge(id);
    load();
  };

  const viewingEmbedUrl = viewingItem?.videoUrl ? youtubeEmbedUrl(viewingItem.videoUrl) : null;

  return (
    <div>
      <Link href={backHref} className={styles.backLink}>
        <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}>
          <ChevronRightIcon />
        </span>
        {backLabel}
      </Link>

      <div className={styles.header}>
        <span className={styles.headerTitle}>{title}</span>
        {isStaff && (
          <button className="btn btn-secondary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "ยกเลิก" : "+ เพิ่มเนื้อหา"}
          </button>
        )}
      </div>

      {isStaff && showForm && (
        <form onSubmit={onSubmit} className={`card ${styles.formCard}`}>
          <div className="field">
            <label>ชื่อเรื่อง</label>
            <input className="input" value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} required />
          </div>

          {type === "video" ? (
            <div className="field">
              <label>ลิงก์วิดีโอ (YouTube)</label>
              <input
                className="input"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                required
              />
            </div>
          ) : (
            <div className="field">
              <label>ไฟล์รูปโปสเตอร์ (jpg, png, webp)</label>
              <input
                className="input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
            </div>
          )}

          <div className="field">
            <label>รายละเอียด (ถ้ามี)</label>
            <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {formError && <p className="errorText">{formError}</p>}

          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ alignSelf: "flex-start" }}>
            {submitting ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </form>
      )}

      {error && <p className="errorText">{error}</p>}

      {!loading && items.length === 0 && !error && (
        <div className={`card ${styles.empty}`}>
          <BookIcon />
          <p>ยังไม่มีเนื้อหาในหมวดนี้</p>
        </div>
      )}

      <div className={styles.list}>
        {items.map((item, idx) => {
          const embedUrl = item.videoUrl ? youtubeEmbedUrl(item.videoUrl) : null;
          const videoId = embedUrl?.split("/embed/")[1];
          const thumbSrc =
            item.type === "poster"
              ? knowledgeImageSrc(item.imageUrl) ?? undefined
              : videoId
                ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                : undefined;

          return (
            <div key={item.id} className={styles.itemRow}>
              <button
                className={`card ${styles.itemRowMain}`}
                onClick={() => setViewingItem(item)}
                aria-label={`ดู ${item.title}`}
              >
                <span className={styles.thumbWrap}>
                  {thumbSrc && !brokenThumbIds.has(item.id) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbSrc}
                      alt=""
                      className={styles.thumbImg}
                      onError={() =>
                        setBrokenThumbIds((prev) => new Set(prev).add(item.id))
                      }
                    />
                  ) : (
                    <span className={styles.thumbFallback}>
                      {item.type === "video" ? <PlayCircleIcon /> : <BookIcon />}
                    </span>
                  )}
                  {item.type === "video" && (
                    <span className={styles.playBadge}>
                      <PlayCircleIcon />
                    </span>
                  )}
                </span>
                <span className={styles.rowBody}>
                  <span className={styles.rowTitle}>
                    {idx + 1}. {item.title}
                  </span>
                  {item.description && <span className={styles.rowDesc}>{item.description}</span>}
                </span>
                <span className={styles.rowChevron}>
                  <ChevronRightIcon />
                </span>
              </button>

              {isStaff && (
                <button className={styles.deleteBtn} onClick={() => onDelete(item.id)}>
                  ลบเนื้อหานี้
                </button>
              )}
            </div>
          );
        })}
      </div>

      {viewingItem && (
        <div className={styles.modalOverlay} onClick={() => setViewingItem(null)}>
          <button className={styles.modalClose} onClick={() => setViewingItem(null)} aria-label="ปิด">
            <CloseIcon />
          </button>
          <div className={styles.modalBody} onClick={(e) => e.stopPropagation()}>
            {viewingItem.type === "poster" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={knowledgeImageSrc(viewingItem.imageUrl) ?? undefined}
                alt={viewingItem.title}
                className={styles.modalImg}
              />
            ) : (
              <div className={styles.modalVideoWrap}>
                {viewingEmbedUrl && (
                  <iframe
                    className={styles.modalVideoFrame}
                    src={`${viewingEmbedUrl}?autoplay=1`}
                    title={viewingItem.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </div>
            )}
            <div className={styles.modalCaption}>
              <span className={styles.itemTitle}>{viewingItem.title}</span>
              {viewingItem.description && <span className={styles.itemDesc}>{viewingItem.description}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
