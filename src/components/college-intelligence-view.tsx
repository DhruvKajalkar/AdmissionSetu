"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { officialCutoffs, officialInstitutes, officialPrograms } from "@/data";
import {
  formatPlacementMetric,
  getCollegeIntelligenceSource,
  getInstituteIntelligence,
} from "@/services";
import { getCandidateClearingInterest, getCandidateMeritPosition } from "@/services/clearing-network";
import { getProgrammeVacancies } from "@/services/admission-state";
import { groupOfficialCutoffs, selectDisplayCutoffs } from "@/services/official-catalog";
import type { PlacementDisclosure } from "@/types";
import { useAdmissionSimulation } from "./admission-simulation-provider";
import { PageHeader } from "./page-header";
import { usePreferenceShortlist } from "./preference-shortlist";
import { useProgrammeCompareSelection } from "./programme-compare-selection";

const metricLabels: Record<PlacementDisclosure["metric"], string> = {
  PLACED_STUDENTS: "Students placed",
  GRADUATING_STUDENTS: "Students graduating",
  MEDIAN_SALARY: "Median salary",
  AVERAGE_SALARY: "Average salary",
  HIGHEST_SALARY: "Highest salary",
  PLACEMENT_DRIVES: "Placement drives",
};

function SourceBadge({ sourceId }: { sourceId: string }) {
  const source = getCollegeIntelligenceSource(sourceId);
  if (!source) return null;
  return <span className="evidence-badge">{source.sourceClass === "OFFICIAL" ? "Official" : "Institute-reported"}</span>;
}

export function CollegeIntelligenceView({ instituteCode }: { instituteCode: string }) {
  const institute = officialInstitutes.find((item) => item.code === instituteCode);
  const profile = getInstituteIntelligence(instituteCode);
  const programmes = officialPrograms.filter((item) => item.instituteCode === instituteCode);
  const cutoffs = useMemo(() => groupOfficialCutoffs(selectDisplayCutoffs(officialCutoffs)), []);
  const { state } = useAdmissionSimulation();
  const { preferences, hasProgram, addProgram } = usePreferenceShortlist();
  const comparison = useProgrammeCompareSelection();
  const [notice, setNotice] = useState("");

  if (!institute || !profile) return null;

  function addPreference(choiceCode: string, label: string) {
    addProgram(choiceCode);
    setNotice(`${label} was added to My Preferences.`);
  }

  function toggleCompare(choiceCode: string, label: string) {
    const wasSelected = comparison.isSelected(choiceCode);
    const succeeded = comparison.toggleProgram(choiceCode);
    setNotice(succeeded
      ? `${label} was ${wasSelected ? "removed from" : "added to"} comparison.`
      : `Comparison is limited to ${comparison.maximum} programmes. Remove one before adding another.`);
  }

  return (
    <>
      <PageHeader
        eyebrow={`College intelligence · Institute ${institute.code}`}
        title={institute.commonName}
        description={institute.name}
        action={<Link className="header-shortlist-link" href="/compare">Compare · {comparison.count}</Link>}
      />

      <nav className="intelligence-breadcrumb" aria-label="Breadcrumb"><Link href="/explore">Explore Colleges</Link><span aria-hidden="true">/</span><span>{institute.commonName}</span></nav>
      {notice ? <div className="preference-confirmation" role="status">✓ {notice}</div> : null}

      <section className="intelligence-overview" aria-labelledby="overview-title">
        <div>
          <p>Public reference data</p>
          <h2 id="overview-title">Overview</h2>
          <p>{profile.overview.value}</p>
          <small>Last verified {profile.lastVerified} · <SourceBadge sourceId={profile.overview.sourceId} /></small>
        </div>
        <dl>
          <div><dt>Location</dt><dd>{institute.locality}, {institute.city}</dd></div>
          <div><dt>Institute type</dt><dd>{institute.status}</dd></div>
          <div><dt>Autonomy</dt><dd>{institute.autonomyStatus}</dd></div>
          <div><dt>University</dt><dd>{institute.university}</dd></div>
        </dl>
      </section>

      <section className="intelligence-section" aria-labelledby="programmes-title">
        <header><div><p>Official CET reference</p><h2 id="programmes-title">Programmes, intake and cutoff context</h2></div><span>{programmes.length} catalogue records</span></header>
        <div className="intelligence-programmes">
          {programmes.map((program) => {
            const observations = cutoffs.get(program.choiceCode) ?? [];
            const round = state.spotRounds.find((item) => item.programId === program.choiceCode);
            const merit = round ? getCandidateMeritPosition(state, round.id) : null;
            const interest = round ? getCandidateClearingInterest(state, state.candidateId, round.id) : null;
            const preference = preferences.find((item) => item.programId === program.choiceCode);
            return (
              <article key={program.choiceCode} className="intelligence-programme-card">
                <div className="intelligence-programme-heading"><div><h3>{program.name}</h3><p>Choice code {program.choiceCode} · sanctioned intake {program.intake}</p></div><span className="evidence-badge">Official CET data</span></div>
                <div className="intelligence-programme-actions">
                  <button type="button" onClick={() => toggleCompare(program.choiceCode, program.name)}>{comparison.isSelected(program.choiceCode) ? "✓ In comparison" : "+ Compare"}</button>
                  {hasProgram(program.choiceCode)
                    ? <Link href="/preferences">Preference #{preference?.position}</Link>
                    : <button type="button" onClick={() => addPreference(program.choiceCode, program.name)}>+ Add to preferences</button>}
                </div>
                {round ? <div className="synthetic-context"><strong>Synthetic live demo</strong><span>{getProgrammeVacancies(state, program.choiceCode)} seats available · Merit position {merit ? `#${merit.position}` : "not currently numbered"} · {interest?.status ?? "Not joined"}</span></div> : null}
                <details>
                  <summary>View historical cutoff observations ({observations.length})</summary>
                  {observations.length ? <div className="compact-cutoff-table" role="region" aria-label={`Historical cutoffs for ${program.name}`} tabIndex={0}>
                    <table><thead><tr><th>Academic year</th><th>CAP round</th><th>Seat type / stage</th><th>Percentile</th><th>Merit no.</th></tr></thead><tbody>
                      {observations.slice(0, 12).map((item) => <tr key={`${item.academicYear}-${item.round}-${item.seatType}-${item.stage}`}><td>{item.academicYear}</td><td>{item.round}</td><td>{item.seatType} · Stage {item.stage}</td><td>{item.percentile.toFixed(4)}</td><td>{item.meritNumber.toLocaleString("en-IN")}</td></tr>)}
                    </tbody></table>
                  </div> : <p className="verified-missing">Not available from a verified source</p>}
                </details>
              </article>
            );
          })}
        </div>
        <p className="intelligence-disclaimer">Cutoffs are historical observations with their original year, round, seat type and stage. They are not an eligibility decision or admission probability.</p>
      </section>

      <div className="intelligence-two-column">
        <section className="intelligence-section" aria-labelledby="fees-title">
          <header><div><p>Public reference data</p><h2 id="fees-title">Fees</h2></div></header>
          {profile.fees.length ? <div className="intelligence-fact-list">{profile.fees.map((fee) => <article key={fee.id}><strong>₹{fee.amountInr.toLocaleString("en-IN")}</strong><span>{fee.feeType.replaceAll("_", " ").toLowerCase()} · {fee.academicYear}</span><p>{fee.categoryScope}</p>{fee.limitation ? <small>{fee.limitation}</small> : null}<SourceBadge sourceId={fee.sourceId} /></article>)}</div> : <p className="verified-missing">Verified fee information not currently available</p>}
        </section>

        <section className="intelligence-section" aria-labelledby="placement-title">
          <header><div><p>Scope preserved</p><h2 id="placement-title">Placement disclosures</h2></div></header>
          {profile.placementDisclosures.length ? <div className="intelligence-fact-list">{profile.placementDisclosures.map((metric) => <article key={metric.id}><strong>{formatPlacementMetric(metric)}</strong><span>{metricLabels[metric.metric]} · {metric.cohort}</span><p>{metric.scope.replaceAll("_", " ").toLowerCase()}</p>{metric.limitation ? <small>{metric.limitation}</small> : null}<SourceBadge sourceId={metric.sourceId} /></article>)}</div> : <p className="verified-missing">Not available from a verified source</p>}
        </section>
      </div>

      <div className="intelligence-two-column">
        <section className="intelligence-section" aria-labelledby="accreditation-title">
          <header><div><p>Verified context</p><h2 id="accreditation-title">Accreditation</h2></div></header>
          {profile.accreditation.length ? <ul className="intelligence-list">{profile.accreditation.map((item) => <li key={item.id}><div><strong>{item.kind}</strong><span>{item.value} · {item.scope.replaceAll("_", " ").toLowerCase()}</span>{item.validThrough ? <small>Valid through {item.validThrough}</small> : null}{item.limitation ? <small>{item.limitation}</small> : null}</div><SourceBadge sourceId={item.sourceId} /></li>)}</ul> : <p className="verified-missing">Not available from a verified source</p>}
        </section>
        <section className="intelligence-section" aria-labelledby="facilities-title">
          <header><div><p>Factual inventory</p><h2 id="facilities-title">Campus and facilities</h2></div></header>
          {profile.facilities.length ? <ul className="intelligence-list">{profile.facilities.map((facility) => <li key={facility.id}><div><strong>{facility.name}</strong><span>{facility.type.replaceAll("_", " ").toLowerCase()}</span>{facility.description ? <small>{facility.description}</small> : null}</div><SourceBadge sourceId={facility.sourceId} /></li>)}</ul> : <p className="verified-missing">Not available from a verified source</p>}
        </section>
      </div>

      <section className="intelligence-section" aria-labelledby="sources-title">
        <header><div><p>Evidence and freshness</p><h2 id="sources-title">Sources</h2></div></header>
        <ul className="source-register">
          <li><div><strong>{institute.source.label}</strong><span>Maharashtra State CET Cell · Official · {institute.source.academicYear}</span></div><a href={institute.source.url} target="_blank" rel="noreferrer" aria-label={`Open ${institute.source.label} (new tab)`}>Open source ↗</a></li>
          {profile.sourceIds.map((sourceId) => getCollegeIntelligenceSource(sourceId)).filter((source) => source !== null).map((source) => <li key={source.id}><div><strong>{source.title}</strong><span>{source.publisher} · {source.sourceClass === "OFFICIAL" ? "Official" : "Institute-reported"}{source.academicYear ? ` · ${source.academicYear}` : ""}</span>{source.notes ? <small>{source.notes}</small> : null}</div><a href={source.url} target="_blank" rel="noreferrer" aria-label={`Open ${source.title} (new tab)`}>Open source ↗</a></li>)}
        </ul>
      </section>
    </>
  );
}
