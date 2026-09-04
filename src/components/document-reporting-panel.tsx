"use client";

import Link from "next/link";
import { useState } from "react";
import { DOCUMENT_REQUIREMENT_BUNDLES } from "@/data";
import { getAccessibleDocumentTypes, getDocumentRecord, getLatestDocumentShare, getWorkflowReadiness } from "@/services";
import type { DocumentWorkflowId } from "@/types";
import { useAdmissionSimulation } from "./admission-simulation-provider";
import { StatusBadge } from "./status-badge";

interface DocumentReportingPanelProps {
  instituteCode: string;
  instituteName: string;
  programId: string;
  programName: string;
  workflowId: Extract<DocumentWorkflowId, "INSTITUTE_REPORTING" | "SPOT_ROUND">;
  compact?: boolean;
}

export function DocumentReportingPanel({
  instituteCode,
  instituteName,
  programId,
  programName,
  workflowId,
  compact = false,
}: DocumentReportingPanelProps) {
  const { state, shareDocuments } = useAdmissionSimulation();
  const [confirming, setConfirming] = useState(false);
  const readiness = getWorkflowReadiness(state, workflowId);
  const bundle = DOCUMENT_REQUIREMENT_BUNDLES.find((item) => item.id === workflowId);
  const connection = state.documentPassport.providerConnection;
  const previousShare = getLatestDocumentShare(state, instituteCode, programId);
  const documents = (bundle?.requiredDocumentTypes ?? []).flatMap((documentType) => {
    const record = getDocumentRecord(state, documentType);
    return record ? [record] : [];
  });
  const accessibleTypes = new Set(getAccessibleDocumentTypes(state));
  const requiredAccessGranted = documents.every((document) => accessibleTypes.has(document.documentType));

  function confirmShare() {
    const succeeded = shareDocuments({
      workflowId,
      recipientInstituteCode: instituteCode,
      recipientInstituteName: instituteName,
      recipientProgramId: programId,
      recipientProgramName: programName,
      purpose: workflowId === "SPOT_ROUND" ? "spot-round admission reporting" : "confirmed admission reporting",
    });
    if (succeeded) setConfirming(false);
  }

  return (
    <section className={compact ? "document-reporting-panel compact" : "document-reporting-panel"} aria-labelledby={`document-reporting-${workflowId}-${instituteCode}`}>
      <div className="document-reporting-heading">
        <div><p>Document readiness</p><h2 id={`document-reporting-${workflowId}-${instituteCode}`}>{readiness.readyCount}/{readiness.requiredCount} required documents ready</h2></div>
        <StatusBadge tone={readiness.ready ? "success" : "warning"}>{readiness.ready ? "Ready for reporting" : "Needs attention"}</StatusBadge>
      </div>
      <p>The same verified passport records can be reused for {instituteName}. No second upload is needed in this prototype.</p>
      {previousShare ? (
        <div className="document-share-success" role="status"><strong>Documents shared</strong><span>{previousShare.documentTypes.length} verified records shared for this simulated admission.</span></div>
      ) : connection.status !== "CONNECTED" ? (
        <div className="document-reporting-action"><span>Connect the DigiLocker demo and grant access before sharing.</span><Link className="secondary-link-button" href="/documents">View documents</Link></div>
      ) : readiness.ready && requiredAccessGranted ? (
        <button className="secondary-action-button" type="button" onClick={() => setConfirming(true)}>Share verified documents</button>
      ) : readiness.ready ? (
        <div className="document-reporting-action"><span>Additional document access is required for this minimum set.</span><Link className="secondary-link-button" href="/documents">Manage access</Link></div>
      ) : (
        <Link className="secondary-link-button" href="/documents">Review document issue</Link>
      )}

      {confirming ? (
        <div className="confirmation-overlay" role="presentation">
          <section className="confirmation-dialog document-share-dialog" role="dialog" aria-modal="true" aria-labelledby="share-documents-title">
            <p>Share for this admission</p>
            <h2 id="share-documents-title">Share verified documents with {instituteName}?</h2>
            <span>Only these {documents.length} verified records will be shared for this simulated admission. Nothing is uploaded or sent externally.</span>
            <ul>{documents.map((document) => <li key={document.id}><span>{document.displayName}</span><strong>Ready</strong></li>)}</ul>
            <div><button className="primary-action-button" type="button" onClick={confirmShare}>Share for this admission</button><button className="secondary-action-button" type="button" onClick={() => setConfirming(false)}>Cancel</button></div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
