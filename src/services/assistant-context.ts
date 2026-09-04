import { V2_HERO_OFFER_ROUND_ID } from "../data/admission-simulation.ts";
import { demoAdmissionCycle } from "../data/demo-cycle.ts";
import { DOCUMENT_REQUIREMENT_BUNDLES } from "../data/document-passport.ts";
import { capRoundThreeRule } from "../data/official/cap-rules.ts";
import { officialInstitutes } from "../data/official/institutes.ts";
import { officialPrograms } from "../data/official/programs.ts";
import { SCHOLARSHIP_SCHEMES } from "../data/scholarships.ts";
import type { AdmissionSimulationState, AssistantContextSnapshot, Candidate, CandidatePreference } from "../types/index.ts";
import { getProgrammeVacancies } from "./admission-state.ts";
import { acceptClearingOffer, advanceHeroClearingScenario, getCandidateClearingInterest, getCandidateMeritPosition } from "./clearing-network.ts";
import { getWorkflowReadiness } from "./document-passport.ts";
import { reviewPreferenceList } from "./preference-safety.ts";
import { evaluateAllSchemes, getScholarshipSummary } from "./scholarships.ts";

function catalog(programId: string) {
  const program = officialPrograms.find((item) => item.choiceCode === programId);
  const institute = program ? officialInstitutes.find((item) => item.code === program.instituteCode) : undefined;
  return {
    programName: program?.name ?? "Programme unavailable",
    instituteName: institute?.name ?? "Institute unavailable",
    instituteShortName: institute?.commonName ?? "Institute unavailable",
  };
}

function currentAdmission(state: AdmissionSimulationState): AssistantContextSnapshot["currentAdmission"] {
  const admission = state.currentAdmission;
  if (!admission) return null;
  if (admission.kind === "CONNECTED_ADMISSION") {
    return {
      kind: admission.kind,
      instituteName: admission.institutionName,
      instituteShortName: admission.institutionName,
      programName: admission.programName,
      route: admission.sourceLabel,
      seatState: "CONFIRMED",
      bettermentStatus: "NOT_APPLICABLE",
    };
  }
  const details = catalog(admission.programId);
  const seat = state.seats.find((item) => item.id === admission.seatId);
  return {
    kind: admission.kind,
    ...details,
    route: admission.source === "MHT_CET_CAP" ? "MHT-CET CAP" : "Centralized spot round (demo)",
    seatState: seat?.lifecycleState ?? "UNKNOWN",
    bettermentStatus: admission.bettermentStatus,
  };
}

function projectVitOffer(state: AdmissionSimulationState): AssistantContextSnapshot["offerProjection"] {
  const current = currentAdmission(state);
  if (state.currentAdmission?.kind === "PARTICIPATING_SEAT" && state.currentAdmission.programId === "0627324510") {
    return {
      state: "ALREADY_ACCEPTED", roundId: V2_HERO_OFFER_ROUND_ID, offerId: null,
      newAdmission: "VIT Pune — Computer Engineering", previousAdmission: "AISSMS COE — Computer Engineering",
      previousSeatReleased: true,
      closedRoundIds: state.clearing.lastOutcome?.closedRoundIds ?? [],
      affectedQueueCount: state.clearing.lastOutcome?.movements.length ?? 0,
      releasedVacancyBefore: state.clearing.lastOutcome?.previousAvailabilityBefore ?? null,
      releasedVacancyAfter: state.clearing.lastOutcome?.previousAvailabilityAfterRelease ?? null,
    };
  }
  let projected = state;
  let scenarioState: "AVAILABLE_TO_SIMULATE" | "AWAITING_DECISION" = "AWAITING_DECISION";
  if (state.clearing.heroScenario.status === "READY") {
    const advanced = advanceHeroClearingScenario(state);
    if (!advanced.ok) return null;
    projected = advanced.state;
    scenarioState = "AVAILABLE_TO_SIMULATE";
  }
  const offer = projected.clearing.offers.find((item) =>
    item.candidateId === state.candidateId && item.roundId === V2_HERO_OFFER_ROUND_ID && item.status === "AWAITING_DECISION");
  if (!offer) {
    return {
      state: "UNAVAILABLE", roundId: V2_HERO_OFFER_ROUND_ID, offerId: null,
      newAdmission: "VIT Pune — Computer Engineering", previousAdmission: current ? `${current.instituteShortName} — ${current.programName}` : null,
      previousSeatReleased: false, closedRoundIds: [], affectedQueueCount: 0,
      releasedVacancyBefore: null, releasedVacancyAfter: null,
    };
  }
  const accepted = acceptClearingOffer(projected, offer.id);
  if (!accepted.ok) return null;
  const outcome = accepted.state.clearing.lastOutcome;
  return {
    state: scenarioState,
    roundId: offer.roundId,
    offerId: offer.id,
    newAdmission: "VIT Pune — Computer Engineering",
    previousAdmission: current ? `${current.instituteShortName} — ${current.programName}` : null,
    previousSeatReleased: Boolean(outcome?.previousSeatId),
    closedRoundIds: outcome?.closedRoundIds ?? [],
    affectedQueueCount: outcome?.movements.length ?? 0,
    releasedVacancyBefore: outcome?.previousAvailabilityBefore ?? null,
    releasedVacancyAfter: outcome?.previousAvailabilityAfterRelease ?? null,
  };
}

export function buildAssistantContextSnapshot(
  state: AdmissionSimulationState,
  preferences: readonly CandidatePreference[],
  candidate: Candidate,
): AssistantContextSnapshot {
  const preferenceReview = reviewPreferenceList(preferences, capRoundThreeRule);
  const workflows = DOCUMENT_REQUIREMENT_BUNDLES.map((bundle) => getWorkflowReadiness(state, bundle.id));
  const evaluations = evaluateAllSchemes(state, candidate);
  const meritCandidate = state.clearing.candidates.find((item) => item.candidateId === candidate.id);
  const programIds = [...new Set(state.spotRounds.map((round) => round.programId))];

  return {
    version: 1,
    candidate: {
      id: candidate.id,
      displayName: candidate.fullName,
      isSynthetic: true,
      cetPercentile: candidate.cetPercentile,
      jeePercentile: candidate.jeePercentile,
    },
    cycle: { currentRound: demoAdmissionCycle.currentRound, roundLabel: demoAdmissionCycle.roundLabel },
    currentAdmission: currentAdmission(state),
    preferences: {
      items: preferences.map((preference) => {
        const details = catalog(preference.programId);
        return {
          position: preference.position,
          choiceCode: preference.programId,
          instituteName: details.instituteName,
          programName: details.programName,
          acceptanceIntent: preference.acceptanceIntent,
        };
      }),
      autoFreezePreferenceLimit: preferenceReview.autoFreezePreferenceLimit,
      findings: preferenceReview.findings.map((finding) => ({
        severity: finding.severity,
        title: finding.title,
        explanation: finding.explanation,
        ...(finding.position === undefined ? {} : { position: finding.position }),
      })),
    },
    meritLists: (meritCandidate?.interests ?? []).map((interest) => {
      const round = state.spotRounds.find((item) => item.id === interest.roundId);
      const details = catalog(round?.programId ?? "");
      const merit = getCandidateMeritPosition(state, interest.roundId, candidate.id);
      const offer = state.clearing.offers.find((item) => item.candidateId === candidate.id && item.roundId === interest.roundId);
      return {
        roundId: interest.roundId,
        ...details,
        position: merit?.position ?? null,
        candidatesAhead: merit ? merit.position - 1 : null,
        interestStatus: getCandidateClearingInterest(state, candidate.id, interest.roundId)?.status ?? interest.status,
        offerStatus: offer?.status ?? null,
      };
    }),
    vacancies: programIds.map((programId) => {
      const details = catalog(programId);
      return {
        programId,
        instituteName: details.instituteName,
        programName: details.programName,
        available: getProgrammeVacancies(state, programId),
      };
    }),
    documents: {
      verifiedCount: state.documentPassport.records.filter((record) => ["VERIFIED", "AVAILABLE"].includes(record.verificationStatus)).length,
      totalCount: state.documentPassport.records.length,
      records: state.documentPassport.records.map((record) => ({
        documentType: record.documentType,
        displayName: record.displayName,
        status: record.verificationStatus,
      })),
      providerStatus: state.documentPassport.providerConnection.status,
      consentGranted: state.documentPassport.providerConnection.status === "CONNECTED",
      workflows,
    },
    scholarships: {
      profile: {
        familyAnnualIncomeInr: state.scholarshipNavigator.profile.familyAnnualIncomeInr,
        hostelStatus: state.scholarshipNavigator.profile.hostelStatus,
        class12BoardPercentile: state.scholarshipNavigator.profile.class12BoardPercentile,
      },
      summary: getScholarshipSummary(evaluations),
      evaluations: evaluations.map((evaluation) => {
        const scheme = SCHOLARSHIP_SCHEMES.find((item) => item.id === evaluation.schemeId)!;
        const source = scheme.officialSources[0];
        return {
          schemeId: evaluation.schemeId,
          schemeName: scheme.name,
          status: evaluation.status,
          applicationReady: evaluation.applicationReady,
          unknownReasons: evaluation.unknownRules.map((rule) => rule.explanation),
          failedReasons: evaluation.failedRules.map((rule) => rule.explanation),
          missingDocuments: evaluation.missingDocuments.map((document) => document.displayName),
          sourceTitle: source.title,
          sourceUrl: source.url,
        };
      }),
    },
    offerProjection: projectVitOffer(state),
  };
}
