"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getPreferenceConsequence, reviewPreferenceList } from "@/services/preference-safety";
import type {
  CapRoundRule,
  CurrentSeatContext,
  DemoAdmissionCycle,
  OfficialCutoffObservation,
  OfficialInstitute,
  OfficialProgram,
} from "@/types";
import { PageHeader } from "./page-header";
import { usePreferenceShortlist } from "./preference-shortlist";

type PreferenceScreen = "DEFAULT" | "ARRANGE" | "REVIEW" | "CONFIRMED";

interface PreferenceBuilderProps {
  institutes: readonly OfficialInstitute[];
  programs: readonly OfficialProgram[];
  cutoffs: readonly OfficialCutoffObservation[];
  rule: CapRoundRule;
  cycle: DemoAdmissionCycle;
  currentSeat: CurrentSeatContext;
}

function formatDeadline(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    timeZoneName: "short",
  }).format(new Date(value));
}

function formatConfirmedAt(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export function PreferenceBuilder({
  institutes,
  programs,
  cutoffs,
  rule,
  cycle,
  currentSeat,
}: PreferenceBuilderProps) {
  const {
    preferences,
    count,
    confirmedSubmission,
    confirmationIsCurrent,
    removeProgram,
    moveProgram,
    setAcceptanceIntent,
    confirmDemoSubmission,
  } = usePreferenceShortlist();
  const [screen, setScreen] = useState<PreferenceScreen>("DEFAULT");
  const [draggedProgramId, setDraggedProgramId] = useState<string | null>(null);
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const [ruleAcknowledged, setRuleAcknowledged] = useState(false);
  const [cautionsAcknowledged, setCautionsAcknowledged] = useState(false);

  const instituteByCode = useMemo(
    () => new Map(institutes.map((institute) => [institute.code, institute])),
    [institutes],
  );
  const programByCode = useMemo(
    () => new Map(programs.map((program) => [program.choiceCode, program])),
    [programs],
  );
  const cutoffByProgram = useMemo(() => {
    const result = new Map<string, OfficialCutoffObservation>();
    cutoffs.forEach((cutoff) => {
      if (!result.has(cutoff.programChoiceCode)) result.set(cutoff.programChoiceCode, cutoff);
    });
    return result;
  }, [cutoffs]);
  const review = useMemo(() => reviewPreferenceList(preferences, rule), [preferences, rule]);
  const deadlineOpen = new Date(cycle.now).getTime() <= new Date(cycle.preferenceReviewDeadline).getTime();
  const activeScreen =
    screen === "DEFAULT" ? (confirmationIsCurrent ? "CONFIRMED" : "ARRANGE") : screen;
  const autoFreezeLimit = rule.autoFreezePreferenceLimit ?? 0;

  function beginReview() {
    setRuleAcknowledged(false);
    setCautionsAcknowledged(false);
    setPendingRemovalId(null);
    setScreen("REVIEW");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function confirmPreferences() {
    if (
      review.blockingCount > 0 ||
      !ruleAcknowledged ||
      (review.cautionCount > 0 && !cautionsAcknowledged)
    ) {
      return;
    }
    confirmDemoSubmission(rule.round, cycle.deterministicConfirmationAt);
    setScreen("CONFIRMED");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function preferenceRows(start: number, end?: number) {
    return preferences.slice(start, end).map((preference) => {
      const program = programByCode.get(preference.programId);
      if (!program) return null;
      const institute = instituteByCode.get(program.instituteCode);
      if (!institute) return null;
      const cutoff = cutoffByProgram.get(program.choiceCode);
      const consequence = getPreferenceConsequence(preference, rule, currentSeat);
      const isFirst = preference.position === 1;
      const isLast = preference.position === preferences.length;
      const isPendingRemoval = pendingRemovalId === preference.programId;

      return (
        <li
          className="preference-choice"
          key={preference.programId}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            if (draggedProgramId) moveProgram(draggedProgramId, preference.position - 1);
            setDraggedProgramId(null);
          }}
        >
          <div className="preference-choice-order">
            <span aria-label={`Preference ${preference.position}`}>#{preference.position}</span>
            <button
              className="drag-handle"
              draggable
              type="button"
              aria-label={`Drag Preference ${preference.position}: ${program.name}`}
              title="Drag to reorder on desktop"
              onDragStart={(event) => {
                setDraggedProgramId(preference.programId);
                event.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => setDraggedProgramId(null)}
            >
              ⋮⋮
            </button>
          </div>

          <div className="preference-choice-main">
            <div className="preference-choice-heading">
              <div>
                <p>{institute.commonName} · Institute {institute.code}</p>
                <h3>{program.name}</h3>
                <span>{program.choiceCode} · {program.branchFamily}</span>
              </div>
              <span className={consequence.autoFrozen ? "rule-chip auto-freeze" : "rule-chip betterment"}>
                {consequence.autoFrozen ? "Auto-freeze zone" : "Betterment eligible zone"}
              </span>
            </div>

            {cutoff ? (
              <p className="historical-cutoff-note">
                Historical reference: {cutoff.percentile.toFixed(2)} percentile · {cutoff.seatType} · {cutoff.round}, {cutoff.academicYear}
              </p>
            ) : null}

            <fieldset className="acceptance-intent">
              <legend>If allotted this choice, would you genuinely accept it?</legend>
              <label>
                <input
                  type="radio"
                  name={`accept-${preference.programId}`}
                  checked={preference.acceptanceIntent === "YES"}
                  onChange={() => setAcceptanceIntent(preference.programId, "YES")}
                />
                Yes, I would accept this
              </label>
              <label>
                <input
                  type="radio"
                  name={`accept-${preference.programId}`}
                  checked={preference.acceptanceIntent === "UNSURE"}
                  onChange={() => setAcceptanceIntent(preference.programId, "UNSURE")}
                />
                I&apos;m not sure
              </label>
            </fieldset>

            <details className="consequence-preview">
              <summary>What happens if I get this?</summary>
              <dl>
                <div>
                  <dt>New allotment</dt>
                  <dd>{institute.commonName} — {program.name}</dd>
                </div>
                <div>
                  <dt>Current seat</dt>
                  <dd>{consequence.currentSeatEffect}</dd>
                </div>
                <div>
                  <dt>CAP status</dt>
                  <dd>{consequence.capStatus}</dd>
                </div>
                <div>
                  <dt>Next round</dt>
                  <dd>{consequence.nextRoundStatus}</dd>
                </div>
              </dl>
            </details>
          </div>

          <div className="preference-choice-actions" aria-label={`Reorder or remove Preference ${preference.position}`}>
            <button
              type="button"
              disabled={isFirst}
              onClick={() => moveProgram(preference.programId, preference.position - 2)}
              aria-label={`Move ${program.name} up`}
            >
              ↑ <span>Up</span>
            </button>
            <button
              type="button"
              disabled={isLast}
              onClick={() => moveProgram(preference.programId, preference.position)}
              aria-label={`Move ${program.name} down`}
            >
              ↓ <span>Down</span>
            </button>
            {isPendingRemoval ? (
              <div className="remove-confirmation" role="group" aria-label={`Confirm removal of ${program.name}`}>
                <span>Remove?</span>
                <button
                  className="danger-text-button"
                  type="button"
                  onClick={() => {
                    removeProgram(preference.programId);
                    setPendingRemovalId(null);
                  }}
                >
                  Yes
                </button>
                <button type="button" onClick={() => setPendingRemovalId(null)}>Cancel</button>
              </div>
            ) : (
              <button
                className="remove-choice-button"
                type="button"
                onClick={() => setPendingRemovalId(preference.programId)}
              >
                Remove
              </button>
            )}
          </div>
        </li>
      );
    });
  }

  function renderCurrentSeat() {
    return (
      <section className="current-seat-context" aria-labelledby="current-seat-title">
        <div>
          <p className="context-label">Seat you currently hold</p>
          <h2 id="current-seat-title">{currentSeat.instituteShortName} · {currentSeat.programName}</h2>
        </div>
        <dl>
          <div>
            <dt>Allotted in</dt>
            <dd>{cycle.currentSeatAllottedRound}</dd>
          </div>
          <div>
            <dt>Betterment</dt>
            <dd>{currentSeat.bettermentActive ? "Active" : "Not active"}</dd>
          </div>
        </dl>
        <p>This remains your current seat unless the simulated admission process gives you a higher preference or you intentionally exit. This page does not change it.</p>
      </section>
    );
  }

  function renderArrange() {
    return (
      <>
        {confirmedSubmission && !confirmationIsCurrent ? (
          <div className="preference-status-banner warning" role="status">
            <strong>Your saved preferences changed after the last demo confirmation.</strong>
            Review and confirm the updated order before treating this prototype option form as current.
          </div>
        ) : null}

        {screen === "ARRANGE" && confirmationIsCurrent ? (
          <div className="preference-status-banner info" role="status">
            You are editing the confirmed demo list. Any change will mark that confirmation as outdated.
            <button type="button" onClick={() => setScreen("CONFIRMED")}>Return to confirmation</button>
          </div>
        ) : null}

        {count === 0 ? (
          <section className="explorer-empty-state">
            <span aria-hidden="true">0</span>
            <h2>No preferences added</h2>
            <p>Add programmes from College Explorer, then return here to arrange them.</p>
            <Link className="primary-link-button" href="/explore">Explore colleges</Link>
          </section>
        ) : (
          <div className="preference-zones">
            <section className="preference-zone auto-freeze-zone" aria-labelledby="auto-freeze-heading">
              <header>
                <div>
                  <p>Positions 1–{autoFreezeLimit}</p>
                  <h2 id="auto-freeze-heading">Auto-freeze zone</h2>
                </div>
                <span>{Math.min(count, autoFreezeLimit)} of {autoFreezeLimit} positions used</span>
              </header>
              <p className="zone-explanation">An allotment in any of these positions in CAP Round III is automatically frozen. You would not be eligible for subsequent CAP rounds.</p>
              <ol className="preference-choice-list" start={1}>{preferenceRows(0, autoFreezeLimit)}</ol>
              {count < autoFreezeLimit ? (
                <p className="zone-empty-slots">{autoFreezeLimit - count} auto-freeze position{autoFreezeLimit - count === 1 ? "" : "s"} currently empty.</p>
              ) : null}
            </section>

            <section className="preference-zone betterment-zone" aria-labelledby="betterment-heading">
              <header>
                <div>
                  <p>Positions {autoFreezeLimit + 1} onward</p>
                  <h2 id="betterment-heading">Betterment eligible zone</h2>
                </div>
                <span>{Math.max(count - autoFreezeLimit, 0)} preferences</span>
              </header>
              <p className="zone-explanation">These positions are outside the first-six auto-freeze rule. After accepting an allotment here, a candidate may choose Not Freeze / Betterment according to the official process.</p>
              {count > autoFreezeLimit ? (
                <ol className="preference-choice-list" start={autoFreezeLimit + 1}>{preferenceRows(autoFreezeLimit)}</ol>
              ) : (
                <p className="zone-empty-slots">Preferences moved below #6 will appear here.</p>
              )}
            </section>
          </div>
        )}

        <div className="preference-builder-footer">
          <Link className="secondary-link-button" href="/explore">← Add more from College Explorer</Link>
          <button className="primary-action-button" type="button" onClick={beginReview}>
            Review preference safety →
          </button>
        </div>
      </>
    );
  }

  function renderReview() {
    const canConfirm =
      review.blockingCount === 0 &&
      ruleAcknowledged &&
      (review.cautionCount === 0 || cautionsAcknowledged);

    return (
      <>
        <section className="review-summary" aria-labelledby="review-summary-title">
          <div>
            <p className="context-label">Safety review result</p>
            <h2 id="review-summary-title">
              {review.blockingCount > 0
                ? `${review.blockingCount} issue${review.blockingCount === 1 ? "" : "s"} must be fixed`
                : review.cautionCount > 0
                  ? `${review.cautionCount} choice${review.cautionCount === 1 ? " needs" : "s need"} your attention`
                  : "No safety findings in this list"}
            </h2>
            <p>The review checks the verified CAP Round III auto-freeze rule and your stated acceptance intent. It does not recommend or rank colleges.</p>
          </div>
          <div className="review-totals" aria-label="Review totals">
            <span><strong>{count}</strong> preferences</span>
            <span className={review.cautionCount ? "has-cautions" : ""}><strong>{review.cautionCount}</strong> cautions</span>
            <span className={review.blockingCount ? "has-blockers" : ""}><strong>{review.blockingCount}</strong> blocking</span>
          </div>
        </section>

        {review.findings.length ? (
          <section className="safety-findings" aria-labelledby="findings-title">
            <h2 id="findings-title">Review findings</h2>
            <div className="finding-list">
              {review.findings.map((finding) => {
                const preference = finding.preferenceId
                  ? preferences.find((item) => item.programId === finding.preferenceId)
                  : undefined;
                const program = preference ? programByCode.get(preference.programId) : undefined;
                return (
                  <article className={`safety-finding ${finding.severity.toLowerCase()}`} key={finding.id}>
                    <span className="finding-severity">{finding.severity === "BLOCKING" ? "Action required" : "Caution"}</span>
                    <h3>{finding.title}{program ? ` · ${program.name}` : ""}</h3>
                    <p>{finding.explanation}</p>
                    {finding.type === "UNSURE_AUTO_FREEZE" && preference ? (
                      <div className="finding-actions">
                        <button
                          type="button"
                          onClick={() => setAcceptanceIntent(preference.programId, "YES")}
                        >
                          I would accept this
                        </button>
                        {preferences.length > autoFreezeLimit ? (
                          <button type="button" onClick={() => moveProgram(preference.programId, autoFreezeLimit)}>
                            Move below #{autoFreezeLimit}
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="preference-status-banner success" role="status">
            <strong>Your stated intent is consistent with the verified Round III auto-freeze rule.</strong>
            You still need to read and acknowledge the rule before confirming this demo form.
          </div>
        )}

        <section className="review-order" aria-labelledby="review-order-title">
          <div className="review-order-heading">
            <div>
              <p className="context-label">Final order to confirm</p>
              <h2 id="review-order-title">Your {cycle.roundLabel} option form</h2>
            </div>
            <button type="button" onClick={() => setScreen("ARRANGE")}>Edit order or intent</button>
          </div>
          {preferences.length ? (
            <ol>
              {preferences.map((preference) => {
                const program = programByCode.get(preference.programId);
                const institute = program ? instituteByCode.get(program.instituteCode) : undefined;
                if (!program || !institute) return null;
                return (
                  <li key={preference.programId}>
                    <span>#{preference.position}</span>
                    <div><strong>{program.name}</strong><small>{institute.commonName}</small></div>
                    <em>{preference.acceptanceIntent === "YES" ? "Would accept" : "Not sure"}</em>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="empty-review-order">No preferences are available to confirm.</p>
          )}
        </section>

        <section className="confirmation-acknowledgements" aria-labelledby="acknowledgement-title">
          <h2 id="acknowledgement-title">Before you confirm</h2>
          <label>
            <input
              type="checkbox"
              checked={ruleAcknowledged}
              onChange={(event) => setRuleAcknowledged(event.target.checked)}
            />
            <span>I understand that an allotment in Preferences #1–#{autoFreezeLimit} in CAP Round III is automatically frozen and ends participation in subsequent CAP rounds.</span>
          </label>
          {review.cautionCount > 0 ? (
            <label className="caution-acknowledgement">
              <input
                type="checkbox"
                checked={cautionsAcknowledged}
                onChange={(event) => setCautionsAcknowledged(event.target.checked)}
              />
              <span>I have reviewed the cautions above and intentionally want to keep these choices in the auto-freeze zone.</span>
            </label>
          ) : null}
          <p>Prototype simulation only — confirming here does not submit information to the Maharashtra CET Cell.</p>
        </section>

        <div className="preference-builder-footer">
          <button className="secondary-action-button" type="button" onClick={() => setScreen("ARRANGE")}>← Back to arrange</button>
          <button className="primary-action-button" type="button" disabled={!canConfirm} onClick={confirmPreferences}>
            Confirm demo option form
          </button>
        </div>
      </>
    );
  }

  function renderConfirmed() {
    const submission = confirmedSubmission;
    return (
      <section className="confirmed-option-form" aria-labelledby="confirmed-title">
        <div className="confirmation-check" aria-hidden="true">✓</div>
        <p className="context-label">Demo confirmation saved on this device</p>
        <h2 id="confirmed-title">Your {cycle.roundLabel} preference order is confirmed</h2>
        <p className="confirmed-lead">This is a simulated AdmissionSetu confirmation. Nothing has been submitted to the CET Cell, and your current seat remains unchanged.</p>
        <dl className="confirmation-details">
          <div><dt>Prototype reference</dt><dd>{submission?.id ?? `demo-option-form-round-${rule.round}`}</dd></div>
          <div><dt>Confirmed at</dt><dd>{formatConfirmedAt(submission?.confirmedAt ?? cycle.deterministicConfirmationAt)}</dd></div>
          <div><dt>Preferences</dt><dd>{preferences.length}</dd></div>
          <div><dt>Current seat</dt><dd>{currentSeat.instituteShortName} · held</dd></div>
        </dl>
        <ol className="confirmed-preference-list">
          {preferences.map((preference) => {
            const program = programByCode.get(preference.programId);
            const institute = program ? instituteByCode.get(program.instituteCode) : undefined;
            if (!program || !institute) return null;
            return (
              <li key={preference.programId}>
                <span>#{preference.position}</span>
                <div><strong>{program.name}</strong><small>{institute.commonName}</small></div>
                <em>{preference.position <= autoFreezeLimit ? "Auto-freeze position" : "Outside first six"}</em>
              </li>
            );
          })}
        </ol>
        <div className="confirmed-actions">
          <Link className="secondary-link-button" href="/dashboard">Return to dashboard</Link>
          <button
            className="primary-action-button"
            type="button"
            disabled={!deadlineOpen}
            onClick={() => setScreen("ARRANGE")}
          >
            {deadlineOpen ? "Edit preferences" : "Editing deadline closed"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={`${cycle.roundLabel} · option form preparation`}
        title="My Preferences"
        description="Put options in the exact order you want them considered. Your order has real consequences during CAP."
        action={<span className="preference-count-badge">{count} preference{count === 1 ? "" : "s"}</span>}
      />

      <div className="preference-stepper" aria-label="Preference form progress">
        <span className={activeScreen === "ARRANGE" ? "active" : "complete"}><b>1</b> Arrange preferences</span>
        <i aria-hidden="true">→</i>
        <span className={activeScreen === "REVIEW" ? "active" : activeScreen === "CONFIRMED" ? "complete" : ""}><b>2</b> Safety review</span>
        <i aria-hidden="true">→</i>
        <span className={activeScreen === "CONFIRMED" ? "active" : ""}><b>3</b> Demo confirmation</span>
      </div>

      <aside className="round-rule-banner" aria-labelledby="round-rule-title">
        <div>
          <p>Important rule for {rule.label}</p>
          <h2 id="round-rule-title">The first {autoFreezeLimit} preferences are auto-frozen if allotted</h2>
          <p>{rule.explanation} Only place a choice in the first six if you would genuinely take that seat.</p>
        </div>
        <div className="round-rule-meta">
          <span>Review closes</span>
          <strong>{formatDeadline(cycle.preferenceReviewDeadline)}</strong>
          <a href={rule.source.url} target="_blank" rel="noreferrer">Read the official CET Cell source ↗</a>
        </div>
      </aside>

      {renderCurrentSeat()}
      {activeScreen === "ARRANGE" ? renderArrange() : null}
      {activeScreen === "REVIEW" ? renderReview() : null}
      {activeScreen === "CONFIRMED" ? renderConfirmed() : null}
    </>
  );
}
