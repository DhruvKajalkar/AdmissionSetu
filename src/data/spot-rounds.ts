import type { SpotRound, SpotRoundParticipant } from "@/types";
import { demoCandidate } from "./candidate";

export const spotRounds = [
  { id: "spot-vit-2026", title: "Institute Spot Round — VIT Pune", collegeId: "college-vit", programIds: ["vit-ce", "vit-ai", "vit-me"], registrationDeadline: "2026-08-30T18:00:00+05:30", startsAt: "2026-09-01T11:00:00+05:30", status: "REGISTRATION_OPEN", vacancyCount: 12 },
  { id: "spot-pict-2026", title: "Institute Spot Round — PICT", collegeId: "college-pict", programIds: ["pict-ce", "pict-it", "pict-entc"], registrationDeadline: "2026-08-31T16:00:00+05:30", startsAt: "2026-09-02T10:30:00+05:30", status: "REGISTRATION_OPEN", vacancyCount: 6 },
  { id: "spot-pccoe-2026", title: "Vacancy Round — PCCOE", collegeId: "college-pccoe", programIds: ["pccoe-ce", "pccoe-it", "pccoe-me"], registrationDeadline: "2026-09-01T17:00:00+05:30", startsAt: "2026-09-03T12:00:00+05:30", status: "SCHEDULED", vacancyCount: 13 },
] as const satisfies readonly SpotRound[];

export const spotRoundParticipants: readonly SpotRoundParticipant[] = [
  { id: "participant-aarya-vit", spotRoundId: "spot-vit-2026", candidateId: demoCandidate.id, status: "INTERESTED", joinedAt: "2026-08-24T09:45:00+05:30" },
  { id: "participant-aarya-pict", spotRoundId: "spot-pict-2026", candidateId: demoCandidate.id, status: "INTERESTED", joinedAt: "2026-08-25T11:10:00+05:30" },
];
