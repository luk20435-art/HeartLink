"use client";

import { KnowledgeItemsView } from "@/components/KnowledgeItemsView";

export default function KnowledgeVideosPage() {
  return (
    <KnowledgeItemsView
      type="video"
      title="วิดีโอ"
      backHref="/knowledge/manage"
      backLabel="จัดการเนื้อหา"
    />
  );
}
