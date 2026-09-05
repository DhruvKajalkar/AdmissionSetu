"use client";

import Link from "next/link";
import { getDocumentRecord, getWorkflowReadiness } from "@/services";
import { useAdmissionSimulation } from "./admission-simulation-provider";
import { SectionCard } from "./section-card";
import { StatusBadge } from "./status-badge";

export function DocumentReadiness() {
  const { state } = useAdmissionSimulation();
  const readiness = getWorkflowReadiness(state, "DOCUMENT_PASSPORT");
  const attentionRecords = [...readiness.missingDocumentTypes, ...readiness.attentionDocumentTypes]
    .flatMap((documentType) => {
      const record = getDocumentRecord(state, documentType);
      return record ? [record] : [];
    });

  return (
    <div id="document-readiness">
      <SectionCard
        className="documents-card"
        title={`Documents: ${readiness.readyCount} of ${readiness.requiredCount} ready`}
        description="One verified document set is reused across your admission journey with consent."
        action={<StatusBadge tone={readiness.ready ? "success" : "warning"}>{readiness.ready ? "Ready" : `${attentionRecords.length} document${attentionRecords.length === 1 ? "" : "s"} needs attention`}</StatusBadge>}
      >
        <div className="document-readiness-overview">
          <div className="document-count" aria-label={`${readiness.readyCount} of ${readiness.requiredCount} documents ready`}>
            <strong>{readiness.readyCount}</strong>
            <span>of {readiness.requiredCount} ready</span>
          </div>
          <p>{readiness.ready ? "All passport records are ready." : `${attentionRecords.map((record) => record.displayName).join(", ")} needs attention. Core CAP and reporting bundles remain ready in this prototype.`}</p>
        </div>
        <div className="dashboard-document-actions">
          <span>DigiLocker-style access is simulated and remains under your control.</span>
          <Link className="secondary-link-button" href="/documents">View documents</Link>
        </div>
      </SectionCard>
    </div>
  );
}
