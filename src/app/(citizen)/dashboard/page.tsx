import Link from "next/link";
import { DeadlineBanner, PageHeader, SectionCard, StatCard, StatusBadge } from "@/components";
import { demoCandidate, colleges, programs } from "@/data";
import { formatDateTime, formatPercentile } from "@/lib/format";
import { mockAdmissionService, mockSeatService } from "@/services";

export default async function DashboardPage() {
  const admission = await mockAdmissionService.getCurrentAdmission(demoCandidate.id);
  const seat = admission ? await mockSeatService.getSeatById(admission.seatId) : null;
  const program = seat ? programs.find((item) => item.id === seat.programId) : null;
  const college = program ? colleges.find((item) => item.id === program.collegeId) : null;
  const requiredDocuments = demoCandidate.documents.filter((document) => document.status !== "NOT_REQUIRED");
  const readyDocuments = requiredDocuments.filter((document) => document.status === "VERIFIED" || document.status === "UPLOADED");
  const documentPercent = Math.round((readyDocuments.length / requiredDocuments.length) * 100);

  return (
    <>
      <PageHeader
        eyebrow="Student overview"
        title={`Welcome, ${demoCandidate.fullName.split(" ")[0]}`}
        description="Your admission position, deadlines, and next steps are collected in one place."
        action={<StatusBadge tone="success">Profile active</StatusBadge>}
      />

      <div className="metrics-grid" aria-label="Candidate profile summary">
        <StatCard label="MHT-CET percentile" value={formatPercentile(demoCandidate.cetPercentile)} supportingText="Engineering · PCM group" />
        <StatCard label="JEE Main percentile" value={formatPercentile(demoCandidate.jeePercentile)} supportingText="Session score on record" />
        <StatCard label="Category" value={demoCandidate.category} supportingText="SPPU home university" />
        <StatCard label="Documents ready" value={`${readyDocuments.length}/${requiredDocuments.length}`} supportingText={`${documentPercent}% of required documents ready`} />
      </div>

      {admission ? (
        <DeadlineBanner
          label="Next important action"
          title="Complete institute reporting for your CAP allotment"
          detail={`Deadline: ${formatDateTime(admission.reportingDeadline)}`}
          action={<Link className="text-link" href="/admission">View admission →</Link>}
        />
      ) : null}

      <div className="content-grid">
        <SectionCard title="Current admission" description="Your latest confirmed seat in the unified admission state.">
          {admission && seat && program && college ? (
            <div className="admission-card">
              <div className="admission-heading">
                <div>
                  <h3>{program.name}</h3>
                  <p>{college.name}</p>
                </div>
                <StatusBadge tone="success">Confirmed</StatusBadge>
              </div>
              <dl className="admission-details">
                <div><dt>Allotment</dt><dd>{admission.allotmentRound}</dd></div>
                <div><dt>Seat category</dt><dd>{seat.category}</dd></div>
                <div><dt>Institute code</dt><dd>{college.instituteCode}</dd></div>
              </dl>
            </div>
          ) : (
            <p>No current admission is recorded.</p>
          )}
        </SectionCard>

        <SectionCard title="Document readiness" description="Based on required documents for this demo profile.">
          <div className="document-summary">
            <div className="document-score" aria-label={`${documentPercent} percent ready`}>{documentPercent}%</div>
            <div>
              <h3>{readyDocuments.length} documents ready</h3>
              <p>One nationality document still needs attention before future admission activity.</p>
            </div>
          </div>
        </SectionCard>
      </div>

      <nav className="quick-actions" aria-label="Common admission actions">
        <Link className="action-card" href="/explore">
          <strong>Explore Colleges</strong>
          <span>Review the synthetic college and branch dataset.</span>
          <b aria-hidden="true">Open →</b>
        </Link>
        <Link className="action-card" href="/preferences">
          <strong>Review Preferences</strong>
          <span>See where preference planning will be added.</span>
          <b aria-hidden="true">Open →</b>
        </Link>
        <Link className="action-card" href="/vacancies">
          <strong>View Live Vacancies</strong>
          <span>Enter the centralized vacancy experience.</span>
          <b aria-hidden="true">Open →</b>
        </Link>
      </nav>
    </>
  );
}
