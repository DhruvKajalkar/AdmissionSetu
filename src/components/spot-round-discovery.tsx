"use client";

import Link from "next/link";
import { MAX_ACTIVE_SPOT_INTERESTS, V2_HERO_OFFER_ROUND_ID } from "@/data";
import {
  getActiveClearingInterestCount,
  getCandidateClearingInterest,
  getCandidateMeritPosition,
  getProgrammeVacancies,
  getRoundAwaitingOffers,
  isActiveClearingInterest,
} from "@/services";
import type { ClearingInterestStatus, OfficialInstitute, OfficialProgram, SpotRoundStatus } from "@/types";
import { useAdmissionSimulation } from "./admission-simulation-provider";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";

function toneForStatus(status: SpotRoundStatus) {
  if (status === "LIVE") return "danger" as const;
  if (status === "UPCOMING") return "info" as const;
  return "neutral" as const;
}

function interestLabel(status?: ClearingInterestStatus) {
  if (!status || status === "WITHDRAWN") return "Not joined";
  if (status === "OFFERED") return "Offer pending";
  if (status === "ACCEPTED") return "Accepted";
  if (status === "CLOSED_AFTER_ACCEPTANCE") return "Withdrawn after another admission";
  if (status === "DECLINED") return "Offer declined";
  return status === "ELIGIBLE" ? "Next eligible" : "Waiting";
}

export function SpotRoundDiscovery({
  institutes,
  programs,
}: {
  institutes: readonly OfficialInstitute[];
  programs: readonly OfficialProgram[];
}) {
  const {
    state,
    lastError,
    joinMeritRound,
    leaveMeritRound,
    advanceClearing,
    clearError,
  } = useAdmissionSimulation();
  const activeCount = getActiveClearingInterestCount(state);
  const atLimit = activeCount >= MAX_ACTIVE_SPOT_INTERESTS;
  const aarya = state.clearing.candidates.find((candidate) => candidate.candidateId === state.candidateId);
  const heroOffer = state.clearing.offers.find(
    (offer) => offer.candidateId === state.candidateId && offer.status === "AWAITING_DECISION",
  );

  return (
    <>
      <PageHeader
        eyebrow="Synchronized merit clearing"
        title="Spot Rounds"
        description="Join merit-ranked programme lists. One acceptance synchronizes every active interest and the central seat inventory."
        action={<StatusBadge tone="danger">Synthetic live clearing</StatusBadge>}
      />

      <section className="clearing-intro" aria-labelledby="clearing-intro-title">
        <div>
          <p>Proposed AdmissionSetu model</p>
          <h2 id="clearing-intro-title">One merit state across participating rounds</h2>
          <span>Positions use a simplified global synthetic merit rank. This does not reproduce every official reservation or candidature rule.</span>
        </div>
        <dl>
          <div><dt>Your synthetic merit rank</dt><dd>{aarya?.meritRank ?? "—"}</dd></div>
          <div><dt>Active interests</dt><dd>{activeCount} / {MAX_ACTIVE_SPOT_INTERESTS}</dd></div>
        </dl>
        <Link className="secondary-link-button" href="/operations">Open prototype operations view</Link>
      </section>

      {state.clearing.heroScenario.status === "READY" ? (
        <aside className="clearing-hero-event" aria-labelledby="clearing-event-title">
          <div>
            <p>Deterministic demo event</p>
            <h2 id="clearing-event-title">A VIT Computer seat can now move to Aarya by merit</h2>
            <span>Two higher-ranked candidates confirm other choices. Recompute the VIT list and allocate its exact available seats.</span>
          </div>
          <button className="primary-action-button" type="button" onClick={advanceClearing}>Make VIT seat offerable</button>
        </aside>
      ) : heroOffer ? (
        <aside className="clearing-offer-banner" role="status">
          <div><p>Action required</p><h2>VIT Computer Engineering offer pending</h2><span>An exact seat is reserved for your decision.</span></div>
          <Link className="primary-link-button" href={`/spot-rounds/${V2_HERO_OFFER_ROUND_ID}`}>Review seat offer</Link>
        </aside>
      ) : state.clearing.heroScenario.status === "ACCEPTED" ? (
        <aside className="clearing-accepted-banner" role="status">
          <div><p>Synchronized</p><h2>VIT accepted; competing merit lists updated</h2><span>Aarya now has one current participating admission.</span></div>
          <Link className="primary-link-button" href={`/spot-rounds/${V2_HERO_OFFER_ROUND_ID}`}>View clearing outcome</Link>
        </aside>
      ) : null}

      {lastError ? (
        <div className="simulation-error" role="alert">
          <strong>Clearing action could not be completed.</strong>
          <span>{lastError.message}</span>
          <button type="button" onClick={clearError}>Dismiss</button>
        </div>
      ) : null}

      <section className="merit-round-grid" aria-label="Synthetic merit-ranked programme rounds">
        {state.spotRounds.filter((round) => round.status !== "COMPLETED").map((round) => {
          const institute = institutes.find((item) => item.code === round.instituteCode);
          const program = programs.find((item) => item.choiceCode === round.programId);
          if (!institute || !program) return null;
          const interest = getCandidateClearingInterest(state, state.candidateId, round.id);
          const position = getCandidateMeritPosition(state, round.id);
          const active = interest ? isActiveClearingInterest(interest.status) : false;
          const pendingOffer = getRoundAwaitingOffers(state, round.id).some(
            (offer) => offer.candidateId === state.candidateId,
          );
          const available = getProgrammeVacancies(state, round.programId);
          return (
            <article className="merit-round-card" key={round.id}>
              <header>
                <div><span>{institute.commonName}</span><StatusBadge tone={toneForStatus(round.status)}>{round.status}</StatusBadge></div>
                <small>Choice code {program.choiceCode}</small>
              </header>
              <h2>{program.name}</h2>
              <dl>
                <div><dt>Merit position</dt><dd>{position ? `#${position.position}` : "—"}</dd></div>
                <div><dt>Candidates ahead</dt><dd>{position ? position.position - 1 : "—"}</dd></div>
                <div><dt>Seats available</dt><dd>{available}</dd></div>
                <div><dt>Your status</dt><dd>{interestLabel(interest?.status)}</dd></div>
              </dl>
              <div className="merit-round-actions">
                {(active || pendingOffer || interest?.status === "ACCEPTED" || interest?.status === "CLOSED_AFTER_ACCEPTANCE") ? (
                  <Link className={pendingOffer ? "primary-link-button" : "secondary-link-button"} href={`/spot-rounds/${round.id}`}>
                    {pendingOffer ? "Review seat offer" : "Open merit list"}
                  </Link>
                ) : null}
                {active && !pendingOffer ? <button type="button" className="spot-leave-button" onClick={() => leaveMeritRound(round.id)}>Leave list</button> : null}
                {!interest || ["WITHDRAWN", "DECLINED"].includes(interest.status) ? (
                  <button type="button" className="spot-join-button" disabled={atLimit || aarya?.status === "ADMITTED"} onClick={() => joinMeritRound(round.id)}>Join merit list</button>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>

      <p className="spot-data-note">Candidate identities, ranks, interests, seats, offers and clearing events are synthetic. Institute and programme reference data remains sourced separately from the public CET catalog.</p>
    </>
  );
}
