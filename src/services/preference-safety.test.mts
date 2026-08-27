import { strict as assert } from "node:assert";
import test from "node:test";
import type { CandidatePreference, CapRoundRule } from "../types/admissions.ts";
import { reorderPreferences, reviewPreferenceList } from "./preference-safety.ts";

const roundThreeRule: CapRoundRule = {
  round: 3,
  label: "CAP Round III",
  autoFreezePreferenceLimit: 6,
  bettermentAvailableAfterRound: true,
  finalRound: false,
  explanation: "Test rule",
  source: {
    kind: "OFFICIAL_CET_CELL",
    label: "Test source",
    academicYear: "2026-27",
    url: "https://fe2026.mahacet.org/StaticPages/HomePage",
    accessedOn: "2026-08-27",
  },
};

function preferences(count: number, unsurePosition?: number): CandidatePreference[] {
  return Array.from({ length: count }, (_, index) => ({
    programId: `programme-${index + 1}`,
    position: index + 1,
    acceptanceIntent: index + 1 === unsurePosition ? "UNSURE" : "YES",
  }));
}

test("UNSURE at preference 1 produces an auto-freeze caution", () => {
  const review = reviewPreferenceList(preferences(7, 1), roundThreeRule);
  assert.equal(review.cautionCount, 1);
  assert.equal(review.findings[0]?.position, 1);
});

test("UNSURE at preference 6 produces an auto-freeze caution", () => {
  const review = reviewPreferenceList(preferences(7, 6), roundThreeRule);
  assert.equal(review.cautionCount, 1);
  assert.equal(review.findings[0]?.position, 6);
});

test("UNSURE at preference 7 does not produce an auto-freeze caution", () => {
  assert.equal(reviewPreferenceList(preferences(7, 7), roundThreeRule).cautionCount, 0);
});

test("YES inside the first six does not produce an intent warning", () => {
  assert.equal(reviewPreferenceList(preferences(6), roundThreeRule).cautionCount, 0);
});

test("an empty list produces a blocking finding", () => {
  const review = reviewPreferenceList([], roundThreeRule);
  assert.equal(review.blockingCount, 1);
  assert.equal(review.findings[0]?.type, "EMPTY_LIST");
});

test("a duplicate programme is detected defensively", () => {
  const duplicate = preferences(2);
  duplicate[1] = { ...duplicate[1], programId: duplicate[0].programId };
  const review = reviewPreferenceList(duplicate, roundThreeRule);
  assert.equal(review.blockingCount, 1);
  assert.equal(review.findings[0]?.type, "DUPLICATE_PROGRAM");
});

test("reordering recomputes positions", () => {
  const reordered = reorderPreferences(preferences(3), 0, 2);
  assert.deepEqual(reordered.map((item) => item.programId), ["programme-2", "programme-3", "programme-1"]);
  assert.deepEqual(reordered.map((item) => item.position), [1, 2, 3]);
});

