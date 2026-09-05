import { demoCandidate } from "../data/candidate.ts";
import { demoAdmissionCycle } from "../data/demo-cycle.ts";
import { nextAdmissionDeadline } from "../data/dashboard.ts";
import { capRoundThreeRule } from "../data/official/cap-rules.ts";
import { officialInstitutes } from "../data/official/institutes.ts";
import { officialPrograms } from "../data/official/programs.ts";
import type {
  AdmissionSimulationState,
  AlertItem,
  AlertPriority,
  AlertSnoozeOption,
  AlertSummary,
  Candidate,
  CandidatePreference,
} from "../types/index.ts";
import { getWorkflowReadiness } from "./document-passport.ts";
import { isActiveClearingInterest } from "./clearing-network.ts";
import { reviewPreferenceList } from "./preference-safety.ts";
import { evaluateAllSchemes } from "./scholarships.ts";

export const ALERT_DEMO_NOW = demoAdmissionCycle.now;

const priorityOrder: Record<AlertPriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

function addSeconds(value: string, seconds: number) {
  return new Date(new Date(value).getTime() + seconds * 1_000).toISOString();
}

function programDetails(programId: string) {
  const program = officialPrograms.find((item) => item.choiceCode === programId);
  const institute = program
    ? officialInstitutes.find((item) => item.code === program.instituteCode)
    : undefined;
  return {
    programName: program?.name ?? "Programme",
    instituteName: institute?.commonName ?? "Participating institute",
  };
}

function sortAlerts(alerts: readonly AlertItem[]) {
  return [...alerts].sort((left, right) => {
    const priority = priorityOrder[left.priority] - priorityOrder[right.priority];
    if (priority !== 0) return priority;
    if (left.dueAt && right.dueAt) return Date.parse(left.dueAt) - Date.parse(right.dueAt);
    if (left.dueAt) return -1;
    if (right.dueAt) return 1;
    return Date.parse(right.createdAt) - Date.parse(left.createdAt) || left.id.localeCompare(right.id);
  });
}

function baseAlerts(
  state: AdmissionSimulationState,
  preferences: readonly CandidatePreference[],
  candidate: Candidate,
): AlertItem[] {
  const alerts: AlertItem[] = [];

  for (const offer of state.clearing.offers.filter(
    (item) => item.candidateId === candidate.id && item.status === "AWAITING_DECISION",
  )) {
    const round = state.spotRounds.find((item) => item.id === offer.roundId);
    const details = programDetails(round?.programId ?? "");
    alerts.push({
      id: `alert:offer:${offer.id}`,
      candidateId: candidate.id,
      type: offer.remainingSeconds <= 45 * 60 ? "OFFER_EXPIRY" : "SEAT_OFFER",
      priority: offer.remainingSeconds <= 45 * 60 ? "CRITICAL" : "HIGH",
      status: "ACTIVE",
      section: "NEEDS_ACTION",
      title: `${details.instituteName} ${details.programName} seat offered`,
      message: "Review this exact seat offer before its decision window expires.",
      source: "Merit clearing",
      createdAt: offer.offeredAt,
      dueAt: addSeconds(ALERT_DEMO_NOW, offer.remainingSeconds),
      actionLabel: "Review offer",
      actionHref: `/spot-rounds/${offer.roundId}`,
      relatedEntityId: offer.id,
      actionable: true,
      dismissible: false,
    });
  }

  const preferenceReview = reviewPreferenceList(preferences, capRoundThreeRule);
  const preferenceWarnings = preferenceReview.findings.filter(
    (finding) => finding.type === "UNSURE_AUTO_FREEZE" || finding.severity === "BLOCKING",
  );
  if (preferenceWarnings.length) {
    const firstPosition = preferenceWarnings.find((finding) => finding.position !== undefined)?.position;
    alerts.push({
      id: "alert:preference:round-3-safety",
      candidateId: candidate.id,
      type: "PREFERENCE_WARNING",
      priority: "HIGH",
      status: "ACTIVE",
      section: "NEEDS_ACTION",
      title: firstPosition
        ? `Review your Round III preference #${firstPosition}`
        : "Review your Round III preference list",
      message: preferenceWarnings.length === 1
        ? preferenceWarnings[0].explanation
        : `${preferenceWarnings.length} choices inside the first-six auto-freeze zone are marked “I'm not sure.”`,
      source: "Preference safety",
      createdAt: ALERT_DEMO_NOW,
      actionLabel: "Review preference",
      actionHref: "/preferences",
      relatedEntityId: "cap-round-3-preferences",
      actionable: true,
      dismissible: false,
    });
  }

  const passportReadiness = getWorkflowReadiness(state, "DOCUMENT_PASSPORT");
  const reportingReadiness = getWorkflowReadiness(state, "INSTITUTE_REPORTING");
  const missingPassportRecords = state.documentPassport.records.filter(
    (record) => ["MISSING", "NEEDS_ATTENTION", "EXPIRED"].includes(record.verificationStatus),
  );
  if (missingPassportRecords.length) {
    const names = missingPassportRecords.map((record) => record.displayName).join(", ");
    alerts.push({
      id: "alert:documents:passport-attention",
      candidateId: candidate.id,
      type: "DOCUMENT_MISSING",
      priority: "MEDIUM",
      status: "ACTIVE",
      section: "NEEDS_ACTION",
      title: `${missingPassportRecords.length} document${missingPassportRecords.length === 1 ? "" : "s"} still needs attention`,
      message: reportingReadiness.ready
        ? `Your institute reporting set is ready (${reportingReadiness.readyCount}/${reportingReadiness.requiredCount}), but your full document passport is missing ${names} (${passportReadiness.readyCount}/${passportReadiness.requiredCount} ready).`
        : `${names} needs attention. Your institute reporting set is ${reportingReadiness.readyCount}/${reportingReadiness.requiredCount} ready.`,
      source: "Document Passport",
      createdAt: ALERT_DEMO_NOW,
      actionLabel: "View documents",
      actionHref: "/documents",
      relatedEntityId: "document-passport",
      actionable: true,
      dismissible: false,
    });
  }

  const evaluations = evaluateAllSchemes(state, candidate);
  const matchedNotReady = evaluations.filter(
    (evaluation) => evaluation.status !== "NOT_ELIGIBLE" && !evaluation.applicationReady,
  );
  if (matchedNotReady.length) {
    const missingIncome = matchedNotReady.some((evaluation) =>
      evaluation.missingDocuments.some((document) => document.documentType === "INCOME_CERTIFICATE"),
    );
    alerts.push({
      id: "alert:scholarships:matched-not-ready",
      candidateId: candidate.id,
      type: "SCHOLARSHIP_MATCH",
      priority: "MEDIUM",
      status: "ACTIVE",
      section: "NEEDS_ACTION",
      title: `${matchedNotReady.length} financial-aid scheme${matchedNotReady.length === 1 ? " may" : "s may"} match your profile`,
      message: missingIncome
        ? "At least one matching scheme is not application-ready because the Income Certificate is missing."
        : "Review the matching schemes and remaining profile or document steps before using an official portal.",
      source: "Scholarship Navigator",
      createdAt: ALERT_DEMO_NOW,
      actionLabel: "View scholarships",
      actionHref: "/scholarships",
      relatedEntityId: "scholarship-matches",
      actionable: true,
      dismissible: true,
    });
  }

  const meritCandidate = state.clearing.candidates.find((item) => item.candidateId === candidate.id);
  const latestMovement = [...state.clearing.events].reverse().flatMap((event) =>
    (event.movements ?? []).map((movement) => ({ event, movement })),
  ).find(({ movement }) => movement.candidateId === candidate.id);
  if (latestMovement && meritCandidate?.status === "ACTIVE") {
    const interest = meritCandidate.interests.find(
      (item) => item.roundId === latestMovement.movement.roundId,
    );
    if (interest && isActiveClearingInterest(interest.status)) {
      const round = state.spotRounds.find((item) => item.id === latestMovement.movement.roundId);
      const details = programDetails(round?.programId ?? "");
      alerts.push({
        id: `alert:merit-movement:${latestMovement.movement.roundId}:${candidate.id}`,
        candidateId: candidate.id,
        type: "ROUND_POSITION_CHANGE",
        priority: "MEDIUM",
        status: "ACTIVE",
        section: "NEEDS_ACTION",
        title: `Your ${details.instituteName} position changed`,
        message: `You moved from #${latestMovement.movement.fromPosition} to #${latestMovement.movement.toPosition} after candidates ahead left the active merit list.`,
        source: "Merit clearing",
        createdAt: latestMovement.event.occurredAt,
        actionLabel: "View round",
        actionHref: `/spot-rounds/${latestMovement.movement.roundId}`,
        relatedEntityId: latestMovement.movement.roundId,
        actionable: false,
        dismissible: true,
      });
    }
  }

  if (meritCandidate?.status === "ACTIVE") {
    const activeRoundIds = new Set(
      meritCandidate.interests.filter((interest) => isActiveClearingInterest(interest.status)).map((interest) => interest.roundId),
    );
    const nextRound = state.spotRounds
      .filter((round) => round.status === "UPCOMING" && activeRoundIds.has(round.id) && Date.parse(round.startsAt) > Date.parse(ALERT_DEMO_NOW))
      .sort((left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt))[0];
    if (nextRound) {
      const details = programDetails(nextRound.programId);
      alerts.push({
        id: `alert:round-start:${nextRound.id}`,
        candidateId: candidate.id,
        type: "ROUND_START",
        priority: "MEDIUM",
        status: "ACTIVE",
        section: "COMING_UP",
        title: `${details.instituteName} spot round begins soon`,
        message: `${details.programName} is the next deterministic round in your active merit interests.`,
        source: "Merit clearing",
        createdAt: ALERT_DEMO_NOW,
        dueAt: nextRound.startsAt,
        actionLabel: "View round",
        actionHref: `/spot-rounds/${nextRound.id}`,
        relatedEntityId: nextRound.id,
        actionable: true,
        dismissible: true,
      });
    }

    const latestVacancyChange = state.spotRounds.flatMap((round) =>
      activeRoundIds.has(round.id)
        ? round.events.flatMap((event) => event.availabilityBefore !== undefined && event.availabilityAfter !== undefined && event.availabilityAfter > event.availabilityBefore
          ? [{ round, event }]
          : [])
        : [],
    ).sort((left, right) => Date.parse(right.event.occurredAt) - Date.parse(left.event.occurredAt))[0];
    if (latestVacancyChange) {
      const details = programDetails(latestVacancyChange.round.programId);
      alerts.push({
        id: `alert:vacancy-change:${latestVacancyChange.round.id}`,
        candidateId: candidate.id,
        type: "VACANCY_CHANGE",
        priority: "MEDIUM",
        status: "ACTIVE",
        section: "NEEDS_ACTION",
        title: "A seat became available in a round you joined",
        message: `${details.instituteName} · ${details.programName} now has ${latestVacancyChange.event.availabilityAfter} available seat${latestVacancyChange.event.availabilityAfter === 1 ? "" : "s"}.`,
        source: "Merit clearing",
        createdAt: latestVacancyChange.event.occurredAt,
        actionLabel: "View live round",
        actionHref: `/spot-rounds/${latestVacancyChange.round.id}`,
        relatedEntityId: latestVacancyChange.round.id,
        actionable: true,
        dismissible: true,
      });
    }
  }

  alerts.push({
    id: `alert:deadline:${nextAdmissionDeadline.id}`,
    candidateId: candidate.id,
    type: "ROUND_START",
    priority: "LOW",
    status: "ACTIVE",
    section: "COMING_UP",
    title: nextAdmissionDeadline.title,
    message: nextAdmissionDeadline.whyItMatters,
    source: "Admission state",
    createdAt: ALERT_DEMO_NOW,
    dueAt: nextAdmissionDeadline.deadlineAt,
    actionLabel: nextAdmissionDeadline.actionLabel,
    actionHref: nextAdmissionDeadline.actionHref,
    relatedEntityId: nextAdmissionDeadline.id,
    actionable: true,
    dismissible: false,
  });

  if (state.clearing.lastOutcome && state.currentAdmission?.kind === "PARTICIPATING_SEAT") {
    const details = programDetails(state.currentAdmission.programId);
    alerts.push({
      id: `alert:admission-confirmed:${state.clearing.lastOutcome.offerId}`,
      candidateId: candidate.id,
      type: "ADMISSION_CONFIRMED",
      priority: "LOW",
      status: "COMPLETED",
      section: "COMPLETED",
      title: "Admission confirmed",
      message: `${details.instituteName} · ${details.programName} is now your current admission. Your previous AISSMS seat was released and competing spot-round interests were closed.`,
      source: "Admission state",
      createdAt: state.clearing.lastOutcome.occurredAt,
      resolvedAt: state.clearing.lastOutcome.occurredAt,
      actionLabel: "View admission",
      actionHref: "/admission",
      relatedEntityId: state.clearing.lastOutcome.offerId,
      actionable: false,
      dismissible: false,
    });
  }

  const latestShare = state.documentPassport.shares.at(-1);
  if (latestShare) {
    alerts.push({
      id: `alert:documents:shared:${latestShare.id}`,
      candidateId: candidate.id,
      type: "DOCUMENT_READY",
      priority: "LOW",
      status: "COMPLETED",
      section: "COMPLETED",
      title: "Documents shared with consent",
      message: `${latestShare.documentTypes.length} ready document${latestShare.documentTypes.length === 1 ? " was" : "s were"} shared for ${latestShare.purpose}.`,
      source: "Document Passport",
      createdAt: latestShare.sharedAt,
      resolvedAt: latestShare.sharedAt,
      actionLabel: "View documents",
      actionHref: "/documents",
      relatedEntityId: latestShare.id,
      actionable: false,
      dismissible: false,
    });
  }

  return alerts;
}

function applyControls(
  alerts: readonly AlertItem[],
  state: AdmissionSimulationState,
  now: string,
) {
  const dismissed = new Set(state.alertControls.dismissedAlertIds);
  const nowTime = Date.parse(now);
  return alerts.map((alert): AlertItem => {
    if (alert.status === "COMPLETED") return alert;
    if (dismissed.has(alert.id) && alert.dismissible) return { ...alert, status: "DISMISSED" };
    const snoozedUntil = state.alertControls.snoozedUntilByAlertId[alert.id];
    if (snoozedUntil && Date.parse(snoozedUntil) > nowTime) {
      return { ...alert, status: "SNOOZED", snoozedUntil };
    }
    return alert;
  });
}

export function deriveAlerts(
  state: AdmissionSimulationState,
  preferences: readonly CandidatePreference[],
  candidate: Candidate = demoCandidate,
  now: string = ALERT_DEMO_NOW,
) {
  const unique = new Map(
    baseAlerts(state, preferences, candidate).map((alert) => [alert.id, alert]),
  );
  return sortAlerts(applyControls([...unique.values()], state, now));
}

export function getActiveAlerts(
  state: AdmissionSimulationState,
  preferences: readonly CandidatePreference[],
  candidate: Candidate = demoCandidate,
  now: string = ALERT_DEMO_NOW,
) {
  return deriveAlerts(state, preferences, candidate, now).filter((alert) => alert.status === "ACTIVE");
}

export function getDashboardTopAlerts(
  state: AdmissionSimulationState,
  preferences: readonly CandidatePreference[],
  candidate: Candidate = demoCandidate,
  now: string = ALERT_DEMO_NOW,
  limit = 3,
) {
  return getActiveAlerts(state, preferences, candidate, now)
    .filter((alert) => alert.section === "NEEDS_ACTION")
    .slice(0, limit);
}

export function getAlertSummary(alerts: readonly AlertItem[]): AlertSummary {
  const visible = alerts.filter((alert) => alert.status === "ACTIVE" || alert.status === "COMPLETED");
  return {
    actionableCount: visible.filter((alert) => alert.status === "ACTIVE" && alert.actionable).length,
    needsActionCount: visible.filter((alert) => alert.status === "ACTIVE" && alert.section === "NEEDS_ACTION").length,
    comingUpCount: visible.filter((alert) => alert.status === "ACTIVE" && alert.section === "COMING_UP").length,
    completedCount: visible.filter((alert) => alert.status === "COMPLETED").length,
  };
}

export function getAlertTimingLabel(alert: AlertItem, now: string = ALERT_DEMO_NOW) {
  if (!alert.dueAt) return null;
  const remainingMinutes = Math.max(0, Math.ceil((Date.parse(alert.dueAt) - Date.parse(now)) / 60_000));
  if (remainingMinutes < 60) {
    const duration = `${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"}`;
    return alert.type === "OFFER_EXPIRY" ? `Offer expires in ${duration}` : `Due in ${duration}`;
  }
  const remainingHours = Math.ceil(remainingMinutes / 60);
  if (remainingHours < 24) return `In ${remainingHours} hour${remainingHours === 1 ? "" : "s"}`;
  if (remainingHours <= 48) return "Tomorrow";
  const remainingDays = Math.ceil(remainingHours / 24);
  return `In ${remainingDays} days`;
}

export function getSnoozeUntil(option: AlertSnoozeOption, now: string = ALERT_DEMO_NOW) {
  const base = new Date(now);
  if (option === "IN_ONE_HOUR") return new Date(base.getTime() + 60 * 60 * 1_000).toISOString();
  if (option === "LATER") return new Date(base.getTime() + 3 * 24 * 60 * 60 * 1_000).toISOString();
  const tomorrow = new Date(base.getTime() + 24 * 60 * 60 * 1_000);
  tomorrow.setUTCHours(3, 30, 0, 0);
  return tomorrow.toISOString();
}

export function snoozeAlert(
  state: AdmissionSimulationState,
  alertId: string,
  option: AlertSnoozeOption,
  now: string = ALERT_DEMO_NOW,
): AdmissionSimulationState {
  return {
    ...state,
    alertControls: {
      ...state.alertControls,
      snoozedUntilByAlertId: {
        ...state.alertControls.snoozedUntilByAlertId,
        [alertId]: getSnoozeUntil(option, now),
      },
    },
  };
}

export function dismissAlert(
  state: AdmissionSimulationState,
  alert: AlertItem,
): AdmissionSimulationState {
  if (!alert.dismissible || state.alertControls.dismissedAlertIds.includes(alert.id)) return state;
  return {
    ...state,
    alertControls: {
      ...state.alertControls,
      dismissedAlertIds: [...state.alertControls.dismissedAlertIds, alert.id],
    },
  };
}
