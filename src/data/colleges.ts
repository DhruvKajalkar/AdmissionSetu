import type { College, Program } from "@/types";

// Synthetic Phase 0/1 simulation data. The Phase 2 public explorer uses the
// separately sourced catalog under src/data/official and never reads these cutoffs.

export const colleges = [
  { id: "college-coep", instituteCode: "06006", name: "COEP Technological University", shortName: "COEP Tech", city: "Pune", district: "Pune", university: "SPPU", type: "UNIVERSITY", isSyntheticDataset: true },
  { id: "college-pict", instituteCode: "06271", name: "Pune Institute of Computer Technology", shortName: "PICT", city: "Pune", district: "Pune", university: "SPPU", type: "UNAIDED", isSyntheticDataset: true },
  { id: "college-vit", instituteCode: "06273", name: "Vishwakarma Institute of Technology", shortName: "VIT Pune", city: "Pune", district: "Pune", university: "SPPU", type: "UNAIDED", isSyntheticDataset: true },
  { id: "college-pccoe", instituteCode: "06175", name: "Pimpri Chinchwad College of Engineering", shortName: "PCCOE", city: "Pimpri-Chinchwad", district: "Pune", university: "SPPU", type: "UNAIDED", isSyntheticDataset: true },
  { id: "college-aissms", instituteCode: "06278", name: "AISSMS College of Engineering", shortName: "AISSMS COE", city: "Pune", district: "Pune", university: "SPPU", type: "UNAIDED", isSyntheticDataset: true },
  { id: "college-modern", instituteCode: "06139", name: "Modern Education Society's Wadia College of Engineering", shortName: "MESWCOE", city: "Pune", district: "Pune", university: "SPPU", type: "UNAIDED", isSyntheticDataset: true },
] as const satisfies readonly College[];

const cutoff = (percentile: number) => [
  { academicYear: "2025-26", round: "CAP_III" as const, category: "OPEN" as const, percentile },
];

export const programs = [
  { id: "coep-ce", collegeId: "college-coep", code: "CE", name: "Computer Engineering", intake: 150, historicalCutoffs: cutoff(99.83), currentVacancies: 0 },
  { id: "coep-me", collegeId: "college-coep", code: "ME", name: "Mechanical Engineering", intake: 120, historicalCutoffs: cutoff(98.21), currentVacancies: 1 },
  { id: "coep-ee", collegeId: "college-coep", code: "EE", name: "Electrical Engineering", intake: 120, historicalCutoffs: cutoff(98.76), currentVacancies: 0 },
  { id: "pict-ce", collegeId: "college-pict", code: "CE", name: "Computer Engineering", intake: 240, historicalCutoffs: cutoff(99.56), currentVacancies: 1 },
  { id: "pict-it", collegeId: "college-pict", code: "IT", name: "Information Technology", intake: 180, historicalCutoffs: cutoff(99.31), currentVacancies: 2 },
  { id: "pict-entc", collegeId: "college-pict", code: "ENTC", name: "Electronics and Telecommunication", intake: 240, historicalCutoffs: cutoff(98.62), currentVacancies: 3 },
  { id: "vit-ce", collegeId: "college-vit", code: "CE", name: "Computer Engineering", intake: 240, historicalCutoffs: cutoff(98.94), currentVacancies: 2 },
  { id: "vit-ai", collegeId: "college-vit", code: "AI_DS", name: "Artificial Intelligence and Data Science", intake: 180, historicalCutoffs: cutoff(98.48), currentVacancies: 4 },
  { id: "vit-me", collegeId: "college-vit", code: "ME", name: "Mechanical Engineering", intake: 120, historicalCutoffs: cutoff(94.73), currentVacancies: 6 },
  { id: "pccoe-ce", collegeId: "college-pccoe", code: "CE", name: "Computer Engineering", intake: 240, historicalCutoffs: cutoff(98.12), currentVacancies: 3 },
  { id: "pccoe-it", collegeId: "college-pccoe", code: "IT", name: "Information Technology", intake: 180, historicalCutoffs: cutoff(97.68), currentVacancies: 2 },
  { id: "pccoe-me", collegeId: "college-pccoe", code: "ME", name: "Mechanical Engineering", intake: 120, historicalCutoffs: cutoff(91.84), currentVacancies: 8 },
  { id: "aissms-ce", collegeId: "college-aissms", code: "CE", name: "Computer Engineering", intake: 180, historicalCutoffs: cutoff(96.38), currentVacancies: 2 },
  { id: "aissms-entc", collegeId: "college-aissms", code: "ENTC", name: "Electronics and Telecommunication", intake: 120, historicalCutoffs: cutoff(92.74), currentVacancies: 5 },
  { id: "aissms-civil", collegeId: "college-aissms", code: "CIVIL", name: "Civil Engineering", intake: 60, historicalCutoffs: cutoff(84.35), currentVacancies: 9 },
  { id: "modern-ce", collegeId: "college-modern", code: "CE", name: "Computer Engineering", intake: 180, historicalCutoffs: cutoff(95.76), currentVacancies: 4 },
  { id: "modern-entc", collegeId: "college-modern", code: "ENTC", name: "Electronics and Telecommunication", intake: 120, historicalCutoffs: cutoff(89.65), currentVacancies: 7 },
  { id: "modern-me", collegeId: "college-modern", code: "ME", name: "Mechanical Engineering", intake: 60, historicalCutoffs: cutoff(82.42), currentVacancies: 10 },
] as const satisfies readonly Program[];
