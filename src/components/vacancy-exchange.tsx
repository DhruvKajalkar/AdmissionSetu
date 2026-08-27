"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getProgrammeVacancies } from "@/services/admission-state";
import type { OfficialInstitute, OfficialProgram } from "@/types";
import { useAdmissionSimulation } from "./admission-simulation-provider";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";

export function VacancyExchange({ institutes, programs }: { institutes: readonly OfficialInstitute[]; programs: readonly OfficialProgram[] }) {
  const { state } = useAdmissionSimulation();
  const [search, setSearch] = useState("");
  const [instituteCode, setInstituteCode] = useState("ALL");
  const [availability, setAvailability] = useState("ALL");
  const representedProgramIds = useMemo(() => [...new Set(state.seats.map((seat) => seat.programId))], [state.seats]);
  const rows = useMemo(() => representedProgramIds.flatMap((programId) => {
    const program = programs.find((item) => item.choiceCode === programId);
    const institute = program ? institutes.find((item) => item.code === program.instituteCode) : undefined;
    if (!program || !institute) return [];
    return [{ program, institute, available: getProgrammeVacancies(state, programId), inventory: state.seats.filter((seat) => seat.programId === programId).length }];
  }), [institutes, programs, representedProgramIds, state]);
  const filtered = rows.filter((row) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || `${row.institute.commonName} ${row.institute.name} ${row.program.name} ${row.program.choiceCode}`.toLowerCase().includes(query);
    const matchesInstitute = instituteCode === "ALL" || row.institute.code === instituteCode;
    const matchesAvailability = availability === "ALL" || (availability === "AVAILABLE" ? row.available > 0 : row.available === 0);
    return matchesSearch && matchesInstitute && matchesAvailability;
  });
  const representedInstitutes = [...new Map(rows.map((row) => [row.institute.code, row.institute])).values()];
  const totalAvailable = state.seats.filter((seat) => seat.lifecycleState === "AVAILABLE").length;
  const feedbackProgram = state.lastFeedback ? programs.find((item) => item.choiceCode === state.lastFeedback?.programId) : undefined;
  const feedbackInstitute = feedbackProgram ? institutes.find((item) => item.code === feedbackProgram.instituteCode) : undefined;

  return (
    <>
      <PageHeader eyebrow="Centralized vacancy exchange" title="Live Vacancies" description="See seats that become available as candidates move, withdraw, or confirm admission elsewhere." action={<StatusBadge tone="info">Demo live simulation</StatusBadge>} />
      <div className="vacancy-disclaimer"><strong>These are not official current CET vacancy numbers.</strong><span>The deliberately small inventory is synthetic. Institute and programme names come from the sourced Phase 2 catalog.</span></div>
      {state.lastFeedback && feedbackProgram && feedbackInstitute ? <div className="vacancy-change-banner" role="status"><span>Updated</span><div><strong>{feedbackInstitute.commonName} · {feedbackProgram.name}</strong><p>A released synthetic seat changed availability from {state.lastFeedback.availabilityBefore} to {state.lastFeedback.availabilityAfter}.</p></div></div> : null}
      <section className="vacancy-overview" aria-label="Demo vacancy totals"><div><span>Available now</span><strong>{totalAvailable}</strong><small>derived demo seats</small></div><div><span>Represented programmes</span><strong>{rows.length}</strong><small>small synthetic inventory</small></div><p>Every count below is calculated directly from seats whose live state is <b>AVAILABLE</b>.</p></section>
      <section className="vacancy-filters" aria-labelledby="vacancy-filter-title"><div><h2 id="vacancy-filter-title">Find demo vacancies</h2><p>Filter the centralized synthetic inventory.</p></div><label>Institute or programme<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search institute, branch, or choice code" /></label><label>Institute<select value={instituteCode} onChange={(event) => setInstituteCode(event.target.value)}><option value="ALL">All represented institutes</option>{representedInstitutes.map((institute) => <option key={institute.code} value={institute.code}>{institute.commonName}</option>)}</select></label><label>Availability<select value={availability} onChange={(event) => setAvailability(event.target.value)}><option value="ALL">All availability states</option><option value="AVAILABLE">Seats available</option><option value="FULL">No seats available</option></select></label></section>
      <div className="vacancy-results-heading"><div><h2>{filtered.length} programme{filtered.length === 1 ? "" : "s"}</h2><p>Updated from admission simulation state stored on this device.</p></div></div>
      <div className="vacancy-card-grid">{filtered.map(({ program, institute, available: count, inventory }) => <article className={count ? "vacancy-card available" : "vacancy-card full"} key={program.choiceCode}><div className="vacancy-card-top"><span>{institute.commonName}</span><em>{count ? "Available" : "Currently full"}</em></div><h3>{program.name}</h3><p>{institute.name}</p><dl><div><dt>Demo seats available</dt><dd>{count}</dd></div><div><dt>Simulation inventory</dt><dd>{inventory}</dd></div><div><dt>Choice code</dt><dd>{program.choiceCode}</dd></div></dl><div className="vacancy-card-actions"><Link href="/explore">View programme</Link><Link href="/spot-rounds">Explore spot rounds</Link></div></article>)}</div>
      {!filtered.length ? <section className="vacancy-empty"><h2>No represented programmes match</h2><p>Change the institute, programme, or availability filter.</p></section> : null}
    </>
  );
}
