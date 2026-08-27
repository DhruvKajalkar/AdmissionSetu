import Link from "next/link";
import {
  AdmissionAlert,
  AdmissionJourney,
  DeadlineBanner,
  DocumentReadiness,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from "@/components";
import {
  admissionJourneyStages,
  dashboardAlerts,
  DEMO_NOW,
  nextAdmissionDeadline,
} from "@/data";
import { formatPercentile, formatShortDeadline, formatTimeRemaining } from "@/lib/format";
import {
  mockAdmissionService,
  mockCandidateService,
  mockCollegeService,
  mockSeatService,
} from "@/services";
import type { AdmissionSource } from "@/types";

const admissionRouteLabels: Record<AdmissionSource, string> = {
  MHT_CET_CAP: "MHT-CET CAP",
  JEE_CAP: "JEE-based CAP",
  INSTITUTE_LEVEL: "Institute-level admission",
  SPOT_ROUND: "Spot round",
};

const quickActions = [
  { title: "Explore Colleges", description: "Compare colleges, branches and cutoff information.", href: "/explore", index: "01" },
  { title: "Review Preferences", description: "Review the order and consequences of your choices.", href: "/preferences", index: "02" },
  { title: "Live Vacancies", description: "See seats that become available after withdrawals and allotments.", href: "/vacancies", index: "03" },
  { title: "Spot Rounds", description: "Track institute-level opportunities from one place.", href: "/spot-rounds", index: "04" },
] as const;

export default async function DashboardPage() {
  const candidate = await mockCandidateService.getDemoCandidate();
  const admission = await mockAdmissionService.getCurrentAdmission(candidate.id);
  const seat = admission ? await mockSeatService.getSeatById(admission.seatId) : null;
  const program = seat ? await mockCollegeService.getProgramById(seat.programId) : null;
  const college = program ? await mockCollegeService.getCollegeById(program.collegeId) : null;

  return (
    <>
      <PageHeader
        eyebrow="Student command centre"
        title="Your admission dashboard"
        description="See your current seat, important deadlines, document readiness, and the next choices available to you."
        action={<StatusBadge tone="info">Synthetic demo data</StatusBadge>}
      />

      <section className="candidate-overview" aria-labelledby="candidate-overview-title">
        <div className="candidate-identity">
          <p>Candidate overview</p>
          <h2 id="candidate-overview-title">{candidate.fullName}</h2>
          <span>{candidate.applicationNumber}</span>
          <dl className="candidate-facts">
            <div><dt>Category</dt><dd>{candidate.category}</dd></div>
            <div><dt>Home university</dt><dd>{candidate.homeUniversity}</dd></div>
          </dl>
        </div>
        <div className="candidate-scores" aria-label="Entrance examination performance">
          <StatCard label="MHT-CET percentile" value={formatPercentile(candidate.cetPercentile)} supportingText="PCM group · Maharashtra state merit" />
          <StatCard label="JEE Main percentile" value={formatPercentile(candidate.jeePercentile)} supportingText="National examination score on record" />
        </div>
      </section>

      <div className="dashboard-priority-grid">
        <SectionCard
          className="current-admission-card"
          title="Your Current Admission"
          description="This is the engineering seat currently secured in your name."
          action={admission ? <StatusBadge tone="success">Seat confirmed</StatusBadge> : undefined}
        >
          {admission && seat && program && college ? (
            <div className="current-seat">
              <div className="seat-heading">
                <p>{college.name}</p>
                <h3>{program.name}</h3>
                <span>{college.city} · Institute code {college.instituteCode}</span>
              </div>

              <dl className="seat-details">
                <div><dt>Admission route</dt><dd>{admissionRouteLabels[admission.source]}</dd></div>
                <div><dt>Allotment round</dt><dd>{admission.allotmentRound}</dd></div>
                <div><dt>Current status</dt><dd>Confirmed and held by you</dd></div>
                <div><dt>Betterment</dt><dd>{admission.bettermentStatus === "ACTIVE" ? "Active" : "Not active"}</dd></div>
              </dl>

              <div className="seat-explanation">
                <span className="seat-explanation-marker" aria-hidden="true">i</span>
                <p>
                  <strong>You can still participate in betterment.</strong>
                  This seat remains yours while you explore eligible betterment and institute-level opportunities.
                </p>
              </div>
            </div>
          ) : (
            <p>No current admission is recorded for this candidate.</p>
          )}
        </SectionCard>

        <DeadlineBanner
          label="Next action"
          title={nextAdmissionDeadline.title}
          deadline={formatShortDeadline(nextAdmissionDeadline.deadlineAt)}
          relativeLabel={formatTimeRemaining(nextAdmissionDeadline.deadlineAt, DEMO_NOW)}
          detail={nextAdmissionDeadline.whyItMatters}
          action={<Link className="deadline-button" href={nextAdmissionDeadline.actionHref}>{nextAdmissionDeadline.actionLabel} →</Link>}
        />
      </div>

      <AdmissionJourney stages={admissionJourneyStages} currentStageId={candidate.currentJourneyStage} />

      <div className="dashboard-detail-grid">
        <DocumentReadiness documents={candidate.documents} />

        <SectionCard
          className="alerts-card"
          title="Important Alerts"
          description="Only the updates that need your attention now."
        >
          <div className="alerts-list">
            {dashboardAlerts.map((alert) => <AdmissionAlert alert={alert} key={alert.id} />)}
          </div>
        </SectionCard>
      </div>

      <section className="dashboard-actions" aria-labelledby="quick-actions-title">
        <div className="dashboard-section-heading">
          <div>
            <h2 id="quick-actions-title">What you can do next</h2>
            <p>Continue your journey without losing sight of the seat you already hold.</p>
          </div>
        </div>
        <nav className="quick-actions" aria-label="Next admission actions">
          {quickActions.map((action) => (
            <Link className="action-card" href={action.href} key={action.href}>
              <span className="action-index" aria-hidden="true">{action.index}</span>
              <strong>{action.title}</strong>
              <span>{action.description}</span>
              <b aria-hidden="true">Open →</b>
            </Link>
          ))}
        </nav>
      </section>
    </>
  );
}
