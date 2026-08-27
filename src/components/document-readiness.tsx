import { SectionCard } from "./section-card";
import { StatusBadge } from "./status-badge";
import type { CandidateDocument, DocumentStatus } from "@/types";

interface DocumentReadinessProps {
  documents: readonly CandidateDocument[];
}

const documentState: Record<Exclude<DocumentStatus, "NOT_REQUIRED">, { label: string; tone: "success" | "warning" | "danger" }> = {
  VERIFIED: { label: "Verified", tone: "success" },
  UPLOADED: { label: "Needs attention", tone: "warning" },
  PENDING: { label: "Missing", tone: "danger" },
};

function isRequiredDocument(
  document: CandidateDocument,
): document is CandidateDocument & { status: Exclude<DocumentStatus, "NOT_REQUIRED"> } {
  return document.status !== "NOT_REQUIRED";
}

export function DocumentReadiness({ documents }: DocumentReadinessProps) {
  const requiredDocuments = documents.filter(isRequiredDocument);
  const verifiedDocuments = requiredDocuments.filter((document) => document.status === "VERIFIED");
  const attentionDocuments = requiredDocuments.filter((document) => document.status !== "VERIFIED");

  return (
    <div id="document-readiness">
      <SectionCard
        className="documents-card"
        title="Document Readiness"
        description="Your documents are checked once and stay visible throughout your admission journey."
        action={<StatusBadge tone={attentionDocuments.length > 0 ? "warning" : "success"}>{attentionDocuments.length > 0 ? `${attentionDocuments.length} need attention` : "Ready"}</StatusBadge>}
      >
        <div className="document-readiness-overview">
          <div className="document-count" aria-label={`${verifiedDocuments.length} of ${requiredDocuments.length} required documents verified`}>
            <strong>{verifiedDocuments.length}</strong>
            <span>of {requiredDocuments.length} verified</span>
          </div>
          <p>
            {attentionDocuments.length > 0
              ? "Finish the highlighted items before institute reporting to avoid last-minute delays."
              : "All required documents are verified for the next admission step."}
          </p>
        </div>

        <ul className="document-list">
          {requiredDocuments.map((document) => {
            const status = documentState[document.status];
            return (
              <li className={document.status === "PENDING" ? "document-row missing" : "document-row"} key={document.id}>
                <span className="document-status-symbol" aria-hidden="true">
                  {document.status === "VERIFIED" ? "✓" : document.status === "PENDING" ? "!" : "·"}
                </span>
                <span className="document-name">{document.label}</span>
                <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                {document.status === "PENDING" ? (
                  <a className="text-link document-action" href="#document-guidance">View requirement</a>
                ) : null}
              </li>
            );
          })}
        </ul>

        <p className="document-guidance" id="document-guidance">
          For the demo, keep the original nationality certificate and one self-attested copy ready for institute reporting.
        </p>
      </SectionCard>
    </div>
  );
}
