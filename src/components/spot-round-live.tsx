"use client";

import Link from "next/link";
import { useState } from "react";
import { V2_HERO_OFFER_ROUND_ID } from "@/data";
import {
  buildMeritList,
  getCandidateClearingInterest,
  getCandidateMeritPosition,
  getProgrammeVacancies,
  getRoundAwaitingOffers,
} from "@/services";
import type { OfficialInstitute, OfficialProgram } from "@/types";
import { useAdmissionSimulation } from "./admission-simulation-provider";
import { DocumentReportingPanel } from "./document-reporting-panel";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";

type Decision = "ACCEPT" | "DECLINE" | "RESET" | null;

function formatEventTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function interestStatusLabel(status?: string) {
  if (status === "OFFERED") return "Offer pending";
  if (status === "ACCEPTED") return "Accepted";
  if (status === "CLOSED_AFTER_ACCEPTANCE") return "Withdrawn after another admission";
  if (status === "DECLINED") return "Offer declined";
  if (status === "WITHDRAWN" || !status) return "Not active";
  return "Waiting";
}

export function SpotRoundLive({
  roundId,
  institutes,
  programs,
}: {
  roundId: string;
  institutes: readonly OfficialInstitute[];
  programs: readonly OfficialProgram[];
}) {
  const {
    state,
    lastError,
    advanceClearing,
    acceptMeritOffer,
    declineMeritOffer,
    resetDemo,
    clearError,
  } = useAdmissionSimulation();
  const [decision, setDecision] = useState<Decision>(null);
  const [resetComplete, setResetComplete] = useState(false);
  const round = state.spotRounds.find((item) => item.id === roundId);

  if (!round) {
    return <section className="spot-not-found"><h1>Merit round not found</h1><Link href="/spot-rounds">Return to Spot Rounds</Link></section>;
  }

  const institute = institutes.find((item) => item.code === round.instituteCode);
  const program = programs.find((item) => item.choiceCode === round.programId);
  if (!institute || !program) return null;

  const meritList = buildMeritList(roundId, state);
  const candidatePosition = getCandidateMeritPosition(state, roundId);
  const candidateInterest = getCandidateClearingInterest(state, state.candidateId, roundId);
  const awaitingOffers = getRoundAwaitingOffers(state, roundId);
  const candidateOffer = awaitingOffers.find((offer) => offer.candidateId === state.candidateId);
  const available = getProgrammeVacancies(state, round.programId);
  const outcome = state.clearing.lastOutcome?.roundId === roundId ? state.clearing.lastOutcome : null;
  const previousProgram = outcome ? programs.find((item) => item.choiceCode === outcome.previousProgramId) : undefined;
  const previousInstitute = previousProgram ? institutes.find((item) => item.code === previousProgram.instituteCode) : undefined;
  const recentEvents = [...state.clearing.events]
    .filter((event) => !event.roundId || event.roundId === roundId || event.candidateId === state.candidateId)
    .reverse()
    .slice(0, 8);

  function completeDecision() {
    if (decision === "ACCEPT" && candidateOffer && acceptMeritOffer(candidateOffer.id)) setDecision(null);
    if (decision === "DECLINE" && candidateOffer && declineMeritOffer(candidateOffer.id)) setDecision(null);
    if (decision === "RESET") {
      resetDemo();
      setResetComplete(true);
      setDecision(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Synchronized merit clearing"
        title={institute.commonName}
        description={program.name}
        action={<StatusBadge tone={round.status === "LIVE" ? "danger" : "info"}>{round.status}</StatusBadge>}
      />

      <div className="spot-live-disclaimer">
        <strong>Synthetic clearing data</strong>
        <span>Positions use a simplified global merit rank. This is a proposed prototype model, not a statement of current CET policy.</span>
      </div>

      {resetComplete ? <div className="demo-reset-feedback" role="status"><strong>V2 demo reset complete.</strong><span>The original AISSMS admission, seats, interests, offers, merit lists and document passport were restored. Saved preferences were not changed.</span></div> : null}
      {lastError ? <div className="simulation-error" role="alert"><strong>Clearing action could not be completed.</strong><span>{lastError.message}</span><button type="button" onClick={clearError}>Dismiss</button></div> : null}

      {outcome && previousProgram && previousInstitute ? (
        <section className="clearing-success" aria-labelledby="clearing-success-title">
          <div className="spot-success-check" aria-hidden="true">✓</div>
          <p>Synchronized admission confirmed</p>
          <h2 id="clearing-success-title">{institute.commonName} — {program.name}</h2>
          <span>Aarya now has one active participating admission. Every competing list and affected seat was updated in one domain operation.</span>
          <div className="clearing-success-grid">
            <article><small>New admission</small><strong>{institute.commonName}</strong><span>{program.name}</span></article>
            <article><small>Previous admission</small><strong>{previousInstitute.commonName} released</strong><span>{previousProgram.name}</span></article>
            <article><small>AISSMS availability</small><strong>{outcome.previousAvailabilityBefore} → {outcome.previousAvailabilityAfterRelease}</strong><span>Released exactly once</span></article>
            <article><small>Competing lists</small><strong>{outcome.closedRoundIds.length} closed</strong><span>PICT, PCCOE and MMCOE recomputed</span></article>
          </div>
          {outcome.generatedOfferIds.length ? <p className="clearing-next-offer">The released AISSMS seat immediately produced the next merit offer. Current available count: {outcome.previousAvailabilityCurrent}; the released seat is now counted as offered, not available.</p> : null}
          <DocumentReportingPanel
            instituteCode={institute.code}
            instituteName={institute.commonName}
            programId={program.choiceCode}
            programName={program.name}
            workflowId="SPOT_ROUND"
            compact
          />
          <section className="movement-summary" aria-labelledby="movement-title">
            <h3 id="movement-title">Cascading queue movement</h3>
            <ul>
              {outcome.movements.slice(0, 8).map((movement) => {
                const movedRound = state.spotRounds.find((item) => item.id === movement.roundId);
                const movedProgram = programs.find((item) => item.choiceCode === movedRound?.programId);
                const movedInstitute = institutes.find((item) => item.code === movedRound?.instituteCode);
                return <li key={`${movement.roundId}-${movement.candidateId}`}><strong>{movedInstitute?.commonName} {movedProgram?.name}</strong><span>{movement.displayLabel}: #{movement.fromPosition} → #{movement.toPosition}</span></li>;
              })}
            </ul>
          </section>
          <div className="spot-success-actions"><Link className="primary-link-button" href="/operations">View synchronized operations</Link><Link className="secondary-link-button" href="/vacancies">View live vacancies</Link><button className="secondary-action-button" type="button" onClick={() => setDecision("RESET")}>Reset V2 demo</button></div>
        </section>
      ) : (
        <>
          <section className="clearing-live-metrics" aria-label="Current merit-list status">
            <article><span>Seats represented</span><strong>{round.seatIds.length}</strong><small>exact synthetic seat records</small></article>
            <article><span>Seats available</span><strong>{available}</strong><small>offered seats excluded</small></article>
            <article><span>Your merit position</span><strong>{candidatePosition ? `#${candidatePosition.position}` : "—"}</strong><small>{candidatePosition ? `${candidatePosition.position - 1} candidate${candidatePosition.position === 2 ? "" : "s"} ahead` : interestStatusLabel(candidateInterest?.status)}</small></article>
            <article><span>Offers pending</span><strong>{awaitingOffers.length}</strong><small>limited by available seats</small></article>
          </section>

          {roundId === V2_HERO_OFFER_ROUND_ID && state.clearing.heroScenario.status === "READY" ? (
            <section className="clearing-trigger-card">
              <div><p>Deterministic demo event</p><h2>Advance the VIT merit list</h2><span>Two higher-ranked candidates confirm other choices. Aarya moves from #3 to the next offerable position.</span></div>
              <button className="primary-action-button" type="button" onClick={advanceClearing}>Make VIT seat offerable</button>
            </section>
          ) : null}

          {candidateOffer ? (
            <section className="clearing-offer-card" aria-labelledby="offer-title">
              <div><p>Offer pending</p><h2 id="offer-title">{institute.commonName} — {program.name}</h2><span>Exact seat: {candidateOffer.seatId}</span></div>
              <div className="offer-consequence">
                <strong>Before you decide</strong>
                <p>Accepting makes this your only participating admission, releases your AISSMS Computer seat, and closes PICT, PCCOE and MMCOE interests immediately.</p>
              </div>
              <DocumentReportingPanel
                instituteCode={institute.code}
                instituteName={institute.commonName}
                programId={program.choiceCode}
                programName={program.name}
                workflowId="SPOT_ROUND"
                compact
              />
              <div className="clearing-offer-actions"><button className="primary-action-button" type="button" onClick={() => setDecision("ACCEPT")}>Accept VIT seat</button><button className="secondary-action-button" type="button" onClick={() => setDecision("DECLINE")}>Decline offer</button></div>
            </section>
          ) : null}

          <div className="clearing-detail-grid">
            <section className="live-merit-list" aria-labelledby="merit-list-title">
              <header><div><p>Live merit list</p><h2 id="merit-list-title">Ranked candidate queue</h2></div><span>{meritList.length} active</span></header>
              {meritList.length ? <ol>
                {meritList.slice(0, 10).map((entry) => <li className={entry.isDemoCandidate ? "is-aarya" : ""} key={entry.candidateId}><span>#{entry.position}</span><div><strong>{entry.displayLabel}</strong><small>Synthetic merit {entry.meritRank}</small></div><em>{entry.status === "OFFERED" ? "OFFERED" : "WAITING"}</em></li>)}
              </ol> : <p className="empty-merit-list">No active candidates remain in this merit list.</p>}
            </section>

            <section className="clearing-event-log" aria-labelledby="clearing-log-title">
              <header><p>Shared state</p><h2 id="clearing-log-title">Clearing event log</h2></header>
              <ol>{recentEvents.map((event) => <li key={event.id}><time>{formatEventTime(event.occurredAt)}</time><div><strong>{event.title}</strong><span>{event.description}</span></div></li>)}</ol>
              <Link href="/operations">Open technical operations view →</Link>
            </section>
          </div>
        </>
      )}

      <div className="spot-back-row"><Link href="/spot-rounds">← All merit rounds</Link><Link href="/operations">Prototype operations view</Link></div>

      {decision ? (
        <div className="confirmation-overlay" role="presentation">
          <section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="clearing-confirmation-title">
            <p>Confirm clearing action</p>
            <h2 id="clearing-confirmation-title">{decision === "ACCEPT" ? "Accept VIT Computer Engineering?" : decision === "DECLINE" ? "Decline this seat offer?" : "Reset the V2 demo?"}</h2>
            <span>{decision === "ACCEPT" ? "Your AISSMS seat will release and all other active merit-list interests will close immediately." : decision === "DECLINE" ? "The exact VIT seat will move to the next eligible candidate." : "Seats, candidates, offers, queues, document consent and event history return to the deterministic starting state. Preferences remain unchanged."}</span>
            <div><button className={decision === "ACCEPT" ? "primary-action-button" : "danger-action-button"} type="button" onClick={completeDecision}>{decision === "ACCEPT" ? "Confirm and accept seat" : decision === "DECLINE" ? "Confirm decline" : "Reset demo now"}</button><button className="secondary-action-button" type="button" onClick={() => setDecision(null)}>Go back</button></div>
          </section>
        </div>
      ) : null}
    </>
  );
}
