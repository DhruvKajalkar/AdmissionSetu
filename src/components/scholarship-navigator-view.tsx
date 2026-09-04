"use client";

import Link from "next/link";
import { demoCandidate, SCHOLARSHIP_PORTAL_URLS, SCHOLARSHIP_SCHEMES, scholarshipContextSources } from "@/data";
import { buildScholarshipEvaluationContext, evaluateAllSchemes, getScholarshipSummary } from "@/services";
import type { ScholarshipEligibilityStatus, ScholarshipHostelStatus, ScholarshipScheme } from "@/types";
import { useAdmissionSimulation } from "./admission-simulation-provider";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";

const eligibilityLabels: Record<ScholarshipEligibilityStatus, string> = {
  ELIGIBLE: "Eligible",
  POSSIBLY_ELIGIBLE: "Possibly eligible",
  NOT_ELIGIBLE: "Not eligible",
};

function statusTone(status: ScholarshipEligibilityStatus) {
  if (status === "ELIGIBLE") return "success" as const;
  if (status === "POSSIBLY_ELIGIBLE") return "warning" as const;
  return "neutral" as const;
}

function formatIncome(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ScholarshipNavigatorView() {
  const {
    state,
    lastError,
    clearError,
    updateScholarshipProfile,
    recordScholarshipHandoff,
  } = useAdmissionSimulation();
  const evaluations = evaluateAllSchemes(state, demoCandidate, SCHOLARSHIP_SCHEMES);
  const summary = getScholarshipSummary(evaluations);
  const context = buildScholarshipEvaluationContext(state, demoCandidate);
  const profile = state.scholarshipNavigator.profile;
  const schemes: readonly ScholarshipScheme[] = SCHOLARSHIP_SCHEMES;

  function setHostelStatus(status: ScholarshipHostelStatus) {
    updateScholarshipProfile({ hostelStatus: status });
  }

  return (
    <>
      <PageHeader
        eyebrow="One profile · reused for financial-aid discovery"
        title="Scholarships & Financial Aid"
        description="See which schemes may match your existing admission profile — without starting from zero."
        action={<StatusBadge tone="info">Official scheme criteria · Prototype eligibility evaluation</StatusBadge>}
      />

      <section className="scholarship-summary" aria-labelledby="scholarship-summary-title">
        <div>
          <p>Based on Aarya&apos;s current profile</p>
          <h2 id="scholarship-summary-title">Your explainable scheme check</h2>
          <span>Personal values and evaluations are synthetic. Scheme rules link to official government sources.</span>
        </div>
        <dl>
          <div><dt>Eligible</dt><dd>{summary.eligible}</dd></div>
          <div><dt>Possibly eligible</dt><dd>{summary.possiblyEligible}</dd></div>
          <div><dt>Not eligible</dt><dd>{summary.notEligible}</dd></div>
          <div><dt>Application-ready</dt><dd>{summary.applicationReady}</dd></div>
        </dl>
      </section>

      {lastError ? (
        <div className="simulation-error" role="alert">
          <strong>Scholarship demo action could not be completed.</strong>
          <span>{lastError.message}</span>
          <button type="button" onClick={clearError}>Dismiss</button>
        </div>
      ) : null}

      <section className="scholarship-profile" aria-labelledby="scholarship-profile-title">
        <div className="scholarship-profile-heading">
          <div>
            <p>Synthetic profile reused</p>
            <h2 id="scholarship-profile-title">Known once, checked across schemes</h2>
            <span>Only the small set of fields required by these selected official rules is represented.</span>
          </div>
          <StatusBadge tone="info">Synthetic candidate values</StatusBadge>
        </div>
        <dl className="scholarship-profile-facts">
          <div><dt>Current route</dt><dd>{context.admissionRoute === "CAP" ? "MHT-CET CAP" : context.admissionRoute.replace("_", " ")}</dd></div>
          <div><dt>Study</dt><dd>First-year engineering degree</dd></div>
          <div><dt>Domicile</dt><dd>Maharashtra</dd></div>
          <div><dt>Annual family income</dt><dd>{formatIncome(profile.familyAnnualIncomeInr)} · synthetic</dd></div>
        </dl>
        <div className="missing-profile-field">
          <div>
            <strong>We need one more detail</strong>
            <span>Hosteller or day scholar? This affects the Dr. Panjabrao Deshmukh maintenance-scheme check.</span>
          </div>
          <label>
            <span>Living arrangement</span>
            <select value={profile.hostelStatus} onChange={(event) => setHostelStatus(event.target.value as ScholarshipHostelStatus)}>
              <option value="UNKNOWN">Select demo answer</option>
              <option value="HOSTELLER">Hosteller / paying guest / tenant</option>
              <option value="DAY_SCHOLAR">Day scholar</option>
            </select>
          </label>
        </div>
      </section>

      <section className="scholarship-results" aria-labelledby="scholarship-results-title">
        <header>
          <div>
            <p>Curated government schemes</p>
            <h2 id="scholarship-results-title">Eligibility and readiness results</h2>
            <span>Eligibility is separate from having every modelled application document ready.</span>
          </div>
          <span>{schemes.length} official schemes reviewed</span>
        </header>

        <div className="scholarship-card-list">
          {schemes.map((scheme, index) => {
            const evaluation = evaluations[index];
            const handoff = state.scholarshipNavigator.handoffs.find((item) => item.schemeId === scheme.id);
            return (
              <article className={`scholarship-card status-${evaluation.status.toLowerCase()}`} key={scheme.id}>
                <div className="scholarship-card-heading">
                  <div>
                    <span>{scheme.portal === "NSP" ? "National Scholarship Portal" : "MahaDBT"} · {scheme.schemeType.replace("_", " ")}</span>
                    <h3>{scheme.name}</h3>
                    <p>{scheme.provider}</p>
                  </div>
                  <StatusBadge tone={statusTone(evaluation.status)}>{eligibilityLabels[evaluation.status]}</StatusBadge>
                </div>

                <p className="scholarship-benefit"><strong>Potential support:</strong> {scheme.benefitSummary}</p>

                <div className="scholarship-key-result">
                  <div><span>Eligibility</span><strong>{eligibilityLabels[evaluation.status]}</strong></div>
                  <div><span>Modelled application readiness</span><strong>{evaluation.readyDocumentCount} of {evaluation.requiredDocumentCount} documents ready</strong></div>
                </div>

                {evaluation.status === "POSSIBLY_ELIGIBLE" ? (
                  <p className="scholarship-information-needed"><strong>We need one more detail.</strong> {evaluation.unknownRules[0]?.explanation ?? "The official portal must confirm an unmodelled condition."}</p>
                ) : evaluation.status === "NOT_ELIGIBLE" ? (
                  <p className="scholarship-failed-reason"><strong>Key reason:</strong> {evaluation.failedRules[0]?.explanation}</p>
                ) : (
                  <p className="scholarship-match-reason"><strong>Eligible based on the current synthetic profile.</strong> Documents are checked separately below.</p>
                )}

                <div className="scholarship-details-row">
                  <details>
                    <summary>Why this result?</summary>
                    <div className="scholarship-explanation">
                      {evaluation.passedRules.length ? <section><h4>Why you match</h4><ul>{evaluation.passedRules.map((result) => <li className="passed" key={result.ruleId}>✓ {result.explanation}</li>)}</ul></section> : null}
                      {evaluation.failedRules.length ? <section><h4>Rules that do not match</h4><ul>{evaluation.failedRules.map((result) => <li className="failed" key={result.ruleId}>× {result.explanation}</li>)}</ul></section> : null}
                      {evaluation.unknownRules.length ? <section><h4>Information still needed</h4><ul>{evaluation.unknownRules.map((result) => <li className="unknown" key={result.ruleId}>? {result.explanation}</li>)}</ul></section> : null}
                      {scheme.criteriaCoverage === "PARTIAL" ? <p>Only part of the published eligibility criteria is modelled, so this prototype will not silently mark the scheme eligible.</p> : null}
                    </div>
                  </details>

                  <details>
                    <summary>View requirements</summary>
                    <div className="scholarship-requirements">
                      <ul>{evaluation.requiredDocuments.map((document) => (
                        <li key={document.documentType}>
                          <span>{document.displayName}</span>
                          <strong className={document.ready ? "ready" : "missing"}>{document.ready ? "Verified" : "Missing"}</strong>
                        </li>
                      ))}</ul>
                      {scheme.documentCoverage === "PARTIAL" ? <p>This is the minimum modelled passport set, not the portal&apos;s complete application checklist.</p> : null}
                      {evaluation.missingDocuments.length ? <Link href="/documents">View missing requirement →</Link> : null}
                    </div>
                  </details>
                </div>

                <div className="scholarship-source-row">
                  <div>
                    <strong>Based on official criteria</strong>
                    <span>Last verified {scheme.officialSources[0].lastVerifiedOn}</span>
                    {scheme.officialSources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>{source.title} ↗</a>)}
                  </div>
                  <a
                    className="primary-link-button scholarship-portal-link"
                    href={SCHOLARSHIP_PORTAL_URLS[scheme.portal]}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => recordScholarshipHandoff(scheme.id)}
                    aria-label={`Continue to official ${scheme.portal === "NSP" ? "National Scholarship Portal" : "MahaDBT"} for ${scheme.name} (opens in a new tab)`}
                  >
                    Continue to official portal
                  </a>
                </div>
                {handoff ? <p className="scholarship-handoff-status" role="status"><strong>Official portal opened.</strong> AdmissionSetu did not submit an application.</p> : null}
              </article>
            );
          })}
        </div>
      </section>

      <div className="scholarship-context-grid">
        <section aria-labelledby="nsp-context-title">
          <p>Official journey context</p>
          <h2 id="nsp-context-title">National Scholarship Portal and OTR</h2>
          <span>NSP describes One Time Registration as a student identifier used across the academic career. AdmissionSetu does not generate an OTR, simulate Aadhaar, or replace NSP registration.</span>
          <a href={scholarshipContextSources.nspStudents} target="_blank" rel="noreferrer">Read the official NSP student guidance ↗</a>
        </section>
        <section aria-labelledby="mahadbt-context-title">
          <p>Why AdmissionSetu adds value</p>
          <h2 id="mahadbt-context-title">MahaDBT already suggests eligible schemes</h2>
          <span>MahaDBT uses completed profile information for suggested schemes. This prototype demonstrates how an admission profile and verified document set could make that handoff understandable immediately after admission.</span>
          <a href={scholarshipContextSources.mahadbtEligibility} target="_blank" rel="noreferrer">Open official MahaDBT eligibility finder ↗</a>
        </section>
      </div>

      <p className="scholarship-disclaimer">Prototype evaluations are explanatory previews, not legal guarantees. Official portals and departments make final eligibility and application decisions.</p>
    </>
  );
}
