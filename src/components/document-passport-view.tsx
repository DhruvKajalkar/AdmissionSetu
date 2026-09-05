"use client";

import { useMemo, useState } from "react";
import {
  DIGILOCKER_DEMO_SCOPES,
  DOCUMENT_REQUIREMENT_BUNDLES,
} from "@/data";
import {
  getAccessibleDocumentTypes,
  getDocumentActivity,
  getWorkflowReadiness,
} from "@/services";
import type {
  DocumentConsentScope,
  DocumentRecord,
  DocumentVerificationStatus,
} from "@/types";
import { useAdmissionSimulation } from "./admission-simulation-provider";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";

type AccessDialog = "CONSENT" | "MANAGE" | null;

const scopeLabels: Record<DocumentConsentScope, { title: string; detail: string }> = {
  SSC_MARKSHEET: { title: "SSC Marksheet", detail: "Secondary-school result record" },
  HSC_MARKSHEET: { title: "HSC Marksheet", detail: "Higher-secondary result record" },
  DOMICILE_CERTIFICATE: { title: "Domicile Certificate", detail: "Maharashtra domicile record" },
  ENTRANCE_EXAM_RECORDS: { title: "Entrance Exam Records", detail: "MHT-CET and JEE Main scorecards" },
};

const statusLabels: Record<DocumentVerificationStatus, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  NOT_CONNECTED: { label: "Not connected", tone: "neutral" },
  AVAILABLE: { label: "Available", tone: "success" },
  VERIFIED: { label: "Verified", tone: "success" },
  MISSING: { label: "Missing", tone: "danger" },
  NEEDS_ATTENTION: { label: "Needs attention", tone: "warning" },
  EXPIRED: { label: "Expired", tone: "danger" },
};

function provenance(record: DocumentRecord) {
  if (record.source === "DIGILOCKER") return "Verified via DigiLocker demo";
  if (record.source === "INSTITUTION") return "Verified by institution · synthetic";
  if (record.source === "MANUAL") return "Manually checked · synthetic";
  return "Synthetic prototype record";
}

function formatActivityTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export function DocumentPassportView() {
  const {
    state,
    lastError,
    connectDocuments,
    revokeDocumentAccess,
    clearError,
  } = useAdmissionSimulation();
  const [dialog, setDialog] = useState<AccessDialog>(null);
  const [selectedScopes, setSelectedScopes] = useState<DocumentConsentScope[]>([...DIGILOCKER_DEMO_SCOPES]);
  const passport = state.documentPassport;
  const connection = passport.providerConnection;
  const overallReadiness = getWorkflowReadiness(state, "DOCUMENT_PASSPORT");
  const accessibleTypes = useMemo(() => new Set(getAccessibleDocumentTypes(state)), [state]);
  const activity = getDocumentActivity(state);

  function toggleScope(scope: DocumentConsentScope) {
    setSelectedScopes((current) => current.includes(scope)
      ? current.filter((item) => item !== scope)
      : [...current, scope]);
  }

  function allowSelectedDocuments() {
    if (connectDocuments(selectedScopes)) setDialog(null);
  }

  function revokeAccess() {
    if (revokeDocumentAccess()) setDialog(null);
  }

  return (
    <>
      <PageHeader
        eyebrow="Verified document passport"
        title="My Documents"
        description="Verify once. Reuse throughout your admission journey."
        action={<StatusBadge tone="warning">DigiLocker integration simulated for prototype</StatusBadge>}
      />

      {lastError ? (
        <div className="simulation-error" role="alert">
          <strong>Document action could not be completed.</strong>
          <span>{lastError.message}</span>
          <button type="button" onClick={clearError}>Dismiss</button>
        </div>
      ) : null}

      <section className="document-passport-summary" aria-labelledby="passport-summary-title">
        <div>
          <p>One verified document set</p>
          <h2 id="passport-summary-title">Admission document passport</h2>
          <span>These synthetic records remain the same across CAP, institute reporting and participating spot rounds.</span>
        </div>
        <div className="document-passport-count" aria-label={`${overallReadiness.readyCount} of ${overallReadiness.requiredCount} documents ready`}>
          <strong>{overallReadiness.readyCount} / {overallReadiness.requiredCount}</strong>
          <span>documents ready</span>
        </div>
      </section>

      <section className="provider-card" aria-labelledby="provider-title">
        <div className="provider-heading">
          <div>
            <p>Connected services</p>
            <h2 id="provider-title">DigiLocker</h2>
            <span>{connection.status === "CONNECTED" ? "Connected in demo" : connection.status === "REVOKED" ? "Access revoked" : "Not connected"}</span>
          </div>
          <StatusBadge tone={connection.status === "CONNECTED" ? "success" : connection.status === "REVOKED" ? "warning" : "neutral"}>
            {connection.status === "CONNECTED" ? "Demo connected" : connection.status === "REVOKED" ? "Access revoked" : "Consent required"}
          </StatusBadge>
        </div>
        <p className="provider-explanation">
          A production implementation would request documents as an authorized DigiLocker Requester using student-controlled authorization. AdmissionSetu is not connected to the real service in this prototype.
        </p>
        {connection.status === "CONNECTED" ? (
          <div className="provider-access-summary">
            <div><strong>Access granted</strong><span>{connection.grantedScopes.map((scope) => scopeLabels[scope].title).join(" · ")}</span></div>
            <button className="secondary-action-button" type="button" onClick={() => setDialog("MANAGE")}>Manage access</button>
          </div>
        ) : (
          <button className="primary-action-button" type="button" onClick={() => { setSelectedScopes([...DIGILOCKER_DEMO_SCOPES]); setDialog("CONSENT"); }}>Connect DigiLocker</button>
        )}
      </section>

      <section className="passport-records" aria-labelledby="passport-records-title">
        <header>
          <div><p>Synthetic document records</p><h2 id="passport-records-title">Your verified set</h2></div>
          <span>No real document files or identifiers are stored</span>
        </header>
        <div className="passport-record-grid">
          {passport.records.map((record) => {
            const status = statusLabels[record.verificationStatus];
            const accessible = accessibleTypes.has(record.documentType);
            return (
              <article className={record.verificationStatus === "MISSING" ? "passport-record is-missing" : "passport-record"} key={record.id}>
                <div className="passport-record-heading">
                  <span className="document-status-symbol" aria-hidden="true">{record.verificationStatus === "VERIFIED" ? "✓" : "!"}</span>
                  <div><h3>{record.displayName}</h3><p>{provenance(record)}</p></div>
                  <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                </div>
                {record.issuedBy ? <dl><dt>Issuer</dt><dd>{record.issuedBy}</dd></dl> : <p className="missing-document-note">Not present in this deterministic demo record.</p>}
                {record.verificationStatus === "VERIFIED" ? <small>{accessible ? "AdmissionSetu access allowed for this demo" : "Verified record retained; access requires consent"}</small> : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="requirement-section" aria-labelledby="requirement-title">
        <header><div><p>Prototype requirement sets</p><h2 id="requirement-title">Readiness across the journey</h2></div><span>Requirements can be replaced by policy-specific bundles later.</span></header>
        <div className="requirement-grid">
          {DOCUMENT_REQUIREMENT_BUNDLES.filter((bundle) => bundle.id !== "DOCUMENT_PASSPORT").map((bundle) => {
            const readiness = getWorkflowReadiness(state, bundle.id);
            return (
              <article key={bundle.id}>
                <StatusBadge tone={readiness.ready ? "success" : "warning"}>{readiness.ready ? "Ready" : "Incomplete"}</StatusBadge>
                <h3>{bundle.displayName}</h3>
                <strong>{readiness.readyCount} / {readiness.requiredCount} ready</strong>
                <p>{bundle.description}</p>
                <small>Prototype requirement set</small>
              </article>
            );
          })}
        </div>
      </section>

      <section className="document-activity" aria-labelledby="document-activity-title">
        <header><div><p>Consent and reuse history</p><h2 id="document-activity-title">Document activity</h2></div><span>{activity.length} recorded actions</span></header>
        {activity.length ? (
          <ol>
            {activity.map((item) => <li key={item.id}><time>{formatActivityTime(item.occurredAt)}</time><div><strong>{item.title}</strong><span>{item.description}</span></div></li>)}
          </ol>
        ) : <p className="empty-document-activity">No access or sharing activity yet. Connecting the demo provider will create the first transparent activity record.</p>}
      </section>

      {dialog ? (
        <div className="confirmation-overlay" role="presentation">
          <section className="confirmation-dialog document-consent-dialog" role="dialog" aria-modal="true" aria-labelledby="document-consent-title" aria-describedby="document-consent-description">
            <p>{dialog === "CONSENT" ? "Explicit student consent" : "Manage connected service"}</p>
            <h2 id="document-consent-title">{dialog === "CONSENT" ? "Allow AdmissionSetu to access selected documents?" : "Manage DigiLocker demo access"}</h2>
            {dialog === "CONSENT" ? (
              <>
                <span id="document-consent-description">AdmissionSetu would request access as an authorized DigiLocker Requester in a production implementation. This demo creates no OAuth token and makes no external call.</span>
                <fieldset className="document-scope-list">
                  <legend>Requested document scopes</legend>
                  {DIGILOCKER_DEMO_SCOPES.map((scope) => (
                    <label key={scope}>
                      <input type="checkbox" checked={selectedScopes.includes(scope)} onChange={() => toggleScope(scope)} />
                      <span><strong>{scopeLabels[scope].title}</strong><small>{scopeLabels[scope].detail}</small></span>
                    </label>
                  ))}
                </fieldset>
                <div><button className="primary-action-button" type="button" onClick={allowSelectedDocuments}>Allow selected documents</button><button autoFocus className="secondary-action-button" type="button" onClick={() => setDialog(null)}>Cancel</button></div>
              </>
            ) : (
              <>
                <span id="document-consent-description">Revoking access removes AdmissionSetu&apos;s active permission. It does not delete the underlying synthetic document records or prior activity history.</span>
                <div className="manage-access-list"><strong>Currently allowed</strong><span>{connection.grantedScopes.map((scope) => scopeLabels[scope].title).join(" · ")}</span></div>
                <div><button className="danger-action-button" type="button" onClick={revokeAccess}>Revoke DigiLocker access</button><button autoFocus className="secondary-action-button" type="button" onClick={() => setDialog(null)}>Keep access</button></div>
              </>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
