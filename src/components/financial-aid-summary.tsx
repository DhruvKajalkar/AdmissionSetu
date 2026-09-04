"use client";

import Link from "next/link";
import { demoCandidate, SCHOLARSHIP_SCHEMES } from "@/data";
import { evaluateAllSchemes, getScholarshipSummary } from "@/services";
import { useAdmissionSimulation } from "./admission-simulation-provider";

export function FinancialAidSummary({ postAdmission = false }: { postAdmission?: boolean }) {
  const { state } = useAdmissionSimulation();
  const summary = getScholarshipSummary(evaluateAllSchemes(state, demoCandidate, SCHOLARSHIP_SCHEMES));

  return (
    <section className={postAdmission ? "financial-aid-summary post-admission" : "financial-aid-summary"} aria-labelledby={postAdmission ? "post-admission-financial-aid-title" : "dashboard-financial-aid-title"}>
      <div>
        <p>{postAdmission ? "Continue your student journey" : "Profile reuse"}</p>
        <h2 id={postAdmission ? "post-admission-financial-aid-title" : "dashboard-financial-aid-title"}>{postAdmission ? "Next: Financial aid" : "Financial aid"}</h2>
        <span>{postAdmission ? "Your verified admission profile may match government scholarship or fee-support schemes." : "Your existing admission profile and verified documents power this prototype check."}</span>
      </div>
      <div className="financial-aid-summary-result">
        <strong>{summary.eligible} scheme{summary.eligible === 1 ? "" : "s"} currently match{summary.eligible === 1 ? "es" : ""}</strong>
        <span>{summary.applicationReady} application-ready · {summary.possiblyEligible} need more information</span>
        <Link href="/scholarships">{postAdmission ? "Check scholarships" : "View scholarships"} →</Link>
      </div>
    </section>
  );
}
