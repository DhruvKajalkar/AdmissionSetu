"use client";

import Link from "next/link";
import { useState } from "react";
import {
  getCandidateSpotStatus,
  getSpotRoundAvailableSeats,
  isActiveSpotInterest,
} from "@/services";
import type { OfficialInstitute, OfficialProgram } from "@/types";
import { useAdmissionSimulation } from "./admission-simulation-provider";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";

type PendingDecision = "ACCEPT" | "DECLINE" | "EXPIRE" | "RESET" | null;

function formatEventTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
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
    joinRound,
    leaveRound,
    advanceRound,
    acceptRoundOffer,
    declineRoundOffer,
    expireRoundOffer,
    resetDemo,
    clearError,
  } = useAdmissionSimulation();
  const [pendingDecision, setPendingDecision] = useState<PendingDecision>(null);
  const round = state.spotRounds.find((item) => item.id === roundId);

  if (!round) {
    return <section className="spot-not-found"><h1>Spot round not found</h1><Link href="/spot-rounds">Return to Spot Rounds</Link></section>;
  }

  const institute = institutes.find((item) => item.code === round.instituteCode);
  const program = programs.find((item) => item.choiceCode === round.programId);
  const candidateStatus = getCandidateSpotStatus(round);
  const active = isActiveSpotInterest(candidateStatus);
  const available = getSpotRoundAvailableSeats(state, round.id);
  const outcome = state.lastSpotRoundOutcome?.roundId === round.id ? state.lastSpotRoundOutcome : null;
  const previousProgram = outcome ? programs.find((item) => item.choiceCode === outcome.previousProgramId) : undefined;
  const previousInstitute = previousProgram ? institutes.find((item) => item.code === previousProgram.instituteCode) : undefined;
  const offerAwaiting = round.offer?.status === "AWAITING_DECISION";
  const accepted = outcome?.status === "ACCEPTED";
  const liveRoundId = round.id;

  function completeDecision(decision: PendingDecision) {
    let succeeded = false;
    if (decision === "ACCEPT") succeeded = acceptRoundOffer(liveRoundId);
    if (decision === "DECLINE") succeeded = declineRoundOffer(liveRoundId);
    if (decision === "EXPIRE") succeeded = expireRoundOffer(liveRoundId);
    if (decision === "RESET") {
      resetDemo();
      succeeded = true;
    }
    if (succeeded) setPendingDecision(null);
  }

  if (!institute || !program) return null;

  return (
    <>
      <PageHeader
        eyebrow="Centralized live online spot round"
        title={institute.commonName}
        description={program.name}
        action={<StatusBadge tone={round.status === "LIVE" ? "danger" : "info"}>{round.status}</StatusBadge>}
      />

      <div className="spot-live-disclaimer">
        <strong>Demo live simulation</strong>
        <span>This is a deterministic prototype queue. It is not a real institute round or admission authority.</span>
      </div>

      {lastError ? (
        <div className="simulation-error" role="alert">
          <strong>Demo event could not be completed.</strong><span>{lastError.message}</span>
          <button type="button" onClick={clearError}>Dismiss</button>
        </div>
      ) : null}

      {accepted && outcome && previousProgram && previousInstitute ? (
        <section className="spot-admission-success" aria-labelledby="spot-success-title">
          <div className="spot-success-check" aria-hidden="true">✓</div>
          <p>Admission confirmed</p>
          <h1 id="spot-success-title">{institute.commonName}</h1>
          <h2>{program.name}</h2>
          <div className="spot-success-grid">
            <article><span>New admission</span><strong>{institute.commonName} — {program.name}</strong><small>Accepted through the demo live spot round</small></article>
            <article><span>Previous admission</span><strong>{previousInstitute.commonName} — {previousProgram.name}</strong><small>Released</small></article>
            <article><span>Remaining spot interests</span><strong>Closed</strong><small>{outcome.closedInterestCount} active interest{outcome.closedInterestCount === 1 ? " was" : "s were"} withdrawn</small></article>
            <article><span>Seat system</span><strong>{previousInstitute.commonName} vacancy returned</strong><small>{outcome.previousAvailabilityBefore} → {outcome.previousAvailabilityAfter}</small></article>
          </div>
          <p className="spot-success-explanation">Your remaining active spot-round interests were closed after you confirmed this seat.</p>
          <div className="spot-success-actions"><Link className="primary-link-button" href="/vacancies">View Updated Vacancies</Link><Link className="secondary-link-button" href="/dashboard">Open dashboard</Link></div>
        </section>
      ) : (
        <>
          {outcome?.status === "DECLINED" || outcome?.status === "EXPIRED" ? (
            <section className="spot-resolution-card" role="status">
              <p>{outcome.status === "DECLINED" ? "Offer declined" : "Demo offer expired"}</p>
              <h2>Your AISSMS admission remains unchanged</h2>
              <p>The offered PICT seat returned to the synthetic live round so the next eligible participant can move forward.</p>
              <button className="secondary-action-button" type="button" onClick={() => setPendingDecision("RESET")}>Reset Demo</button>
            </section>
          ) : null}

          <section className="spot-live-metrics" aria-label="Live round summary">
            <article><span>Seats available</span><strong>{available}</strong><small>derived from Phase 4 seat records</small></article>
            <article><span>Your merit queue position</span><strong>{round.queuePosition}</strong><small>deterministic synthetic order</small></article>
            <article><span>Candidates ahead</span><strong>{round.candidatesAhead}</strong><small>active entries before you</small></article>
            <article><span>Active candidates</span><strong>{round.activeCandidates}</strong><small>anonymous demo participants</small></article>
          </section>

          {!active && !outcome && round.status !== "COMPLETED" ? (
            <section className="spot-join-hero">
              <div><p>Not yet in this queue</p><h2>Join the deterministic live merit queue</h2><span>Aarya will begin at queue position {round.queuePosition}. Joining does not release the current AISSMS seat.</span></div>
              <button className="primary-action-button" type="button" onClick={() => joinRound(round.id)}>Join Spot Round</button>
            </section>
          ) : null}

          {active && !offerAwaiting ? (
            <section className="spot-waiting-status" role="status" aria-live="polite">
              <span className="spot-live-pulse" aria-hidden="true" />
              <div><p>{candidateStatus === "ELIGIBLE" ? "You are next for an offer" : "You are currently waiting"}</p><small>The queue changes only when you use the deterministic demo controller.</small></div>
            </section>
          ) : null}

          {offerAwaiting && round.offer ? (
            <section className="spot-offer-panel" aria-labelledby="spot-offer-title" aria-live="assertive">
              <div className="spot-offer-heading"><div><p>Seat offered to you</p><h2 id="spot-offer-title">{institute.commonName} · {program.name}</h2><span>Awaiting your decision</span></div><div className="spot-countdown"><span>Demo decision window</span><strong>{formatCountdown(round.offer.remainingSeconds)} remaining</strong><small>Simulated timer — no real policy</small></div></div>
              <div className="spot-offer-consequence"><div><span>Current seat</span><strong>AISSMS COE</strong><small>Computer Engineering</small></div><span aria-hidden="true">→</span><div><span>New seat</span><strong>{institute.commonName}</strong><small>{program.name}</small></div></div>
              <p>Accepting will use the shared admission engine to release the AISSMS seat exactly once, confirm this PICT seat, and close your other active spot interests.</p>
              <div className="spot-offer-actions"><button className="primary-action-button" type="button" onClick={() => setPendingDecision("ACCEPT")}>Accept Seat</button><button className="secondary-action-button" type="button" onClick={() => setPendingDecision("DECLINE")}>Decline</button><button className="spot-expiry-button" type="button" onClick={() => setPendingDecision("EXPIRE")}>Simulate Offer Expiry</button></div>
            </section>
          ) : null}

          {active && !offerAwaiting ? (
            <section className="spot-demo-controller" aria-labelledby="demo-controller-title">
              <div><p>Prototype-only control</p><h2 id="demo-controller-title">Advance the live round without waiting</h2><span>Event {round.progressStep} of 5 completed. The same sequence runs after every Reset Demo.</span></div>
              <div><button className="primary-action-button" type="button" disabled={round.progressStep >= 5} onClick={() => advanceRound(round.id)}>Advance Demo Event</button><button className="spot-leave-button" type="button" onClick={() => leaveRound(round.id)}>Leave Round</button></div>
            </section>
          ) : null}

          <section className="spot-event-stream" aria-labelledby="spot-event-stream-title" aria-live="polite">
            <div><p>Human-readable live updates</p><h2 id="spot-event-stream-title">Round activity</h2></div>
            <ol>
              {[...round.events].reverse().map((event) => (
                <li key={event.id}><time dateTime={event.occurredAt}>{formatEventTime(event.occurredAt)}</time><span aria-hidden="true" /><div><strong>{event.title}</strong><p>{event.description}</p>{event.availabilityBefore !== undefined ? <small>Seats available: {event.availabilityBefore} → {event.availabilityAfter}</small> : null}</div></li>
              ))}
            </ol>
          </section>
        </>
      )}

      {pendingDecision ? (
        <section className="simulation-confirmation" role="alertdialog" aria-modal="false" aria-labelledby="spot-decision-title">
          <div>
            <p>Confirm demo action</p>
            <h2 id="spot-decision-title">{pendingDecision === "ACCEPT" ? "Accept PICT ENTC?" : pendingDecision === "DECLINE" ? "Decline this offer?" : pendingDecision === "EXPIRE" ? "Simulate offer expiry?" : "Reset the complete demo?"}</h2>
            <p>{pendingDecision === "ACCEPT" ? "PICT ENTC will become your one active admission. AISSMS Computer Engineering will be released and its vacancy will increase from 2 to 3." : pendingDecision === "RESET" ? "The original AISSMS seat, queues, interests, offers and deterministic event progress will be restored. Phase 3 preferences will remain untouched." : "The PICT seat will return to the live round. Your current AISSMS Computer Engineering admission will remain held."}</p>
          </div>
          <div><button className="secondary-action-button" type="button" onClick={() => setPendingDecision(null)}>Cancel</button><button className={pendingDecision === "RESET" ? "danger-action-button" : "primary-action-button"} type="button" onClick={() => completeDecision(pendingDecision)}>{pendingDecision === "ACCEPT" ? "Confirm Acceptance" : pendingDecision === "DECLINE" ? "Confirm Decline" : pendingDecision === "EXPIRE" ? "Expire Demo Offer" : "Reset Demo"}</button></div>
        </section>
      ) : null}

      <p className="spot-back-link"><Link className="text-link" href="/spot-rounds">← Back to all spot rounds</Link></p>
    </>
  );
}
