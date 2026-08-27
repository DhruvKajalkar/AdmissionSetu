import type { AdmissionAlert, AdmissionDeadline, AdmissionJourneyStage } from "@/types";

export const DEMO_NOW = "2026-08-27T17:00:00+05:30";

export const admissionJourneyStages: readonly AdmissionJourneyStage[] = [
  { id: "EXAMS_COMPLETED", title: "Exams completed", description: "MHT-CET and JEE Main scores recorded" },
  { id: "CET_REGISTRATION", title: "CET registration", description: "Engineering application submitted" },
  { id: "DOCUMENTS_VERIFIED", title: "Document check completed", description: "Core eligibility documents checked; one follow-up remains" },
  { id: "CAP_PREFERENCES", title: "CAP preferences", description: "Programme choices submitted" },
  { id: "CAP_ALLOTMENT", title: "CAP allotment", description: "A seat was allotted in CAP Round III" },
  { id: "BETTERMENT", title: "Betterment", description: "Current stage — review stronger choices" },
  { id: "INSTITUTE_SPOT_ROUNDS", title: "Institute / spot rounds", description: "Explore eligible institute vacancies" },
  { id: "FINAL_ADMISSION", title: "Final admission", description: "Confirm the seat you will retain" },
];

export const nextAdmissionDeadline: AdmissionDeadline = {
  id: "deadline-cap-round-iv",
  title: "CAP Round IV preference window closes",
  deadlineAt: "2026-08-28T17:00:00+05:30",
  actionLabel: "Review Preferences",
  actionHref: "/preferences",
  whyItMatters: "Review your order before the window closes to remain eligible for betterment.",
};

export const dashboardAlerts: readonly AdmissionAlert[] = [
  {
    id: "alert-nationality-document",
    tone: "WARNING",
    label: "Document needs attention",
    title: "Nationality certificate is still missing",
    message: "Keep it ready before institute reporting so your admission is not delayed.",
    actionLabel: "View requirement",
    actionHref: "#document-readiness",
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
