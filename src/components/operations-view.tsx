"use client";

import Link from "next/link";
import { V2_HERO_OFFER_ROUND_ID } from "@/data";
import { buildMeritList, getProgrammeVacancies, getRoundAwaitingOffers, getWorkflowReadiness } from "@/services";
import type { OfficialInstitute, OfficialProgram } from "@/types";
import { useAdmissionSimulation } from "./admission-simulation-provider";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";

const featuredRoundIds = [
  "spot-pict-entc-live",
  V2_HERO_OFFER_ROUND_ID,
  "spot-pccoe-aiml-upcoming",
  "spot-mmcoe-computer-upcoming",
  "spot-aissms-computer-clearing",
] as const;

function formatEventTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export function OperationsView({
  institutes,
  programs,
}: {
  institutes: readonly OfficialInstitute[];
  programs: readonly OfficialProgram[];
}) {
  const { state, advanceClearing, lastError, clearError } = useAdmissionSimulation();
  const featuredRounds = featuredRoundIds.flatMap((roundId) => {
    const round = state.spotRounds.find((item) => item.id === roundId);
    return round ? [round] : [];
  });
  const reportingReadiness = getWorkflowReadiness(state, "INSTITUTE_REPORTING");
  const currentAdmission = state.currentAdmission;
  const admissionProgram = currentAdmission?.kind === "PARTICIPATING_SEAT"
    ? programs.find((item) => item.choiceCode === currentAdmission.programId)
    : undefined;
  const admissionInstitute = admissionProgram
    ? institutes.find((item) => item.code === admissionProgram.instituteCode)
    : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Prototype operations view"
        title="Merit Clearing Operations"
        description="The authority and institution perspective on the same central clearing state used throughout the student journey."
        action={<StatusBadge tone="warning">Synthetic clearing data</StatusBadge>}
      />

      <section className="operations-principle" aria-labelledby="operations-principle-title">
        <div><p>Central allocation authority</p><h2 id="operations-principle-title">Merit order + declared interest + available seat state</h2><span>Institutes cannot manually reorder or select candidates in this prototype.</span></div>
        {state.clearing.heroScenario.status === "READY" ? <button className="primary-action-button" type="button" onClick={advanceClearing}>Run deterministic VIT event</button> : <Link className="secondary-link-button" href={`/spot-rounds/${V2_HERO_OFFER_ROUND_ID}`}>{state.clearing.heroScenario.status === "OFFER_READY" ? "Review Aarya's VIT offer" : "View synchronized outcome"}</Link>}
      </section>

      <section className="operations-document-readiness" aria-labelledby="operations-document-title">
        <div><p>Minimum necessary status</p><h2 id="operations-document-title">Document readiness</h2><span>Candidate Aarya · Admission: {admissionInstitute && admissionProgram ? `${admissionInstitute.commonName} ${admissionProgram.name}` : "No participating admission"}</span></div>
        <dl><div><dt>Verified required documents</dt><dd>{reportingReadiness.readyCount}/{reportingReadiness.requiredCount}</dd></div><div><dt>Status</dt><dd>{!reportingReadiness.ready ? "Needs student attention" : state.documentPassport.providerConnection.status === "CONNECTED" ? "Ready for institute verification" : "Verified; student consent required"}</dd></div></dl>
        <small>No document contents or identifiers are exposed in this operations view.</small>
      </section>

      {lastError ? <div className="simulation-error" role="alert"><strong>Operation could not be completed.</strong><span>{lastError.message}</span><button type="button" onClick={clearError}>Dismiss</button></div> : null}

      <section className="operations-rounds" aria-label="Participating programme operations">
        {featuredRounds.map((round) => {
          const institute = institutes.find((item) => item.code === round.instituteCode);
          const program = programs.find((item) => item.choiceCode === round.programId);
          if (!institute || !program) return null;
          const meritList = buildMeritList(round.id, state);
          const offers = getRoundAwaitingOffers(state, round.id);
          const available = getProgrammeVacancies(state, round.programId);
          const filled = state.seats.filter((seat) => round.seatIds.includes(seat.id) && ["HELD", "ACCEPTED"].includes(seat.lifecycleState)).length;
          const nextEligible = meritList.find((entry) => entry.status !== "OFFERED");
          return (
            <article className="operations-round" key={round.id}>
              <header>
                <div><p>{institute.commonName}</p><h2>{program.name}</h2><span>Choice code {program.choiceCode}</span></div>
                <StatusBadge tone={round.status === "LIVE" ? "danger" : "info"}>{round.status}</StatusBadge>
              </header>
              <dl className="operations-seat-summary">
                <div><dt>Seats represented</dt><dd>{round.seatIds.length}</dd></div>
                <div><dt>Filled</dt><dd>{filled}</dd></div>
                <div><dt>Available</dt><dd>{available}</dd></div>
                <div><dt>Currently offered</dt><dd>{offers.length}</dd></div>
                <div><dt>Active candidates</dt><dd>{meritList.length}</dd></div>
              </dl>
              <div className="operations-list-heading"><strong>Live merit list</strong><span>Next eligible: {nextEligible?.displayLabel ?? "None"}</span></div>
              <ol className="operations-merit-list">
                {meritList.slice(0, 8).map((entry) => <li className={entry.isDemoCandidate ? "is-aarya" : ""} key={entry.candidateId}><span>#{entry.position}</span><strong>{entry.displayLabel}</strong><small>Merit {entry.meritRank}</small><em>{entry.status === "OFFERED" ? "OFFERED" : "WAITING"}</em></li>)}
              </ol>
              <Link href={`/spot-rounds/${round.id}`}>Open programme detail →</Link>
            </article>
          );
        })}
      </section>

      <section className="operations-event-log" aria-labelledby="operations-log-title">
        <header><div><p>Append-only prototype record</p><h2 id="operations-log-title">Clearing events</h2></div><span>{state.clearing.events.length} events</span></header>
        <ol>{[...state.clearing.events].reverse().map((event) => <li key={event.id}><time>{formatEventTime(event.occurredAt)}</time><div><strong>{event.title}</strong><span>{event.description}</span><small>{event.technicalDetail}</small></div></li>)}</ol>
      </section>
    </>
  );
}
