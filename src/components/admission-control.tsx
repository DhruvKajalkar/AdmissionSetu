"use client";

import Link from "next/link";
import { useState } from "react";
import { getAdmissionEvents, getProgrammeVacancies } from "@/services/admission-state";
import type { OfficialInstitute, OfficialProgram } from "@/types";
import { useAdmissionSimulation } from "./admission-simulation-provider";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";

type PendingAction = "WITHDRAW" | "CONNECTED" | "RESET" | null;

function formatEventTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(value));
}

export function AdmissionControl({ institutes, programs }: { institutes: readonly OfficialInstitute[]; programs: readonly OfficialProgram[] }) {
  const { state, lastError, withdrawCurrent, confirmConnected, resetDemo, clearError } = useAdmissionSimulation();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [resetComplete, setResetComplete] = useState(false);
  const admission = state.currentAdmission;
  const program = admission?.kind === "PARTICIPATING_SEAT" ? programs.find((item) => item.choiceCode === admission.programId) : undefined;
  const institute = program ? institutes.find((item) => item.code === program.instituteCode) : undefined;
  const connected = state.externalAdmissions[0];
  const feedbackProgram = state.lastFeedback ? programs.find((item) => item.choiceCode === state.lastFeedback?.programId) : undefined;
  const feedbackInstitute = feedbackProgram ? institutes.find((item) => item.code === feedbackProgram.instituteCode) : undefined;
  const feedbackSeat = state.lastFeedback
    ? state.seats.find((item) => item.id === state.lastFeedback?.seatId)
    : undefined;
  const events = getAdmissionEvents(state);

  function complete(action: PendingAction) {
    let succeeded = false;
    if (action === "WITHDRAW") succeeded = withdrawCurrent();
    if (action === "CONNECTED") succeeded = confirmConnected(connected.id);
    if (action === "RESET") { resetDemo(); setResetComplete(true); succeeded = true; }
    if (succeeded && action !== "RESET") setResetComplete(false);
    if (succeeded) setPendingAction(null);
  }

  return (
    <>
      <PageHeader eyebrow="One student · one admission state" title="My Admission" description="See and manage Aarya's one current admission in this demo." action={<StatusBadge tone="info">Demo simulation</StatusBadge>} />

      {resetComplete ? <div className="demo-reset-feedback" role="status"><strong>Demo reset complete.</strong><span>Aarya again holds AISSMS Computer Engineering. Saved preferences were not changed.</span></div> : null}

      {state.lastFeedback && feedbackProgram && feedbackInstitute ? (
        <section className="seat-release-feedback" role="status" aria-labelledby="release-feedback-title">
          <span aria-hidden="true">✓</span><div><p>{state.lastFeedback.title}</p><h2 id="release-feedback-title">{feedbackInstitute.commonName} · {feedbackProgram.name}</h2><strong>Vacancies: {state.lastFeedback.availabilityBefore} → {state.lastFeedback.availabilityAfter}</strong><small>{feedbackSeat?.lifecycleState === "OFFERED" ? "The released seat is now OFFERED to the next eligible candidate." : "The specific synthetic seat is now AVAILABLE."}</small></div><Link href="/vacancies">Open Live Vacancies →</Link>
        </section>
      ) : null}
      {lastError ? <div className="simulation-error" role="alert"><strong>Demo action could not be completed.</strong><span>{lastError.message}</span><button type="button" onClick={clearError}>Dismiss</button></div> : null}

      <section className="admission-state-card" aria-labelledby="current-admission-title">
        <div className="admission-state-heading"><div><p>Current admission status</p><h2 id="current-admission-title">Your Current Seat</h2></div>{admission ? <StatusBadge tone="success">Confirmed</StatusBadge> : <StatusBadge tone="warning">None held</StatusBadge>}</div>
        {admission?.kind === "PARTICIPATING_SEAT" && program && institute ? (
          <div className="admission-seat-content">
            <div><p>{institute.commonName}</p><h3>{program.name}</h3><span>{institute.name}</span></div>
            <dl><div><dt>Route</dt><dd>{admission.source === "SPOT_ROUND" ? "Centralized live spot round · demo" : "MHT-CET CAP"}</dd></div><div><dt>Round</dt><dd>{admission.allotmentRound}</dd></div><div><dt>Status</dt><dd>Held / Confirmed</dd></div><div><dt>Betterment</dt><dd>{admission.bettermentStatus === "ACTIVE" ? "Active" : "Not active"}</dd></div><div><dt>Seat ID</dt><dd>{admission.seatId}</dd></div><div><dt>Other demo vacancies</dt><dd>{getProgrammeVacancies(state, admission.programId)}</dd></div></dl>
            <p className="student-first-explanation">This remains Aarya&apos;s current admission until she withdraws it or accepts another seat in the demo.</p>
          </div>
        ) : admission?.kind === "CONNECTED_ADMISSION" ? (
          <div className="admission-seat-content connected-admission-content"><div><p>Demo connected counselling event</p><h3>{admission.programName}</h3><span>{admission.institutionName}</span></div><dl><div><dt>Route</dt><dd>{admission.sourceLabel}</dd></div><div><dt>Status</dt><dd>Confirmed in simulation</dd></div><div><dt>Previous CET seat</dt><dd>Released</dd></div><div><dt>Connection</dt><dd>Simulated on this device</dd></div></dl><p className="student-first-explanation">This fictional record demonstrates how a connected counselling confirmation could prevent one student from retaining two participating admissions.</p></div>
        ) : <div className="no-current-admission"><strong>Aarya does not currently hold an admission.</strong><p>Her previously held participating seat is visible as AVAILABLE on the demo vacancy exchange.</p></div>}
      </section>

      <section className="seat-lifecycle-card" aria-labelledby="seat-lifecycle-title"><div><p className="context-label">One seat · one live state</p><h2 id="seat-lifecycle-title">How a seat moves</h2><p>A seat should return to the vacancy pool as soon as the participating admission process knows it is no longer held.</p></div><ol aria-label="Seat lifecycle"><li>Available</li><li>Offered</li><li>Accepted</li><li>Released</li><li>Available</li></ol></section>

      <div className="simulation-action-grid">
        <section className="simulation-action-card"><p>Action A</p><h2>Withdraw current seat</h2><p>Release Aarya&apos;s current participating seat and remove the admission from the demo.</p><button type="button" disabled={admission?.kind !== "PARTICIPATING_SEAT"} onClick={() => setPendingAction("WITHDRAW")}>Withdraw in Demo</button></section>
        <section className="simulation-action-card connected"><p>Action B</p><h2>Connected counselling confirmation</h2><p>Simulate another participating counselling system reporting a fictional confirmed admission.</p><div className="connected-record"><strong>{connected.institutionName}</strong><span>{connected.programName}</span><small>{connected.sourceLabel}</small></div><button type="button" disabled={connected.status !== "READY"} onClick={() => setPendingAction("CONNECTED")}>Simulate Connected Admission</button></section>
      </div>

      {pendingAction ? (
        <section className="simulation-confirmation" role="alertdialog" aria-modal="false" aria-labelledby="simulation-confirm-title">
          <div><p>Confirm demo action</p><h2 id="simulation-confirm-title">{pendingAction === "WITHDRAW" ? "Release the current seat?" : pendingAction === "CONNECTED" ? "Confirm the connected demo admission?" : "Reset the admission simulation?"}</h2><p>{pendingAction === "WITHDRAW" ? "Aarya will no longer hold her current participating admission. That exact synthetic seat will return to the vacancy exchange." : pendingAction === "CONNECTED" ? "The fictional connected admission will become current. Aarya's participating seat will be released and the vacancy board will update." : "The original AISSMS seat, spot-round interests, queues, offers, synthetic inventory, and event history will be restored. Saved preferences will not be changed."}</p></div><div><button className="secondary-action-button" type="button" onClick={() => setPendingAction(null)}>Cancel</button><button className={pendingAction === "RESET" ? "danger-action-button" : "primary-action-button"} type="button" onClick={() => complete(pendingAction)}>{pendingAction === "RESET" ? "Reset Demo" : "Confirm Demo Action"}</button></div>
        </section>
      ) : null}

      <section className="admission-event-log" aria-labelledby="event-log-title"><div className="event-log-heading"><div><p className="context-label">Traceable state changes</p><h2 id="event-log-title">Admission event history</h2></div><button type="button" onClick={() => setPendingAction("RESET")}>Reset Demo</button></div><ol>{events.map((event) => {
        const eventProgram = event.programId ? programs.find((item) => item.choiceCode === event.programId) : undefined;
        const eventInstitute = eventProgram ? institutes.find((item) => item.code === eventProgram.instituteCode) : undefined;
        return <li key={event.id}><time dateTime={event.occurredAt}>{formatEventTime(event.occurredAt)}</time><span aria-hidden="true" /><div><strong>{event.title}{eventInstitute ? ` · ${eventInstitute.commonName}` : ""}</strong><p>{event.description}</p>{event.availabilityBefore !== undefined ? <small>Vacancy change: {event.availabilityBefore} → {event.availabilityAfter}</small> : null}</div></li>;
      })}</ol></section>
    </>
  );
}
