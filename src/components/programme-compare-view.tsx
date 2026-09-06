"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buildProgrammeComparison, formatPlacementMetric } from "@/services";
import type { PlacementDisclosure, ProgrammeComparisonEntry } from "@/types";
import { useAdmissionSimulation } from "./admission-simulation-provider";
import { PageHeader } from "./page-header";
import { usePreferenceShortlist } from "./preference-shortlist";
import { useProgrammeCompareSelection } from "./programme-compare-selection";

const metricLabels: Record<PlacementDisclosure["metric"], string> = {
  PLACED_STUDENTS: "Students placed", GRADUATING_STUDENTS: "Students graduating", MEDIAN_SALARY: "Median salary",
  AVERAGE_SALARY: "Average salary", HIGHEST_SALARY: "Highest salary", PLACEMENT_DRIVES: "Placement drives",
};

function ComparisonCard({ entry, remove }: { entry: ProgrammeComparisonEntry; remove: () => void }) {
  const { hasProgram, addProgram, preferences } = usePreferenceShortlist();
  const saved = hasProgram(entry.choiceCode);
  const preference = preferences.find((item) => item.programId === entry.choiceCode);
  return <article className="comparison-card">
    <header><span>Institute {entry.instituteCode}</span><button type="button" onClick={remove} aria-label={`Remove ${entry.programmeName} at ${entry.instituteCommonName} from comparison`}>Remove</button></header>
    <h2>{entry.instituteCommonName}</h2><h3>{entry.programmeName}</h3><p>{entry.choiceCode}</p>
    <section><h4>Public reference data</h4><dl className="comparison-facts"><div><dt>Sanctioned intake</dt><dd>{entry.intake}</dd></div><div><dt>Autonomy</dt><dd>{entry.autonomyStatus}</dd></div><div><dt>Location</dt><dd>{entry.location}</dd></div></dl></section>
    <section><h4>Recent verified cutoff observations</h4>{entry.cutoffs.length ? <ul className="comparison-list">{entry.cutoffs.slice(0, 3).map((item) => <li key={`${item.academicYear}-${item.round}-${item.seatType}`}><strong>{item.percentile.toFixed(4)}</strong><span>{item.academicYear} · {item.round} · {item.seatType} · Stage {item.stage}</span></li>)}</ul> : <p className="verified-missing">Not available from a verified source</p>}</section>
    <section><h4>Fees</h4>{entry.fees[0] ? <div className="comparison-single-fact"><strong>₹{entry.fees[0].amountInr.toLocaleString("en-IN")}</strong><span>{entry.fees[0].academicYear} · {entry.fees[0].categoryScope}</span><small>{entry.fees[0].limitation}</small></div> : <p className="verified-missing">Verified fee information not currently available</p>}</section>
    <section><h4>Placement disclosures</h4>{entry.programmePlacements.length || entry.institutePlacements.length ? <ul className="comparison-list">{[...entry.programmePlacements, ...entry.institutePlacements].slice(0, 3).map((metric) => <li key={metric.id}><strong>{formatPlacementMetric(metric)}</strong><span>{metricLabels[metric.metric]} · {metric.cohort}</span><small>{metric.scope.replaceAll("_", " ").toLowerCase()}{metric.limitation ? ` · ${metric.limitation}` : ""}</small></li>)}</ul> : <p className="verified-missing">Not available from a verified source</p>}</section>
    <section><h4>Accreditation</h4>{entry.accreditation.length ? <ul className="comparison-list">{entry.accreditation.slice(0, 3).map((item) => <li key={item.id}><strong>{item.kind}: {item.value}</strong><span>{item.scope.replaceAll("_", " ").toLowerCase()}</span>{item.limitation ? <small>{item.limitation}</small> : null}</li>)}</ul> : <p className="verified-missing">Not available from a verified source</p>}</section>
    <section><h4>Facilities</h4>{entry.facilities.length ? <p className="comparison-facilities">{entry.facilities.map((item) => item.name).join(" · ")}</p> : <p className="verified-missing">Not available from a verified source</p>}</section>
    <section className="comparison-user-context"><h4>Synthetic live demo · Your context</h4><dl className="comparison-facts"><div><dt>Preference</dt><dd>{entry.userContext.preferencePosition ? `#${entry.userContext.preferencePosition}` : "Not saved"}</dd></div><div><dt>Merit position</dt><dd>{entry.userContext.meritPosition ? `#${entry.userContext.meritPosition}` : "Not numbered"}</dd></div><div><dt>Demo vacancies</dt><dd>{entry.userContext.syntheticVacancies === null ? "Not participating" : `${entry.userContext.syntheticVacancies} seats`}</dd></div><div><dt>Status</dt><dd>{entry.userContext.isCurrentAdmission ? "Current admission" : entry.userContext.meritStatus?.replaceAll("_", " ") ?? "Not joined"}</dd></div></dl><small>Existing admission: {entry.userContext.currentAdmissionLabel ?? "None"}</small></section>
    <div className="comparison-actions"><Link className="primary-link-button" href={`/explore/${entry.instituteCode}`}>View {entry.instituteCommonName}</Link>{saved ? <Link href="/preferences">View Preference #{preference?.position}</Link> : <button type="button" onClick={() => addProgram(entry.choiceCode)}>Add to preferences</button>}</div>
    <details className="comparison-sources"><summary>Sources ({entry.sources.length})</summary><ul>{entry.sources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a><span>{source.sourceClass === "OFFICIAL" ? "Official" : "Institute-reported"}{source.academicYear ? ` · ${source.academicYear}` : ""}</span></li>)}</ul></details>
  </article>;
}

export function ProgrammeCompareView() {
  const { state } = useAdmissionSimulation();
  const { preferences } = usePreferenceShortlist();
  const selection = useProgrammeCompareSelection();
  const [announcement, setAnnouncement] = useState("");
  const comparison = useMemo(() => buildProgrammeComparison(selection.selectedChoiceCodes, state, preferences), [preferences, selection.selectedChoiceCodes, state]);
  return <>
    <PageHeader eyebrow="Programme comparison · Evidence, not rankings" title="Compare programmes" description="Review sourced public facts beside your current AdmissionSetu demo state. No score, winner or admission probability is calculated." action={<Link className="header-shortlist-link" href="/explore">Add from Explorer · {selection.count}/{selection.maximum}</Link>} />
    <aside className="comparison-principle"><strong>No overall winner</strong><span>Placement disclosures can use different cohorts and scopes. Compare like with like and open the source before a consequential decision.</span></aside>
    {announcement ? <div className="preference-confirmation" role="status">{announcement}</div> : null}
    {comparison.entries.length >= 2 ? <div className="comparison-grid">{comparison.entries.map((entry) => <ComparisonCard key={entry.choiceCode} entry={entry} remove={() => { selection.removeProgram(entry.choiceCode); setAnnouncement(`${entry.instituteCommonName} ${entry.programmeName} removed from comparison.`); }} />)}</div> : <section className="explorer-empty-state"><span aria-hidden="true">{comparison.entries.length}</span><h2>Select at least two programmes</h2><p>Use Compare on an Explorer or college-detail card. You can compare up to four.</p><Link className="primary-link-button" href="/explore">Open College Explorer</Link></section>}
    <section className="comparison-assistant-cta"><div><p>Ask with the same evidence</p><h2>Want a plain-language summary?</h2><span>Ask AdmissionSetu to compare PICT ENTC and VIT Computer. It will preserve source and scope and will not declare a universal winner.</span></div><Link className="primary-link-button" href="/assistant">Ask AdmissionSetu about this comparison</Link></section>
  </>;
}
