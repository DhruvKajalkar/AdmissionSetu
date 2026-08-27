import type { Candidate } from "@/types";

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
  preferenceProgramIds: ["0627324510", "0617524510", "0627824510", "0613924510"],
};
