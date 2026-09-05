import type { AdmissionAlert, AdmissionDeadline, AdmissionJourneyStage } from "../types/admissions.ts";
import { demoAdmissionCycle } from "./demo-cycle.ts";

export const DEMO_NOW = demoAdmissionCycle.now;

export const admissionJourneyStages: readonly AdmissionJourneyStage[] = [
  { id: "EXAMS_COMPLETED", title: "Exams completed", description: "MHT-CET and JEE Main scores recorded" },
  { id: "CET_REGISTRATION", title: "CET registration", description: "Engineering application submitted" },
  { id: "DOCUMENTS_VERIFIED", title: "Document check completed", description: "Core eligibility documents checked; one follow-up remains" },
  { id: "CAP_PREFERENCES", title: "CAP preferences", description: "Earlier CAP option form submitted" },
  { id: "CAP_ALLOTMENT", title: "CAP allotment", description: `Current seat secured in ${demoAdmissionCycle.currentSeatAllottedRound}` },
  { id: "BETTERMENT", title: "Betterment", description: `Current stage — arrange and review ${demoAdmissionCycle.roundLabel} choices` },
  { id: "INSTITUTE_SPOT_ROUNDS", title: "Institute / spot rounds", description: "Explore eligible institute vacancies" },
  { id: "FINAL_ADMISSION", title: "Final admission", description: "Confirm the seat you will retain" },
];

export const nextAdmissionDeadline: AdmissionDeadline = {
  id: "deadline-cap-round-iii-review",
  title: `${demoAdmissionCycle.roundLabel} option-form review closes`,
  deadlineAt: demoAdmissionCycle.preferenceReviewDeadline,
  actionLabel: "Review Preferences",
  actionHref: "/preferences",
  whyItMatters: "Review the exact order and auto-freeze consequences before confirming the demo option form.",
};

export const dashboardAlerts: readonly AdmissionAlert[] = [
  {
    id: "alert-nationality-document",
    tone: "WARNING",
    label: "Document needs attention",
    title: "Income Certificate needs attention",
    message: "This broad passport item is missing, while the prototype CAP and reporting bundles remain ready.",
    actionLabel: "View documents",
    actionHref: "/documents",
  },
  {
    id: "alert-institute-window",
    tone: "INFO",
    label: "Coming up",
    title: "Institute-level registrations open this week",
    message: "You can explore participating rounds without giving up your current CAP seat.",
    actionLabel: "View spot rounds",
    actionHref: "/spot-rounds",
  },
];
