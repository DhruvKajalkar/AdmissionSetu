"use client";

import Link from "next/link";
import { MAX_ACTIVE_SPOT_INTERESTS } from "@/data";
import {
  getActiveSpotInterestCount,
  getCandidateSpotStatus,
  getSpotRoundAvailableSeats,
  isActiveSpotInterest,
} from "@/services";
import type { OfficialInstitute, OfficialProgram, SpotRoundStatus } from "@/types";
import { useAdmissionSimulation } from "./admission-simulation-provider";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";

function formatRoundTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function toneForStatus(status: SpotRoundStatus) {
  if (status === "LIVE") return "danger" as const;
  if (status === "UPCOMING") return "info" as const;
  if (status === "PAUSED") return "warning" as const;
  return "neutral" as const;
}

export function SpotRoundDiscovery({
  institutes,
  programs,
}: {
  institutes: readonly OfficialInstitute[];
  programs: readonly OfficialProgram[];
}) {
  const { state, lastError, joinRound, leaveRound, clearError } = useAdmissionSimulation();
  const activeCount = getActiveSpotInterestCount(state);
  const atLimit = activeCount >= MAX_ACTIVE_SPOT_INTERESTS;

  return (
    <>
      <PageHeader
        eyebrow="Centralized institute admissions"
        title="Spot Rounds"
        description="Track institute-level vacancies and participate from one place instead of following separate college notices."
        action={<StatusBadge tone="danger">Demo live simulation</StatusBadge>}
      />

      <section className="spot-participation-summary" aria-labelledby="spot-limit-title">
        <div>
          <p>AdmissionSetu prototype participation limit</p>
          <h2 id="spot-limit-title">Active interests: {activeCount} / {MAX_ACTIVE_SPOT_INTERESTS}</h2>
          <p>This proposed product rule makes registrations meaningful. It is not an existing Maharashtra CET rule.</p>
        </div>
        <div className="spot-limit-meter" aria-label={`${activeCount} of ${MAX_ACTIVE_SPOT_INTERESTS} active spot-round interests`}>
          {Array.from({ length: MAX_ACTIVE_SPOT_INTERESTS }, (_, index) => (
            <span className={index < activeCount ? "filled" : ""} key={index} />
          ))}
        </div>
      </section>

      <aside className="schedule-overlap-banner" aria-labelledby="schedule-overlap-title">
        <span aria-hidden="true">↔</span>
        <div>
          <p>Schedule overlap</p>
          <h2 id="schedule-overlap-title">PICT starts at 10:00 AM while VIT Pune starts at 10:15 AM</h2>
          <p>You can remain registered in both. AdmissionSetu manages your live status and shows when an offer requires action—there is no need to be physically present at two institutes.</p>
        </div>
      </aside>

      {lastError ? (
        <div className="simulation-error" role="alert">
          <strong>Spot-round action could not be completed.</strong>
          <span>{lastError.message}</span>
          <button type="button" onClick={clearError}>Dismiss</button>
        </div>
      ) : null}

      {atLimit ? (
        <div className="spot-limit-warning" role="status">
          <strong>5 / 5 active spot rounds</strong>
          <span>Leave one active round before joining another. This is an AdmissionSetu prototype participation limit.</span>
        </div>
      ) : null}

      <section className="spot-round-grid" aria-label="Synthetic spot rounds">
        {state.spotRounds.map((round) => {
          const institute = institutes.find((item) => item.code === round.instituteCode);
          const program = programs.find((item) => item.choiceCode === round.programId);
          if (!institute || !program) return null;
          const candidateStatus = getCandidateSpotStatus(round);
          const active = isActiveSpotInterest(candidateStatus);
          const available = getSpotRoundAvailableSeats(state, round.id);
          const completed = round.status === "COMPLETED";
          const accepted = candidateStatus === "ACCEPTED";
          return (
            <article className={`spot-round-card ${round.status.toLowerCase()}`} key={round.id}>
              <div className="spot-round-card-heading">
                <div>
                  <span>{institute.commonName}</span>
                  <StatusBadge tone={toneForStatus(round.status)}>{round.status}</StatusBadge>
                </div>
                {round.scheduleConflictRoundIds.length ? <em>Schedule overlap</em> : null}
              </div>
              <h2>{program.name}</h2>
              <p>{institute.name}</p>
              <dl>
                <div><dt>Synthetic seats available</dt><dd>{available}</dd></div>
                <div><dt>{round.status === "LIVE" ? "Started" : "Starts"}</dt><dd>{formatRoundTime(round.startsAt)}</dd></div>
                <div><dt>Your state</dt><dd>{accepted ? "Accepted" : active ? candidateStatus : "Not joined"}</dd></div>
              </dl>
              <div className="spot-round-card-actions">
                {accepted ? <Link className="primary-link-button" href={`/spot-rounds/${round.id}`}>View admission</Link> : null}
                {!accepted && active && round.status === "LIVE" ? <Link className="primary-link-button" href={`/spot-rounds/${round.id}`}>View Live Round</Link> : null}
                {!accepted && active ? <button className="spot-leave-button" type="button" onClick={() => leaveRound(round.id)}>Leave Round</button> : null}
                {!accepted && !active && !completed ? (
                  <button className="spot-join-button" type="button" disabled={atLimit} onClick={() => joinRound(round.id)}>
                    Join Spot Round
                  </button>
                ) : null}
                {completed ? <button type="button" disabled>Round completed</button> : null}
              </div>
            </article>
          );
        })}
      </section>

      <p className="spot-data-note">All seats, queues, applicants, offers, withdrawals, timing and round states on this page are synthetic. Institute and programme identities are sourced separately from the public CET catalog.</p>
    </>
  );
}
