import Link from "next/link";
import type { AdmissionAlert as AdmissionAlertData } from "@/types";

interface AdmissionAlertProps {
  alert: AdmissionAlertData;
}

export function AdmissionAlert({ alert }: AdmissionAlertProps) {
  const tone = alert.tone.toLowerCase();

  return (
    <article className={`admission-alert ${tone}`}>
      <span className="alert-marker" aria-hidden="true">{alert.tone === "WARNING" ? "!" : "i"}</span>
      <div className="alert-copy">
        <p>{alert.label}</p>
        <h3>{alert.title}</h3>
        <span>{alert.message}</span>
      </div>
      {alert.actionHref && alert.actionLabel ? (
        <Link className="text-link alert-action" href={alert.actionHref}>
          {alert.actionLabel} →
        </Link>
      ) : null}
    </article>
  );
}
