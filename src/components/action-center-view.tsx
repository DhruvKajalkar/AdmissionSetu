"use client";

import Link from "next/link";
import { demoCandidate } from "@/data";
import { deriveAlerts, getAlertSummary, getAlertTimingLabel } from "@/services";
import type { AlertItem, AlertSnoozeOption } from "@/types";
import { useAdmissionSimulation } from "./admission-simulation-provider";
import { PageHeader } from "./page-header";
import { usePreferenceShortlist } from "./preference-shortlist";
import { StatusBadge } from "./status-badge";

const snoozeOptions: readonly { option: AlertSnoozeOption; label: string }[] = [
  { option: "IN_ONE_HOUR", label: "In 1 hour" },
  { option: "TOMORROW_MORNING", label: "Tomorrow morning" },
  { option: "LATER", label: "Later" },
];

function toneForPriority(priority: AlertItem["priority"]) {
  if (priority === "CRITICAL") return "danger" as const;
  if (priority === "HIGH") return "warning" as const;
  if (priority === "MEDIUM") return "info" as const;
  return "neutral" as const;
}

function AlertCard({ alert }: { alert: AlertItem }) {
  const { snoozeAlert, dismissAlert } = useAdmissionSimulation();
  const timing = getAlertTimingLabel(alert);
  return (
    <article className={`action-alert priority-${alert.priority.toLowerCase()}`}>
      <header>
        <div className="action-alert-labels">
          <StatusBadge tone={toneForPriority(alert.priority)}>{alert.priority} priority</StatusBadge>
          <span>{alert.source}</span>
        </div>
        {timing ? <strong className="action-alert-timing">{timing}</strong> : null}
      </header>
      <h3>{alert.title}</h3>
      <p>{alert.message}</p>
      <div className="action-alert-actions">
        {alert.actionHref && alert.actionLabel ? (
          <Link className="primary-link-button" href={alert.actionHref}>{alert.actionLabel}</Link>
        ) : null}
        {alert.status === "ACTIVE" && alert.actionable ? (
          <details className="alert-snooze-menu">
            <summary>Remind me later</summary>
            <div>
              {snoozeOptions.map(({ option, label }) => (
                <button type="button" key={option} onClick={() => snoozeAlert(alert.id, option)}>{label}</button>
              ))}
            </div>
          </details>
        ) : null}
        {alert.status === "ACTIVE" && alert.dismissible ? (
          <button className="alert-dismiss-button" type="button" onClick={() => dismissAlert(alert)}>Dismiss</button>
        ) : null}
      </div>
    </article>
  );
}

function AlertSection({ title, description, alerts }: { title: string; description: string; alerts: readonly AlertItem[] }) {
  return (
    <section className="action-center-section" aria-labelledby={`alerts-${title.toLowerCase().replaceAll(" ", "-")}`}>
      <div className="action-center-section-heading">
        <div><h2 id={`alerts-${title.toLowerCase().replaceAll(" ", "-")}`}>{title}</h2><p>{description}</p></div>
        <span>{alerts.length}</span>
      </div>
      {alerts.length ? <div className="action-alert-list">{alerts.map((alert) => <AlertCard alert={alert} key={alert.id} />)}</div> : <p className="action-center-empty">Nothing to show in this section right now.</p>}
    </section>
  );
}

export function ActionCenterView() {
  const { state } = useAdmissionSimulation();
  const { preferences } = usePreferenceShortlist();
  const alerts = deriveAlerts(state, preferences, demoCandidate);
  const summary = getAlertSummary(alerts);
  const needsAction = alerts.filter((alert) => alert.status === "ACTIVE" && alert.section === "NEEDS_ACTION");
  const comingUp = alerts.filter((alert) => alert.status === "ACTIVE" && alert.section === "COMING_UP");
  const completed = alerts.filter((alert) => alert.status === "COMPLETED" && alert.section === "COMPLETED");

  return (
    <>
      <PageHeader
        eyebrow="Personalized action timeline"
        title="Action Center"
        description="Deadlines, offers and next steps from your current admission journey."
        action={<StatusBadge tone={summary.actionableCount ? "warning" : "success"}>{summary.actionableCount} active action{summary.actionableCount === 1 ? "" : "s"}</StatusBadge>}
      />
      <aside className="action-center-note" aria-label="Reminder delivery information">
        <strong>In-app reminders</strong>
        <span>Reminders appear inside AdmissionSetu while using the prototype. SMS, email, WhatsApp and background push delivery are not connected.</span>
      </aside>
      <div className="action-center-sections" aria-live="polite">
        <AlertSection title="Needs action" description="Time-sensitive decisions and unresolved next steps." alerts={needsAction} />
        <AlertSection title="Coming up" description="Verified demo-cycle dates that are approaching." alerts={comingUp} />
        <AlertSection title="Completed" description="Recent admission and document actions already recorded." alerts={completed} />
      </div>
    </>
  );
}
