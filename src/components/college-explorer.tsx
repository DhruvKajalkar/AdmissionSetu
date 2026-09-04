"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { groupOfficialCutoffs, searchOfficialPrograms, selectPrimaryCutoff } from "@/services/official-catalog";
import type {
  BranchFamily,
  OfficialAutonomyStatus,
  OfficialCutoffObservation,
  OfficialDatasetMetadata,
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
  "Other",
];

const autonomyStatuses: readonly OfficialAutonomyStatus[] = ["Autonomous", "Non-Autonomous"];

interface CollegeExplorerProps {
  institutes: readonly OfficialInstitute[];
  programs: readonly OfficialProgram[];
  cutoffs: readonly OfficialCutoffObservation[];
  candidate: { name: string; cetPercentile: number; category: string; homeUniversity: string };
  metadata: OfficialDatasetMetadata;
  sources: {
    currentPortal: OfficialSourceReference;
    instituteList: OfficialSourceReference;
    cutoffDocument: OfficialSourceReference;
  };
}

export function CollegeExplorer({ institutes, programs, cutoffs, candidate, metadata, sources }: CollegeExplorerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFamily, setBranchFamily] = useState("");
  const [instituteStatus, setInstituteStatus] = useState("");
  const [autonomyStatus, setAutonomyStatus] = useState("");
  const [location, setLocation] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(24);
  const { count, hasProgram, addProgram } = usePreferenceShortlist();

  const instituteByCode = useMemo(
    () => new Map(institutes.map((institute) => [institute.code, institute])),
    [institutes],
  );
  const cutoffsByChoiceCode = useMemo(() => groupOfficialCutoffs(cutoffs), [cutoffs]);
  const programsByInstitute = useMemo(() => {
    const grouped = new Map<string, OfficialProgram[]>();
    programs.forEach((program) => {
      const existing = grouped.get(program.instituteCode) ?? [];
      existing.push(program);
      grouped.set(program.instituteCode, existing);
    });
    return grouped;
  }, [programs]);
  const instituteStatuses = useMemo(
    () => [...new Set(institutes.map((institute) => institute.status))].sort() as OfficialInstituteStatus[],
    [institutes],
  );
  const locations = useMemo(
    () => [...new Set(institutes.flatMap((institute) => [institute.city, institute.district]))].sort(),
    [institutes],
  );

  const filteredPrograms = useMemo(() => {
    return searchOfficialPrograms(institutes, programs, searchTerm, {
      branchFamily,
      instituteStatus,
      autonomyStatus,
      location,
    }).map((match) => match.program);
  }, [autonomyStatus, branchFamily, instituteStatus, institutes, location, programs, searchTerm]);

  const hasActiveFilters = Boolean(searchTerm || branchFamily || instituteStatus || autonomyStatus || location);

  function clearFilters() {
    setSearchTerm("");
    setBranchFamily("");
    setInstituteStatus("");
    setAutonomyStatus("");
    setLocation("");
    setVisibleLimit(24);
  }

  function handleAdd(program: OfficialProgram, institute: OfficialInstitute) {
    addProgram(program.choiceCode);
    setConfirmation(`${program.name} at ${institute.commonName} was added to My Preferences.`);
  }

  return (
    <>
      <PageHeader
        eyebrow="Official CET reference data · static snapshot"
        title="Explore engineering colleges"
        description={`Search ${institutes.length} institutes and ${programs.length} programmes using official CET Cell institute and intake records.`}
        action={<Link className="header-shortlist-link" href="/preferences">My Preferences · {count}</Link>}
      />

      <section className="candidate-context" aria-labelledby="candidate-context-title">
        <div>
          <p id="candidate-context-title">Synthetic demo candidate</p>
          <strong>{candidate.name}</strong>
        </div>
        <dl>
          <div><dt>MHT-CET percentile</dt><dd>{candidate.cetPercentile.toFixed(2)}</dd></div>
          <div><dt>Category</dt><dd>{candidate.category}</dd></div>
          <div><dt>Home university</dt><dd>{candidate.homeUniversity}</dd></div>
        </dl>
        <p className="candidate-context-note">Shown for context only. Historical cutoffs are not an eligibility decision or admission prediction.</p>
      </section>

      <aside className="data-freshness-summary" aria-label="Official CET reference data freshness">
        <strong>Static official reference snapshot</strong>
        <span>Academic year {metadata.academicYears.join(", ")} · generated {metadata.generatedOn} · not a live CET feed</span>
      </aside>

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
            City or district
            <select value={location} onChange={(event) => setLocation(event.target.value)}>
              <option value="">All locations</option>
              {locations.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </section>

      <details className="data-about">
        <summary>About this data</summary>
        <div>
          <p><strong>Data freshness:</strong> {metadata.sourceSnapshot} Academic years represented: {metadata.academicYears.join(", ")}. Last generated: {metadata.generatedOn}. This is not a live official feed.</p>
          <p><strong>Institute and intake data:</strong> Script-generated from Maharashtra CET Cell 2025–26 institute summaries and checked against the <a href={sources.instituteList.url} target="_blank" rel="noreferrer">official institute list ↗</a>. The <a href={sources.currentPortal.url} target="_blank" rel="noreferrer">2026–27 portal ↗</a> remains the current-cycle reference.</p>
          <p><strong>Cutoff data:</strong> Verified 2025–26 CAP Round II and III observations imported from official CET Cell cutoff publications. Year, round, seat category, candidature context, stage and source remain attached to every observation.</p>
          <p><strong>Synthetic data:</strong> Aarya&apos;s identity, score, preferences, admission, vacancies, and future spot-round state are demonstration records.</p>
          <p>Historical/current-cycle reference information in AdmissionSetu should be verified against the official CET Cell portal before an actual admission decision.</p>
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
            .slice(0, visibleLimit)
            .toSorted((first, second) => {
              const firstInstitute = instituteByCode.get(first.instituteCode)?.commonName ?? "";
              const secondInstitute = instituteByCode.get(second.instituteCode)?.commonName ?? "";
              return firstInstitute.localeCompare(secondInstitute) || first.name.localeCompare(second.name);
            })
            .map((program) => {
              const institute = instituteByCode.get(program.instituteCode);
              if (!institute) return null;
              const cutoffObservations = cutoffsByChoiceCode.get(program.choiceCode) ?? [];
              const cutoff = selectPrimaryCutoff(cutoffObservations);
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
                      <strong>Not available in this static snapshot</strong>
                    )}
                    <small>{cutoff ? `${cutoff.academicYear} ${cutoff.round} · merit no. ${cutoff.meritNumber.toLocaleString("en-IN")}` : "No cutoff has been inferred or estimated."}</small>
                    {cutoff ? <small>Historical comparison only · Aarya is {(candidate.cetPercentile - cutoff.percentile).toFixed(2)} percentile points relative to this observation.</small> : null}
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
                        <h4>Programmes in this reference catalog</h4>
                        <ul>
                          {(programsByInstitute.get(institute.code) ?? []).map((item) => (
                            <li key={item.choiceCode}><span>{item.name}</span><strong>{item.choiceCode} · intake {item.intake}</strong></li>
                          ))}
                        </ul>
                      </div>
                      {cutoffObservations.length ? (
                        <div className="historical-observations">
                          <h4>Historical cutoff observations</h4>
                          <ul>
                            {cutoffObservations.slice(0, 12).map((observation) => (
                              <li key={`${observation.academicYear}-${observation.round}-${observation.candidature}-${observation.seatType}-${observation.stage}`}>
                                <span>{observation.academicYear} · {observation.round} · {observation.seatType} · Stage {observation.stage}</span>
                                <strong>{observation.percentile.toFixed(4)} percentile · merit no. {observation.meritNumber.toLocaleString("en-IN")}</strong>
                                <small>{observation.candidature}</small>
                              </li>
                            ))}
                          </ul>
                          {cutoffObservations.length > 12 ? <p>{cutoffObservations.length - 12} additional category/stage observations remain in the local official dataset.</p> : null}
                        </div>
                      ) : null}
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
      {filteredPrograms.length > visibleLimit ? (
        <div className="load-more-results">
          <button type="button" onClick={() => setVisibleLimit((current) => current + 24)}>Show 24 more programmes</button>
          <span>Showing {Math.min(visibleLimit, filteredPrograms.length)} of {filteredPrograms.length}</span>
        </div>
      ) : null}
    </>
  );
}
