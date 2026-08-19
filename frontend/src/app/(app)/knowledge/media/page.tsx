"use client";

import { KnowledgeItemsView } from "@/components/KnowledgeItemsView";

export default function KnowledgeMediaPage() {
  return (
    <KnowledgeItemsView
      type="poster"
      title="สื่อความรู้"
      backHref="/knowledge/manage"
      backLabel="จัดการเนื้อหา"
    />
  );
}
