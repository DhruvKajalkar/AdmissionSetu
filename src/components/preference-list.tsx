"use client";

import Link from "next/link";
import type { OfficialInstitute, OfficialProgram } from "@/types";
import { PageHeader } from "./page-header";
import { usePreferenceShortlist } from "./preference-shortlist";

export function PreferenceList({
  institutes,
  programs,
}: {
  institutes: readonly OfficialInstitute[];
  programs: readonly OfficialProgram[];
}) {
  const { programIds, count } = usePreferenceShortlist();
  const instituteByCode = new Map(institutes.map((institute) => [institute.code, institute]));
  const programByCode = new Map(programs.map((program) => [program.choiceCode, program]));
  const selectedPrograms = programIds.flatMap((choiceCode) => {
    const program = programByCode.get(choiceCode);
    return program ? [program] : [];
  });

  return (
    <>
      <PageHeader
        eyebrow="Preference shortlist"
        title="My Preferences"
        description="Programmes saved from the College Explorer are kept on this device for the prototype."
        action={<span className="preference-count-badge">{count} saved</span>}
      />

      <div className="phase-boundary-note">
        <strong>This is a shortlist, not a submitted CAP preference form.</strong>
        Ordering, safety review, submission, and locking are intentionally reserved for a later phase.
      </div>

      {selectedPrograms.length ? (
        <ol className="saved-preference-list" aria-label="Saved programme shortlist">
          {selectedPrograms.map((program, index) => {
            const institute = instituteByCode.get(program.instituteCode);
            if (!institute) return null;
            return (
              <li key={program.choiceCode}>
                <span className="saved-preference-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <p>{institute.commonName} · Institute {institute.code}</p>
                  <h2>{program.name}</h2>
                  <span>{program.choiceCode} · {program.branchFamily} · Intake {program.intake}</span>
                </div>
                <span className="saved-status">Saved</span>
              </li>
            );
          })}
        </ol>
      ) : (
        <section className="explorer-empty-state">
          <h2>No programmes saved yet</h2>
          <p>Use the College Explorer to build a simple shortlist.</p>
        </section>
      )}

      <div className="preference-page-action">
        <Link className="primary-link-button" href="/explore">← Continue exploring colleges</Link>
      </div>
    </>
  );
}
