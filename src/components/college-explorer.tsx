"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  BranchFamily,
  OfficialAutonomyStatus,
  OfficialCutoffObservation,
  OfficialInstitute,
  OfficialInstituteStatus,
  OfficialProgram,
  OfficialSourceReference,
} from "@/types";
import { PageHeader } from "./page-header";
import { usePreferenceShortlist } from "./preference-shortlist";

const branchFamilies: readonly BranchFamily[] = [
  "Computer & IT",
  "AI & Data",
  "Electronics & Electrical",
  "Mechanical & Automation",
  "Civil & Core",
  "Chemical & Biotechnology",
];

const instituteStatuses: readonly OfficialInstituteStatus[] = ["Government", "Un-Aided"];
const autonomyStatuses: readonly OfficialAutonomyStatus[] = ["Autonomous", "Non-Autonomous"];

interface CollegeExplorerProps {
  institutes: readonly OfficialInstitute[];
  programs: readonly OfficialProgram[];
  cutoffs: readonly OfficialCutoffObservation[];
  candidate: { name: string; cetPercentile: number; category: string; homeUniversity: string };
  sources: {
    currentPortal: OfficialSourceReference;
    instituteList: OfficialSourceReference;
    cutoffDocument: OfficialSourceReference;
  };
}

export function CollegeExplorer({ institutes, programs, cutoffs, candidate, sources }: CollegeExplorerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFamily, setBranchFamily] = useState("");
  const [instituteStatus, setInstituteStatus] = useState("");
  const [autonomyStatus, setAutonomyStatus] = useState("");
  const [locality, setLocality] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const { count, hasProgram, addProgram } = usePreferenceShortlist();

  const instituteByCode = useMemo(
    () => new Map(institutes.map((institute) => [institute.code, institute])),
    [institutes],
  );
  const cutoffByChoiceCode = useMemo(
    () => new Map(cutoffs.map((cutoff) => [cutoff.programChoiceCode, cutoff])),
    [cutoffs],
  );
  const programsByInstitute = useMemo(() => {
    const grouped = new Map<string, OfficialProgram[]>();
    programs.forEach((program) => {
      const existing = grouped.get(program.instituteCode) ?? [];
      existing.push(program);
      grouped.set(program.instituteCode, existing);
    });
    return grouped;
  }, [programs]);
  const localities = useMemo(
    () => [...new Set(institutes.map((institute) => institute.locality))].sort(),
    [institutes],
  );

  const filteredPrograms = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase();
    return programs.filter((program) => {
      const institute = instituteByCode.get(program.instituteCode);
      if (!institute) return false;

      const searchable = [
        institute.name,
        institute.commonName,
        institute.code,
        ...institute.searchAliases,
        program.name,
        program.choiceCode,
        program.branchFamily,
      ]
        .join(" ")
        .toLocaleLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (!branchFamily || program.branchFamily === branchFamily) &&
        (!instituteStatus || institute.status === instituteStatus) &&
        (!autonomyStatus || institute.autonomyStatus === autonomyStatus) &&
        (!locality || institute.locality === locality)
      );
    });
  }, [autonomyStatus, branchFamily, instituteByCode, instituteStatus, locality, programs, searchTerm]);

  const hasActiveFilters = Boolean(searchTerm || branchFamily || instituteStatus || autonomyStatus || locality);

  function clearFilters() {
    setSearchTerm("");
    setBranchFamily("");
    setInstituteStatus("");
    setAutonomyStatus("");
    setLocality("");
  }

  function handleAdd(program: OfficialProgram, institute: OfficialInstitute) {
    addProgram(program.choiceCode);
    setConfirmation(`${program.name} at ${institute.commonName} was added to My Preferences.`);
  }

  return (
    <>
      <PageHeader
        eyebrow="Official public catalog · curated prototype subset"
        title="Explore Pune engineering colleges"
        description={`Search ${institutes.length} institutes and ${programs.length} programmes using official CET Cell institute and intake records.`}
        action={<Link className="header-shortlist-link" href="/preferences">My Preferences · {count}</Link>}
      />

      <section className="candidate-context" aria-labelledby="candidate-context-title">
        <div>
          <p id="candidate-context-title">Candidate context</p>
          <strong>{candidate.name}</strong>
        </div>
        <dl>
          <div><dt>MHT-CET percentile</dt><dd>{candidate.cetPercentile.toFixed(2)}</dd></div>
          <div><dt>Category</dt><dd>{candidate.category}</dd></div>
          <div><dt>Home university</dt><dd>{candidate.homeUniversity}</dd></div>
        </dl>
        <p className="candidate-context-note">Shown for context only. Historical cutoffs are not an eligibility decision or admission prediction.</p>
      </section>

      <section className="explorer-controls" aria-labelledby="find-programmes-title">
        <div className="explorer-controls-heading">
          <div>
            <h2 id="find-programmes-title">Find programmes</h2>
            <p>Search by institute, common name, branch, institute code, or choice code.</p>
          </div>
          <button className="clear-filters" type="button" onClick={clearFilters} disabled={!hasActiveFilters}>Clear filters</button>
        </div>

        <div className="search-field">
          <label htmlFor="college-search">Search colleges and programmes</label>
          <input
            id="college-search"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Try PICT, Computer Engineering, or 06271"
          />
        </div>

        <div className="filter-grid">
          <label>
            Branch family
            <select value={branchFamily} onChange={(event) => setBranchFamily(event.target.value)}>
              <option value="">All branches</option>
              {branchFamilies.map((family) => <option key={family}>{family}</option>)}
            </select>
          </label>
          <label>
            Institute type
            <select value={instituteStatus} onChange={(event) => setInstituteStatus(event.target.value)}>
              <option value="">All institute types</option>
              {instituteStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <label>
            Autonomy
            <select value={autonomyStatus} onChange={(event) => setAutonomyStatus(event.target.value)}>
              <option value="">All autonomy statuses</option>
              {autonomyStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <label>
            Locality
            <select value={locality} onChange={(event) => setLocality(event.target.value)}>
              <option value="">All Pune localities</option>
              {localities.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </section>

      <details className="data-about">
        <summary>About this data</summary>
        <div>
          <p><strong>Institute and intake data:</strong> Manually curated from Maharashtra CET Cell 2025–26 institute summaries and the <a href={sources.instituteList.url} target="_blank" rel="noreferrer">official institute list ↗</a>. The <a href={sources.currentPortal.url} target="_blank" rel="noreferrer">2026–27 portal ↗</a> is the current-cycle reference, but this prototype does not claim that the curated catalog is current-cycle seat availability.</p>
          <p><strong>Cutoff data:</strong> A limited set of verified 2024–25 CAP Round III observations from the <a href={sources.cutoffDocument.url} target="_blank" rel="noreferrer">official cutoff document ↗</a>. The seat type is always shown because cutoff figures are contextual, not universal.</p>
          <p><strong>Synthetic data:</strong> Aarya&apos;s identity, score, preferences, admission, vacancies, and future spot-round state are demonstration records.</p>
        </div>
      </details>

      <div className="results-heading" aria-live="polite">
        <div>
          <h2>{filteredPrograms.length} programmes found</h2>
          <p>Programmes are listed alphabetically by institute common name and branch.</p>
        </div>
        <span>{institutes.length} institutes in catalog</span>
      </div>

      {confirmation ? <div className="preference-confirmation" role="status">✓ {confirmation} <Link href="/preferences">Review list</Link></div> : null}

      {filteredPrograms.length ? (
        <div className="program-results">
          {filteredPrograms
            .toSorted((first, second) => {
              const firstInstitute = instituteByCode.get(first.instituteCode)?.commonName ?? "";
              const secondInstitute = instituteByCode.get(second.instituteCode)?.commonName ?? "";
              return firstInstitute.localeCompare(secondInstitute) || first.name.localeCompare(second.name);
            })
            .map((program) => {
              const institute = instituteByCode.get(program.instituteCode);
              if (!institute) return null;
              const cutoff = cutoffByChoiceCode.get(program.choiceCode);
              const alreadyAdded = hasProgram(program.choiceCode);

              return (
                <article className="program-card" key={program.choiceCode}>
                  <div className="program-card-topline">
                    <span className="institute-code">Institute {institute.code}</span>
                    <span className="official-data-label">Official public data · {program.source.academicYear}</span>
                  </div>
                  <p className="program-institute-name">{institute.commonName}</p>
                  <h3>{program.name}</h3>
                  <p className="program-full-name">{institute.name}</p>

                  <dl className="program-facts">
                    <div><dt>Choice code</dt><dd>{program.choiceCode}</dd></div>
                    <div><dt>Autonomy</dt><dd>{institute.autonomyStatus}</dd></div>
                    <div><dt>Sanctioned intake</dt><dd>{program.intake}</dd></div>
                    <div><dt>Locality</dt><dd>{institute.locality}</dd></div>
                  </dl>

                  <div className={cutoff ? "cutoff-reference available" : "cutoff-reference"}>
                    <span>Historical cutoff reference</span>
                    {cutoff ? (
                      <strong>{cutoff.percentile.toFixed(4)} percentile · {cutoff.seatType}</strong>
                    ) : (
                      <strong>Not available in the curated subset</strong>
                    )}
                    <small>{cutoff ? `${cutoff.academicYear} ${cutoff.round} · merit no. ${cutoff.meritNumber.toLocaleString("en-IN")}` : "No cutoff has been inferred or estimated."}</small>
                  </div>

                  <div className="program-actions">
                    <button
                      className={alreadyAdded ? "preference-button added" : "preference-button"}
                      type="button"
                      onClick={() => handleAdd(program, institute)}
                      disabled={alreadyAdded}
                    >
                      {alreadyAdded ? "✓ Already added" : "+ Add to preferences"}
                    </button>
                  </div>

                  <details className="program-details">
                    <summary>View institute details</summary>
                    <div className="program-details-content">
                      <dl>
                        <div><dt>Status</dt><dd>{institute.status}</dd></div>
                        <div><dt>Autonomy</dt><dd>{institute.autonomyStatus}</dd></div>
                        <div><dt>Gender</dt><dd>{institute.gender}</dd></div>
                        <div><dt>University</dt><dd>{institute.university}</dd></div>
                        <div><dt>Address</dt><dd>{institute.address}</dd></div>
                      </dl>
                      <div className="institute-program-list">
                        <h4>Programmes in this curated catalog</h4>
                        <ul>
                          {(programsByInstitute.get(institute.code) ?? []).map((item) => (
                            <li key={item.choiceCode}><span>{item.name}</span><strong>{item.choiceCode} · intake {item.intake}</strong></li>
                          ))}
                        </ul>
                      </div>
                      <p className="detail-disclaimer">Historical cutoff figures can change by round, category, candidature type, and seat type. Always verify the live admission notice before making a decision.</p>
                      <a href={institute.source.url} target="_blank" rel="noreferrer">Open official CET Cell institute summary ↗</a>
                      {cutoff ? <a href={cutoff.source.url} target="_blank" rel="noreferrer">Open official cutoff document ↗</a> : null}
                    </div>
                  </details>
                </article>
              );
            })}
        </div>
      ) : (
        <section className="explorer-empty-state" aria-live="polite">
          <span aria-hidden="true">0</span>
          <h2>No programmes match these filters</h2>
          <p>Try a broader search term, remove one filter, or restore the full catalog.</p>
          <button type="button" onClick={clearFilters}>Clear all filters</button>
        </section>
      )}
    </>
  );
}
