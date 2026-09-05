import type {
  ScholarshipNavigatorState,
  ScholarshipOfficialSource,
  ScholarshipRule,
  ScholarshipRuleField,
  ScholarshipRuleOperator,
  ScholarshipRuleValue,
  ScholarshipScheme,
} from "@/types";
import { demoCandidate } from "./candidate.ts";

export const scholarshipDemoTimestamps = {
  updateProfile: "2026-08-27T11:31:00+05:30",
  portalHandoff: "2026-08-27T11:34:00+05:30",
} as const;

export const SCHOLARSHIP_PORTAL_URLS = {
  MAHADBT: "https://mahadbt.maharashtra.gov.in/",
  NSP: "https://scholarships.gov.in/Students",
} as const;

export const scholarshipContextSources = {
  mahadbtEligibility: "https://mahadbt.maharashtra.gov.in/FindEligibleSchemes/FindEligibleSchemes",
  nspStudents: "https://scholarships.gov.in/Students",
  nspSchemes: "https://scholarships.gov.in/All-Scholarships",
} as const;

const VERIFIED_ON = "2026-09-04";

const sources = {
  rajarshiDte: source(
    "MahaDBT — Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti Yojna",
    "https://mahadbt.maharashtra.gov.in/SchemeData/SchemeData?str=E9DDFA703C38E51A7F4D327BDEB7125DE0BA4AE1C51180C272281017EBEF6F7C",
    "MAHADBT",
  ),
  panjabraoDte: source(
    "MahaDBT — Dr. Panjabrao Deshmukh Vasatigruh Nirvah Bhatta Yojna",
    "https://mahadbt.maharashtra.gov.in/SchemeData/SchemeData?str=E9DDFA703C38E51A3D30C2CB15631E4E31F4E2AFF5E4258B33E89887D583052E",
    "MAHADBT",
  ),
  stateOpenMerit: source(
    "MahaDBT — State Government Open Merit Scholarship",
    "https://mahadbt.maharashtra.gov.in/SchemeData/SchemeData?str=E9DDFA703C38E51AED33CA69606C0CC2EF25388FB8EC7046E5E9B1E993657CEB",
    "MAHADBT",
  ),
  obcPostMatric: source(
    "MahaDBT — Post Matric Scholarship to OBC Students",
    "https://mahadbt.maharashtra.gov.in/SchemeData/SchemeData?str=E9DDFA703C38E51AB02E984835E89FEFDB316E301CE6A991F41C5D42B01A7D7E",
    "MAHADBT",
  ),
  disabilityPostMatric: source(
    "MahaDBT — Post-Matric Scholarship for persons with disability",
    "https://mahadbt.maharashtra.gov.in/SchemeData/SchemeData?str=E9DDFA703C38E51ABCC44582035F06CB9B6B2704869FE16E9E8F561A36261D4D",
    "MAHADBT",
  ),
  pmUspGuidelines: source(
    "Ministry of Education — PM-USP CSSS guidelines (applicable from 2022-23)",
    "https://www.education.gov.in/sites/upload_files/mhrd/files/upload_document/PM-USP_CSSS_GUIDELINES25.pdf",
    "NSP",
  ),
  pmUspCurrent: source(
    "National Scholarship Portal — schemes for academic year 2026-27",
    scholarshipContextSources.nspSchemes,
    "NSP",
  ),
  pmUspAnnualReport: source(
    "Ministry of Education annual report — PM-USP CSSS current eligibility summary",
    "https://www.education.gov.in/sites/upload_files/mhrd/files/document-reports/MoE_AR_En.pdf",
    "NSP",
  ),
} as const;

function source(
  title: string,
  url: string,
  portal: ScholarshipOfficialSource["portal"],
): ScholarshipOfficialSource {
  return { title, url, portal, lastVerifiedOn: VERIFIED_ON };
}

function rule(
  id: string,
  field: ScholarshipRuleField,
  operator: ScholarshipRuleOperator,
  value: ScholarshipRuleValue,
  explanation: string,
  failureExplanation: string,
  sourceTitle: string,
): ScholarshipRule {
  return { id, field, operator, value, explanation, failureExplanation, sourceTitle, mandatory: true };
}

const passportDocuments = {
  ssc: { documentType: "SSC_MARKSHEET", displayName: "SSC Marksheet" },
  hsc: { documentType: "HSC_MARKSHEET", displayName: "HSC Marksheet" },
  domicile: { documentType: "DOMICILE_CERTIFICATE", displayName: "Domicile Certificate" },
  income: { documentType: "INCOME_CERTIFICATE", displayName: "Income Certificate" },
} as const;

export const SCHOLARSHIP_SCHEMES = [
  {
    id: "mahadbt-rajarshi-dte",
    name: "Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti Yojna",
    provider: "Directorate of Technical Education, Maharashtra",
    portal: "MAHADBT",
    schemeType: "FEE_REIMBURSEMENT",
    benefitSummary: "Tuition-fee and examination-fee support according to the official scheme rules.",
    rules: [
      rule("rajarshi-nationality", "nationality", "EQUALS", "INDIAN", "Indian nationality is on the synthetic profile.", "The scheme requires Indian nationality.", sources.rajarshiDte.title),
      rule("rajarshi-domicile", "domicileState", "EQUALS", "MAHARASHTRA", "Maharashtra domicile is on the verified profile.", "The scheme requires Maharashtra domicile.", sources.rajarshiDte.title),
      rule("rajarshi-course", "courseType", "EQUALS", "PROFESSIONAL_TECHNICAL", "Aarya is studying a professional technical degree.", "The current course is not within the modelled professional/technical course rule.", sources.rajarshiDte.title),
      rule("rajarshi-level", "studyLevel", "ONE_OF", ["DIPLOMA", "UNDERGRADUATE", "POSTGRADUATE"], "The undergraduate degree level is covered.", "The study level is outside the modelled scheme levels.", sources.rajarshiDte.title),
      rule("rajarshi-institution", "institutionOwnership", "EQUALS", "NON_PRIVATE_UNIVERSITY", "The current institute is not modelled as a private or deemed university.", "Private and deemed universities are excluded by the official scheme page.", sources.rajarshiDte.title),
      rule("rajarshi-cap", "admissionRoute", "EQUALS", "CAP", "The current AISSMS admission was obtained through CAP.", "The current admission was not obtained through CAP.", sources.rajarshiDte.title),
      rule("rajarshi-category", "candidateCategory", "ONE_OF", ["OPEN", "EWS"], "The synthetic OPEN-category admission fits the modelled general/EWS route.", "The current category is outside this modelled general/EWS route.", sources.rajarshiDte.title),
      rule("rajarshi-income", "familyAnnualIncomeInr", "LTE", 800000, "Synthetic annual family income is within ₹8 lakh.", "Annual family income exceeds the official ₹8 lakh ceiling.", sources.rajarshiDte.title),
      rule("rajarshi-other-support", "isReceivingOtherScholarship", "EQUALS", false, "The synthetic profile records no other scholarship or stipend.", "The official rule does not permit another scholarship or stipend.", sources.rajarshiDte.title),
      rule("rajarshi-family-limit", "familyBeneficiaryCount", "LTE", 2, "The synthetic family-beneficiary count is within the two-child limit.", "The official page limits the benefit to two children in a family for the year.", sources.rajarshiDte.title),
      rule("rajarshi-attendance", "attendanceRequirementSatisfied", "EQUALS", true, "The first-semester synthetic profile satisfies the attendance exception.", "The attendance condition is not satisfied.", sources.rajarshiDte.title),
      rule("rajarshi-gap", "educationGapYears", "LTE", 1, "No two-year education gap is recorded.", "A gap of two years or more fails the official condition.", sources.rajarshiDte.title),
    ],
    requiredDocuments: [passportDocuments.ssc, passportDocuments.hsc, passportDocuments.domicile, passportDocuments.income],
    criteriaCoverage: "FULL",
    documentCoverage: "PARTIAL",
    officialSources: [sources.rajarshiDte],
  },
  {
    id: "mahadbt-panjabrao-dte",
    name: "Dr. Panjabrao Deshmukh Vasatigruh Nirvah Bhatta Yojna",
    provider: "Directorate of Technical Education, Maharashtra",
    portal: "MAHADBT",
    schemeType: "MAINTENANCE",
    benefitSummary: "Hostel and subsistence support according to location and the official scheme rules.",
    rules: [
      rule("panjabrao-domicile", "domicileState", "EQUALS", "MAHARASHTRA", "Maharashtra domicile is on the verified profile.", "The scheme requires Maharashtra domicile.", sources.panjabraoDte.title),
      rule("panjabrao-course", "courseType", "EQUALS", "PROFESSIONAL_TECHNICAL", "Aarya is studying a professional technical degree.", "The current course is outside the modelled professional-course route.", sources.panjabraoDte.title),
      rule("panjabrao-institution", "institutionOwnership", "EQUALS", "NON_PRIVATE_UNIVERSITY", "The current institute is not modelled as a private or deemed university.", "Private and deemed universities are excluded by the official page.", sources.panjabraoDte.title),
      rule("panjabrao-cap", "admissionRoute", "EQUALS", "CAP", "The current AISSMS admission was obtained through CAP.", "The current admission was not obtained through CAP.", sources.panjabraoDte.title),
      rule("panjabrao-category", "candidateCategory", "ONE_OF", ["OPEN", "EWS"], "The synthetic OPEN-category admission fits the modelled general/EWS route.", "The current category is outside this modelled route.", sources.panjabraoDte.title),
      rule("panjabrao-income", "familyAnnualIncomeInr", "LTE", 800000, "Synthetic annual family income is within ₹8 lakh.", "Annual family income exceeds the official ₹8 lakh ceiling.", sources.panjabraoDte.title),
      rule("panjabrao-family-limit", "familyBeneficiaryCount", "LTE", 2, "The synthetic family-beneficiary count is within the two-child limit.", "The official page limits the benefit to two children in a family for the year.", sources.panjabraoDte.title),
      rule("panjabrao-hosteller", "hostelStatus", "EQUALS", "HOSTELLER", "The synthetic profile records hosteller status.", "This maintenance scheme requires the applicant to be a hosteller, paying guest, or tenant.", sources.panjabraoDte.title),
      rule("panjabrao-other-allowance", "isReceivingOtherMaintenanceAllowance", "EQUALS", false, "No other maintenance allowance is recorded.", "The official page does not permit another Nirvah Bhatta benefit.", sources.panjabraoDte.title),
      rule("panjabrao-attendance", "attendanceRequirementSatisfied", "EQUALS", true, "The first-semester synthetic profile satisfies the attendance exception.", "The attendance condition is not satisfied.", sources.panjabraoDte.title),
      rule("panjabrao-gap", "educationGapYears", "LTE", 1, "No two-year education gap is recorded.", "A gap of two years or more fails the official condition.", sources.panjabraoDte.title),
    ],
    requiredDocuments: [passportDocuments.ssc, passportDocuments.hsc, passportDocuments.domicile, passportDocuments.income],
    criteriaCoverage: "FULL",
    documentCoverage: "PARTIAL",
    officialSources: [sources.panjabraoDte],
  },
  {
    id: "nsp-pm-usp-csss",
    name: "PM-USP Central Sector Scheme of Scholarship for College and University Students",
    provider: "Department of Higher Education, Government of India",
    portal: "NSP",
    schemeType: "MERIT",
    academicYear: "2026-27",
    benefitSummary: "Financial assistance for day-to-day higher-education expenses under PM-USP CSSS.",
    rules: [
      rule("pmusp-percentile", "class12BoardPercentile", "GTE", 80, "Class XII board percentile is above the required 80th percentile.", "The official scheme requires a Class XII result above the 80th percentile for the relevant board stream.", sources.pmUspGuidelines.title),
      rule("pmusp-income", "familyAnnualIncomeInr", "LTE", 450000, "Synthetic annual family income is within ₹4.5 lakh.", "Annual family income exceeds the current official ₹4.5 lakh summary threshold.", sources.pmUspAnnualReport.title),
      rule("pmusp-mode", "courseMode", "EQUALS", "REGULAR", "The synthetic course mode is regular.", "Correspondence or distance mode is not eligible.", sources.pmUspGuidelines.title),
      rule("pmusp-level", "studyLevel", "ONE_OF", ["UNDERGRADUATE", "POSTGRADUATE"], "The undergraduate degree level is covered.", "Diploma study is excluded by the official scheme guidance.", sources.pmUspGuidelines.title),
      rule("pmusp-recognition", "institutionRecognition", "EQUALS", "RECOGNIZED", "The current institute is represented as recognized in the synthetic profile.", "The scheme requires a recognized college or institution.", sources.pmUspGuidelines.title),
      rule("pmusp-other-support", "isReceivingOtherScholarship", "EQUALS", false, "The synthetic profile records no other scholarship or fee-reimbursement benefit.", "The official scheme does not allow another scholarship or fee-reimbursement benefit.", sources.pmUspGuidelines.title),
    ],
    requiredDocuments: [passportDocuments.hsc, passportDocuments.income],
    criteriaCoverage: "FULL",
    documentCoverage: "PARTIAL",
    officialSources: [sources.pmUspGuidelines, sources.pmUspAnnualReport, sources.pmUspCurrent],
  },
  {
    id: "mahadbt-state-open-merit",
    name: "State Government Open Merit Scholarship",
    provider: "Directorate of Higher Education, Maharashtra",
    portal: "MAHADBT",
    schemeType: "MERIT",
    benefitSummary: "A merit scholarship for eligible Arts, Commerce, Science, and Law graduation students.",
    rules: [
      rule("open-merit-domicile", "domicileState", "EQUALS", "MAHARASHTRA", "Maharashtra domicile is on the verified profile.", "The scheme requires Maharashtra domicile.", sources.stateOpenMerit.title),
      rule("open-merit-study-location", "studyingState", "EQUALS", "MAHARASHTRA", "Aarya studies in Maharashtra.", "Maharashtra students studying outside the state are excluded by the official page.", sources.stateOpenMerit.title),
      rule("open-merit-marks", "class12Percentage", "GTE", 60, "The synthetic Class XII percentage is at least 60%.", "Fresh applicants need at least 60% in Class XII.", sources.stateOpenMerit.title),
      rule("open-merit-stream", "courseType", "ONE_OF", ["ARTS", "COMMERCE", "SCIENCE", "LAW"], "The course stream is included by the official scheme.", "Engineering is not one of the Arts, Commerce, Science, or Law graduation streams listed by the official scheme.", sources.stateOpenMerit.title),
    ],
    requiredDocuments: [passportDocuments.hsc, passportDocuments.domicile],
    criteriaCoverage: "FULL",
    documentCoverage: "PARTIAL",
    officialSources: [sources.stateOpenMerit],
  },
  {
    id: "mahadbt-obc-post-matric",
    name: "Post Matric Scholarship to OBC Students",
    provider: "OBC, SEBC, VJNT & SBC Welfare Department, Maharashtra",
    portal: "MAHADBT",
    schemeType: "WELFARE",
    benefitSummary: "Tuition-fee, examination-fee, and maintenance support according to the official scheme rules.",
    rules: [
      rule("obc-category", "candidateCategory", "EQUALS", "OBC", "The candidate category is OBC.", "Aarya's synthetic category is OPEN; this scheme requires OBC category.", sources.obcPostMatric.title),
      rule("obc-income", "familyAnnualIncomeInr", "LTE", 250000, "Synthetic annual family income is within ₹2.5 lakh.", "Synthetic annual family income exceeds the official ₹2.5 lakh ceiling.", sources.obcPostMatric.title),
      rule("obc-domicile", "domicileState", "EQUALS", "MAHARASHTRA", "Maharashtra domicile is on the verified profile.", "The scheme requires Maharashtra residence.", sources.obcPostMatric.title),
      rule("obc-level", "currentStudyYear", "GTE", 1, "Aarya is in post-matric study.", "The scheme is for post-matric study.", sources.obcPostMatric.title),
      rule("obc-cap", "admissionRoute", "EQUALS", "CAP", "The current professional-course admission was obtained through CAP.", "The official page requires CAP admission for professional courses.", sources.obcPostMatric.title),
    ],
    requiredDocuments: [passportDocuments.hsc, passportDocuments.domicile, passportDocuments.income],
    criteriaCoverage: "FULL",
    documentCoverage: "PARTIAL",
    officialSources: [sources.obcPostMatric],
  },
  {
    id: "mahadbt-post-matric-disability",
    name: "Post-Matric Scholarship for Persons with Disability",
    provider: "Social Justice and Special Assistance Department, Maharashtra",
    portal: "MAHADBT",
    schemeType: "WELFARE",
    benefitSummary: "Post-matric fee and maintenance support according to disability and course-group rules.",
    rules: [
      rule("disability-threshold", "disabilityPercentage", "GTE", 40, "The synthetic disability percentage meets the 40% threshold.", "Aarya's synthetic profile records no qualifying disability; the official threshold is 40% or above.", sources.disabilityPostMatric.title),
      rule("disability-domicile", "domicileState", "EQUALS", "MAHARASHTRA", "Maharashtra domicile is on the verified profile.", "The scheme requires Maharashtra residence.", sources.disabilityPostMatric.title),
      rule("disability-recognition", "institutionRecognition", "EQUALS", "RECOGNIZED", "The current institute is represented as recognized in the synthetic profile.", "The scheme requires study at a recognized university or institute.", sources.disabilityPostMatric.title),
      rule("disability-level", "currentStudyYear", "GTE", 1, "Aarya is in post-matric study.", "The scheme is for post-matric study.", sources.disabilityPostMatric.title),
    ],
    requiredDocuments: [passportDocuments.hsc, passportDocuments.domicile],
    criteriaCoverage: "FULL",
    documentCoverage: "PARTIAL",
    officialSources: [sources.disabilityPostMatric],
  },
] as const satisfies readonly ScholarshipScheme[];

export function createInitialScholarshipNavigatorState(): ScholarshipNavigatorState {
  return {
    version: 1,
    profile: {
      candidateId: demoCandidate.id,
      isSynthetic: true,
      nationality: "INDIAN",
      domicileState: "MAHARASHTRA",
      studyingState: "MAHARASHTRA",
      familyAnnualIncomeInr: 400000,
      studyLevel: "UNDERGRADUATE",
      courseType: "PROFESSIONAL_TECHNICAL",
      courseMode: "REGULAR",
      currentStudyYear: 1,
      class12Percentage: 82.4,
      class12BoardPercentile: null,
      hostelStatus: "UNKNOWN",
      disabilityPercentage: 0,
      isReceivingOtherScholarship: false,
      isReceivingOtherMaintenanceAllowance: false,
      familyBeneficiaryCount: 1,
      educationGapYears: 0,
      attendanceRequirementSatisfied: true,
      institutionRecognition: "RECOGNIZED",
      institutionOwnership: "NON_PRIVATE_UNIVERSITY",
      updatedAt: "2026-08-27T09:45:00+05:30",
    },
    handoffs: [],
  };
}
