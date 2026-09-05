import assert from "node:assert/strict";
import test from "node:test";
import { createInitialAdmissionSimulationState, V2_HERO_OFFER_ROUND_ID } from "../data/admission-simulation.ts";
import { demoCandidate } from "../data/candidate.ts";
import type { AdmissionSimulationState, CandidatePreference } from "../types/admissions.ts";
import { resetAdmissionSimulation } from "./admission-state.ts";
import {
  ALERT_DEMO_NOW,
  deriveAlerts,
  dismissAlert,
  getActiveAlerts,
  getAlertSummary,
  getAlertTimingLabel,
  getDashboardTopAlerts,
  snoozeAlert,
} from "./alerts.ts";
import { buildAssistantContextSnapshot } from "./assistant-context.ts";
import { acceptClearingOffer, advanceHeroClearingScenario } from "./clearing-network.ts";

const unsurePreferences: CandidatePreference[] = demoCandidate.preferenceProgramIds.map((programId, index) => ({
  programId,
  position: index + 1,
  acceptanceIntent: "UNSURE",
}));

const safePreferences: CandidatePreference[] = unsurePreferences.map((preference) => ({
  ...preference,
  acceptanceIntent: "YES",
}));

function requireSuccess(result: ReturnType<typeof advanceHeroClearingScenario>) {
  if (!result.ok) throw new Error("Expected the clearing transition to succeed.");
  return result.state;
}

function offerReadyState() {
  return requireSuccess(advanceHeroClearingScenario(createInitialAdmissionSimulationState()));
}

function acceptedState() {
  const offered = offerReadyState();
  const offer = offered.clearing.offers.find(
    (item) => item.roundId === V2_HERO_OFFER_ROUND_ID && item.candidateId === demoCandidate.id,
  );
  assert.ok(offer);
  const result = acceptClearingOffer(offered, offer.id);
  if (!result.ok) throw new Error("Expected the offer acceptance to succeed.");
  return result.state;
}

test("active VIT offer generates an urgent 42-minute alert", () => {
  const alert = deriveAlerts(offerReadyState(), unsurePreferences).find((item) => item.type === "OFFER_EXPIRY");
  assert.ok(alert);
  assert.equal(alert.priority, "CRITICAL");
  assert.equal(getAlertTimingLabel(alert), "Offer expires in 42 minutes");
  assert.equal(alert.actionHref, `/spot-rounds/${V2_HERO_OFFER_ROUND_ID}`);
});

test("accepted offer removes the active offer alert", () => {
  assert.equal(getActiveAlerts(acceptedState(), unsurePreferences).some((item) => item.type === "OFFER_EXPIRY"), false);
});

test("offer priority increases inside the urgent threshold", () => {
  const state = offerReadyState();
  const offerId = state.clearing.offers.find((offer) => offer.candidateId === demoCandidate.id)?.id;
  assert.ok(offerId);
  const relaxed: AdmissionSimulationState = {
    ...state,
    clearing: {
      ...state.clearing,
      offers: state.clearing.offers.map((offer) => offer.id === offerId ? { ...offer, remainingSeconds: 60 * 60 } : offer),
    },
  };
  assert.equal(deriveAlerts(relaxed, unsurePreferences).find((item) => item.relatedEntityId === offerId)?.priority, "HIGH");
  assert.equal(deriveAlerts(state, unsurePreferences).find((item) => item.relatedEntityId === offerId)?.priority, "CRITICAL");
});

test("preference safety warning generates one aggregated alert", () => {
  const alerts = deriveAlerts(createInitialAdmissionSimulationState(), unsurePreferences).filter((item) => item.type === "PREFERENCE_WARNING");
  assert.equal(alerts.length, 1);
  assert.match(alerts[0].message, /first-six auto-freeze zone/i);
});

test("resolved preference findings remove the preference alert", () => {
  assert.equal(deriveAlerts(createInitialAdmissionSimulationState(), safePreferences).some((item) => item.type === "PREFERENCE_WARNING"), false);
});

test("missing Income Certificate generates one document alert", () => {
  const alerts = deriveAlerts(createInitialAdmissionSimulationState(), unsurePreferences).filter((item) => item.type === "DOCUMENT_MISSING");
  assert.equal(alerts.length, 1);
  assert.match(alerts[0].message, /Income Certificate/i);
});

test("document alert accurately says institute reporting is 4 of 4 ready", () => {
  const alert = deriveAlerts(createInitialAdmissionSimulationState(), unsurePreferences).find((item) => item.type === "DOCUMENT_MISSING");
  assert.ok(alert);
  assert.match(alert.message, /institute reporting set is ready \(4\/4\)/i);
  assert.doesNotMatch(alert.message, /reporting.*blocked/i);
});

test("scholarship readiness alert derives matched schemes from the evaluation engine", () => {
  const alert = deriveAlerts(createInitialAdmissionSimulationState(), unsurePreferences).find((item) => item.type === "SCHOLARSHIP_MATCH");
  assert.ok(alert);
  assert.match(alert.message, /Income Certificate/i);
});

test("a supported merit movement produces at most one relevant alert", () => {
  const alerts = deriveAlerts(offerReadyState(), unsurePreferences).filter((item) => item.type === "ROUND_POSITION_CHANGE");
  assert.equal(alerts.length, 1);
  assert.match(alerts[0].message, /moved from #3 to #1/i);
});

test("duplicated domain events cannot duplicate stable derived alerts", () => {
  const state = offerReadyState();
  const event = state.clearing.events.find((item) => item.movements?.some((movement) => movement.candidateId === demoCandidate.id));
  assert.ok(event);
  const duplicated = { ...state, clearing: { ...state.clearing, events: [...state.clearing.events, event] } };
  const ids = deriveAlerts(duplicated, unsurePreferences).map((alert) => alert.id);
  assert.equal(ids.length, new Set(ids).size);
});

test("snoozed alert is excluded until the deterministic snooze time passes", () => {
  const state = createInitialAdmissionSimulationState();
  const documentAlert = deriveAlerts(state, unsurePreferences).find((item) => item.type === "DOCUMENT_MISSING");
  assert.ok(documentAlert);
  const snoozed = snoozeAlert(state, documentAlert.id, "IN_ONE_HOUR", ALERT_DEMO_NOW);
  assert.equal(getActiveAlerts(snoozed, unsurePreferences, demoCandidate, ALERT_DEMO_NOW).some((item) => item.id === documentAlert.id), false);
  assert.equal(getActiveAlerts(snoozed, unsurePreferences, demoCandidate, "2026-08-27T18:01:00+05:30").some((item) => item.id === documentAlert.id), true);
});

test("non-dismissible critical offer cannot be permanently dismissed", () => {
  const state = offerReadyState();
  const alert = deriveAlerts(state, unsurePreferences).find((item) => item.type === "OFFER_EXPIRY");
  assert.ok(alert);
  assert.equal(dismissAlert(state, alert), state);
});

test("dismissible scholarship suggestion can be dismissed", () => {
  const state = createInitialAdmissionSimulationState();
  const alert = deriveAlerts(state, unsurePreferences).find((item) => item.type === "SCHOLARSHIP_MATCH");
  assert.ok(alert);
  const dismissed = dismissAlert(state, alert);
  assert.equal(deriveAlerts(dismissed, unsurePreferences).find((item) => item.id === alert.id)?.status, "DISMISSED");
});

test("actionable badge summary counts only active actionable alerts", () => {
  const alerts = deriveAlerts(createInitialAdmissionSimulationState(), unsurePreferences);
  const expected = alerts.filter((alert) => alert.status === "ACTIVE" && alert.actionable).length;
  assert.equal(getAlertSummary(alerts).actionableCount, expected);
  assert.equal(getAlertSummary(alerts).completedCount, 0);
});

test("dashboard actions are deterministically priority ordered", () => {
  const alerts = getDashboardTopAlerts(offerReadyState(), unsurePreferences);
  assert.equal(alerts[0].type, "OFFER_EXPIRY");
  assert.deepEqual(alerts.map((alert) => alert.priority), ["CRITICAL", "HIGH", "MEDIUM"]);
});

test("assistant next-action context matches the alert engine", () => {
  const state = offerReadyState();
  const context = buildAssistantContextSnapshot(state, unsurePreferences, demoCandidate);
  const active = getActiveAlerts(state, unsurePreferences).filter((alert) => alert.actionable);
  assert.equal(context.alerts.actionableCount, active.length);
  assert.equal(context.alerts.highestPriority[0].title, active[0].title);
  assert.equal(context.alerts.highestPriority[0].dueLabel, "Offer expires in 42 minutes");
});

test("accepting VIT transforms the offer into completed admission confirmation", () => {
  const alerts = deriveAlerts(acceptedState(), unsurePreferences);
  assert.equal(alerts.some((alert) => alert.type === "OFFER_EXPIRY" && alert.status === "ACTIVE"), false);
  const completed = alerts.find((alert) => alert.type === "ADMISSION_CONFIRMED");
  assert.equal(completed?.status, "COMPLETED");
  assert.match(completed?.message ?? "", /previous AISSMS seat was released/i);
});

test("reset seed restores empty snooze and dismissal controls", () => {
  const initial = createInitialAdmissionSimulationState();
  const alert = deriveAlerts(initial, unsurePreferences).find((item) => item.type === "SCHOLARSHIP_MATCH");
  assert.ok(alert);
  const changed = dismissAlert(snoozeAlert(initial, "alert:documents:passport-attention", "LATER"), alert);
  assert.notDeepEqual(changed.alertControls, initial.alertControls);
  const reset = resetAdmissionSimulation(createInitialAdmissionSimulationState());
  assert.deepEqual(reset.alertControls, { version: 1, snoozedUntilByAlertId: {}, dismissedAlertIds: [] });
});
