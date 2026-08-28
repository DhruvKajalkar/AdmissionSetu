import Link from "next/link";
import { AdmissionSetuMark } from "@/components";

export default function HomePage() {
  return (
    <main className="landing-shell">
      <header className="landing-header" aria-label="AdmissionSetu header">
        <Link className="brand" href="/" aria-label="AdmissionSetu home">
          <AdmissionSetuMark className="brand-mark" />
          <span>AdmissionSetu</span>
        </Link>
        <span className="prototype-pill">Hackathon prototype</span>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="eyebrow">Maharashtra engineering admissions</div>
        <h1 id="landing-title">
          One admission journey.
          <br />
          Every seat accounted for.
        </h1>
        <p className="landing-summary">
          A unified citizen journey for exploring colleges, planning preferences,
          tracking admission, and participating in transparent spot rounds.
        </p>
        <Link className="primary-button" href="/dashboard">
          Continue as Demo Student
          <span aria-hidden="true">→</span>
        </Link>
        <p className="synthetic-note">
          No sign-in required. This demonstration uses only synthetic candidate and seat data.
        </p>
      </section>

      <section className="journey-strip" aria-label="Unified admission journey">
        <div>
          <span className="journey-number">01</span>
          <p>Build one student profile</p>
        </div>
        <div>
          <span className="journey-number">02</span>
          <p>Track one live admission state</p>
        </div>
        <div>
          <span className="journey-number">03</span>
          <p>See every seat update clearly</p>
        </div>
      </section>
    </main>
  );
}
