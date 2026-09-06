import type { Metadata } from "next";
import Link from "next/link";
import { AdmissionSetuMark } from "@/components";

export const metadata: Metadata = {
  title: "Prototype Institute Reporting Form",
  description: "Synthetic form used to demonstrate AdmissionSetu's supervised form guidance.",
};

const fields = [
  { id: "candidate-name", label: "Candidate name", placeholder: "Enter registered admission name" },
  { id: "cet-percentile", label: "MHT-CET percentile", placeholder: "Enter percentile from scorecard" },
  { id: "current-institute", label: "Current accepted institute", placeholder: "Enter institute name" },
  { id: "programme", label: "Current programme", placeholder: "Enter accepted programme" },
  { id: "domicile", label: "Domicile state", placeholder: "Enter state shown on certificate" },
  { id: "hsc-status", label: "HSC marksheet status", placeholder: "Available / missing" },
  { id: "cet-scorecard", label: "MHT-CET scorecard status", placeholder: "Available / missing" },
  { id: "income-certificate", label: "Income Certificate status", placeholder: "Available / missing" },
  { id: "application-reference", label: "Official application reference number", placeholder: "Check official CET application record" },
  { id: "candidature-type", label: "Candidature type", placeholder: "Choose only after checking official instructions" },
  { id: "verification-otp", label: "Verification OTP", placeholder: "Enter privately — never share this value" },
] as const;

export default function CetReportingDemoFormPage() {
  return (
    <main className="demo-form-page">
      <header className="demo-form-brand">
        <Link href="/assistant" aria-label="Return to Ask AdmissionSetu"><AdmissionSetuMark /><span>AdmissionSetu</span></Link>
        <Link href="/assistant">Return to Form Guide</Link>
      </header>

      <section className="demo-form-shell" aria-labelledby="demo-form-title">
        <div className="demo-form-notice">
          <strong>Prototype form for guided-assistance demonstration</strong>
          <span>This synthetic page is not a government or institute website and does not submit information.</span>
        </div>
        <header>
          <p>2026–27 · Synthetic reporting exercise</p>
          <h1 id="demo-form-title">Institute reporting information</h1>
          <span>Enter details exactly as recorded in the relevant official admission records. Fields below are deliberately blank for the AdmissionSetu demo.</span>
        </header>

        <form className="demo-reporting-form">
          <div className="demo-reporting-grid">
            {fields.map((field) => (
              <label key={field.id} htmlFor={field.id}>
                <span>{field.label}</span>
                <input id={field.id} name={field.id} placeholder={field.placeholder} readOnly />
              </label>
            ))}
          </div>
          <aside>
            <strong>Screenshot guidance</strong>
            <p>Capture only this prototype form. Do not add real identifiers, OTPs, passwords or banking details.</p>
          </aside>
          <button type="button" disabled>Submit disabled in prototype</button>
        </form>
      </section>
    </main>
  );
}
