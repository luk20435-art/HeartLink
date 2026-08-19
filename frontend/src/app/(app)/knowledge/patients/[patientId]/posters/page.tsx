"use client";

import { useParams } from "next/navigation";
import { KnowledgeItemsView } from "@/components/KnowledgeItemsView";

export default function PatientKnowledgePostersPage() {
  const { patientId } = useParams<{ patientId: string }>();
  return (
    <KnowledgeItemsView
      type="poster"
      title="โปสเตอร์ให้ความรู้"
      allowManage={false}
      backHref={`/knowledge/patients/${patientId}`}
      backLabel="ชุดความรู้ 4 Intervention"
    />
  );
}
