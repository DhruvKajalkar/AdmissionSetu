import type { Admission, Candidate, Seat } from "@/types";

export const demoCandidate: Candidate = {
  id: "candidate-demo-aarya-deshmukh",
  fullName: "Aarya Deshmukh",
  applicationNumber: "SYN-MH-2026-10482",
  isSynthetic: true,
  cetPercentile: 96.84,
  jeePercentile: 91.27,
  category: "OPEN",
  homeUniversity: "SPPU",
  currentJourneyStage: "BETTERMENT",
  documents: [
    { id: "doc-cet", kind: "MHT_CET_SCORECARD", label: "MHT-CET scorecard", status: "VERIFIED", updatedAt: "2026-08-18T10:00:00+05:30" },
    { id: "doc-jee", kind: "JEE_MAIN_SCORECARD", label: "JEE Main scorecard", status: "VERIFIED", updatedAt: "2026-08-18T10:00:00+05:30" },
    { id: "doc-ssc", kind: "SSC_MARKSHEET", label: "SSC marksheet", status: "VERIFIED", updatedAt: "2026-08-19T11:30:00+05:30" },
    { id: "doc-hsc", kind: "HSC_MARKSHEET", label: "HSC marksheet", status: "VERIFIED", updatedAt: "2026-08-19T11:30:00+05:30" },
    { id: "doc-leaving", kind: "SCHOOL_LEAVING_CERTIFICATE", label: "School leaving certificate", status: "UPLOADED", updatedAt: "2026-08-21T15:20:00+05:30" },
    { id: "doc-domicile", kind: "DOMICILE_CERTIFICATE", label: "Maharashtra domicile certificate", status: "VERIFIED", updatedAt: "2026-08-20T13:00:00+05:30" },
    { id: "doc-nationality", kind: "NATIONALITY_CERTIFICATE", label: "Nationality certificate", status: "PENDING" },
    { id: "doc-category", kind: "CATEGORY_CERTIFICATE", label: "Category certificate", status: "NOT_REQUIRED" },
  ],
  currentAdmissionId: "admission-cap-aarya",
  preferenceProgramIds: ["0627324510", "0617524510", "0627824510", "0613924510"],
  spotRoundInterestIds: ["spot-vit-2026", "spot-pict-2026"],
};

export const seats: readonly Seat[] = [
  { id: "seat-aissms-ce-open-042", programId: "aissms-ce", category: "OPEN", lifecycleState: "ACCEPTED", heldByCandidateId: demoCandidate.id, academicYear: "2026-27" },
  { id: "seat-vit-ai-open-011", programId: "vit-ai", category: "OPEN", lifecycleState: "AVAILABLE", heldByCandidateId: null, academicYear: "2026-27" },
  { id: "seat-pict-it-open-007", programId: "pict-it", category: "OPEN", lifecycleState: "AVAILABLE", heldByCandidateId: null, academicYear: "2026-27" },
  { id: "seat-pccoe-ce-open-019", programId: "pccoe-ce", category: "OPEN", lifecycleState: "AVAILABLE", heldByCandidateId: null, academicYear: "2026-27" },
];

export const admissions: readonly Admission[] = [
  {
    id: "admission-cap-aarya",
    candidateId: demoCandidate.id,
    seatId: "seat-aissms-ce-open-042",
    source: "MHT_CET_CAP",
    allotmentRound: "CAP Round III",
    status: "CONFIRMED",
    bettermentStatus: "ACTIVE",
    allottedAt: "2026-08-20T14:30:00+05:30",
    reportingDeadline: "2026-08-29T17:00:00+05:30",
  },
];
