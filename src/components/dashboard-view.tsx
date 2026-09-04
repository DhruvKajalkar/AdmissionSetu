"use client";

import Link from "next/link";
import { admissionJourneyStages, dashboardAlerts, DEMO_NOW, nextAdmissionDeadline } from "@/data";
import { formatPercentile, formatShortDeadline, formatTimeRemaining } from "@/lib/format";
import type { AdmissionJourneyStage, Candidate, OfficialInstitute, OfficialProgram } from "@/types";
import { AdmissionAlert } from "./admission-alert";
import { AdmissionJourney } from "./admission-journey";
import { useAdmissionSimulation } from "./admission-simulation-provider";
import { DeadlineBanner } from "./deadline-banner";
import { DocumentReadiness } from "./document-readiness";
import { FinancialAidSummary } from "./financial-aid-summary";
import { PageHeader } from "./page-header";
import { SectionCard } from "./section-card";
import { StatCard } from "./stat-card";
import { StatusBadge } from "./status-badge";

const quickActions = [
  { title: "Explore Colleges", description: "Compare colleges, branches and cutoff information.", href: "/explore", index: "01" },
  { title: "Review Preferences", description: "Review the order and consequences of your choices.", href: "/preferences", index: "02" },
  { title: "Live Vacancies", description: "See seats released through the live demo journey.", href: "/vacancies", index: "03" },
  { title: "My Admission", description: "Review and trace your one current admission.", href: "/admission", index: "04" },
  { title: "Spot Rounds", description: "Join demo queues and act on live seat offers.", href: "/spot-rounds", index: "05" },
] as const;

export function DashboardView({ candidate, institutes, programs }: { candidate: Candidate; institutes: readonly OfficialInstitute[]; programs: readonly OfficialProgram[] }) {
  const { state } = useAdmissionSimulation();
  const admission = state.currentAdmission;
  const participatingProgram = admission?.kind === "PARTICIPATING_SEAT" ? programs.find((program) => program.choiceCode === admission.programId) : undefined;
  const participatingInstitute = participatingProgram ? institutes.find((institute) => institute.code === participatingProgram.instituteCode) : undefined;
  const hasFinalAdmission = admission?.kind === "CONNECTED_ADMISSION" || (admission?.kind === "PARTICIPATING_SEAT" && admission.source === "SPOT_ROUND");
  const journeyStageId = hasFinalAdmission ? "FINAL_ADMISSION" : admission ? candidate.currentJourneyStage : "INSTITUTE_SPOT_ROUNDS";
  const journeyStages: readonly AdmissionJourneyStage[] = hasFinalAdmission
    ? admissionJourneyStages.map((stage) => {
      if (stage.id === "BETTERMENT") return { ...stage, description: "Earlier CAP Betterment stage completed in this demo" };
      if (stage.id === "INSTITUTE_SPOT_ROUNDS") return {
        ...stage,
        description: admission?.kind === "PARTICIPATING_SEAT"
          ? `${participatingInstitute?.commonName ?? "Participating institute"} ${participatingProgram?.name ?? "seat"} accepted through synchronized merit clearing`
          : "Connected counselling confirmation received",
      };
      if (stage.id === "FINAL_ADMISSION") return { ...stage, description: "Your new seat is confirmed as the one current admission" };
      return stage;
    })
    : admissionJourneyStages;
  const visibleAlerts = hasFinalAdmission
    ? dashboardAlerts.filter((alert) => alert.id !== "alert-institute-window")
    : dashboardAlerts;

  return (
    <>
      <PageHeader eyebrow="Student command centre" title="Your admission dashboard" description="See your one current admission state, important deadlines, document readiness, and next actions." action={<StatusBadge tone="info">Demo simulation</StatusBadge>} />
      <section className="candidate-overview" aria-labelledby="candidate-overview-title">
        <div className="candidate-identity"><p>Candidate overview</p><h2 id="candidate-overview-title">{candidate.fullName}</h2><span>{candidate.applicationNumber}</span><dl className="candidate-facts"><div><dt>Category</dt><dd>{candidate.category}</dd></div><div><dt>Home university</dt><dd>{candidate.homeUniversity}</dd></div></dl></div>
        <div className="candidate-scores" aria-label="Entrance examination performance"><StatCard label="MHT-CET percentile" value={formatPercentile(candidate.cetPercentile)} supportingText="PCM group · Maharashtra state merit" /><StatCard label="JEE Main percentile" value={formatPercentile(candidate.jeePercentile)} supportingText="National examination score on record" /></div>
      </section>
      <div className="dashboard-priority-grid">
        <SectionCard className="current-admission-card" title="Your Current Admission" description="AdmissionSetu keeps one authoritative current state for this synthetic candidate." action={admission ? <StatusBadge tone="success">Current admission active</StatusBadge> : <StatusBadge tone="warning">No admission held</StatusBadge>}>
          {admission?.kind === "PARTICIPATING_SEAT" && participatingProgram && participatingInstitute ? (
            <div className="current-seat">
              <div className="seat-heading"><p>{participatingInstitute.name}</p><h3>{participatingProgram.name}</h3><span>{participatingInstitute.city} · Institute code {participatingInstitute.code}</span></div>
              <dl className="seat-details"><div><dt>Admission route</dt><dd>{admission.source === "SPOT_ROUND" ? "Centralized live spot round · demo" : "MHT-CET CAP"}</dd></div><div><dt>Allotment round</dt><dd>{admission.allotmentRound}</dd></div><div><dt>Current status</dt><dd>Confirmed and held by you</dd></div><div><dt>Betterment</dt><dd>{admission.bettermentStatus === "ACTIVE" ? "Active" : "Not active"}</dd></div></dl>
              <div className="seat-explanation"><span className="seat-explanation-marker" aria-hidden="true">i</span><p><strong>This is Aarya&apos;s one participating seat.</strong> {admission.source === "SPOT_ROUND" ? "The previous AISSMS seat has returned to the centralized vacancy pool." : "If it is released through the demo, this dashboard and the vacancy exchange update from the same state."}</p></div>
            </div>
          ) : admission?.kind === "CONNECTED_ADMISSION" ? (
            <div className="current-seat connected-current-seat"><div className="seat-heading"><p>{admission.institutionName}</p><h3>{admission.programName}</h3><span>Demo connected counselling event · fictional record</span></div><dl className="seat-details"><div><dt>Admission route</dt><dd>{admission.sourceLabel}</dd></div><div><dt>Current status</dt><dd>Confirmed in simulation</dd></div><div><dt>Participating CET seat</dt><dd>Released</dd></div><div><dt>Betterment</dt><dd>Not applicable</dd></div></dl></div>
          ) : (
            <div className="no-admission-dashboard"><strong>No current admission is held</strong><p>Aarya&apos;s previous participating seat has returned to the demo vacancy exchange.</p><Link href="/admission">View admission event history →</Link></div>
          )}
        </SectionCard>
        {hasFinalAdmission ? (
          <SectionCard
            className="final-admission-summary"
            title="Admission transition complete"
            description="Your new seat is now your one current admission."
            action={<StatusBadge tone="success">Seat confirmed</StatusBadge>}
          >
            <p>The previous AISSMS seat was released and returned to Live Vacancies. Your saved CAP preferences remain unchanged.</p>
            <Link className="text-link" href="/admission">Review admission history →</Link>
          </SectionCard>
        ) : (
          <DeadlineBanner label="Next action" title={nextAdmissionDeadline.title} deadline={formatShortDeadline(nextAdmissionDeadline.deadlineAt)} relativeLabel={formatTimeRemaining(nextAdmissionDeadline.deadlineAt, DEMO_NOW)} detail={nextAdmissionDeadline.whyItMatters} action={<Link className="deadline-button" href={nextAdmissionDeadline.actionHref}>{nextAdmissionDeadline.actionLabel} →</Link>} />
        )}
      </div>
      <AdmissionJourney stages={journeyStages} currentStageId={journeyStageId} />
      <div className="dashboard-detail-grid"><DocumentReadiness /><SectionCard className="alerts-card" title="Important Alerts" description="Only the updates that need your attention now."><div className="alerts-list">{visibleAlerts.map((alert) => <AdmissionAlert alert={alert} key={alert.id} />)}</div></SectionCard></div>
      <FinancialAidSummary />
      <section className="dashboard-actions" aria-labelledby="quick-actions-title"><div className="dashboard-section-heading"><div><h2 id="quick-actions-title">What you can do next</h2><p>Your current seat and Live Vacancies stay in sync across AdmissionSetu.</p></div></div><nav className="quick-actions" aria-label="Next admission actions">{quickActions.map((action) => <Link className="action-card" href={action.href} key={action.href}><span className="action-index" aria-hidden="true">{action.index}</span><strong>{action.title}</strong><span>{action.description}</span><b aria-hidden="true">Open →</b></Link>)}</nav></section>
    </>
  );
}
