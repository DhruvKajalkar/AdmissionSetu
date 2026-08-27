import type { ReactNode } from "react";

interface DeadlineBannerProps {
  label: string;
  title: string;
  deadline: string;
  relativeLabel: string;
  detail: string;
  action?: ReactNode;
}

export function DeadlineBanner({ label, title, deadline, relativeLabel, detail, action }: DeadlineBannerProps) {
  return (
    <section className="deadline-banner" aria-labelledby="deadline-title">
      <span className="deadline-marker" aria-hidden="true">!</span>
      <div className="deadline-copy">
        <p>{label}</p>
        <h2 id="deadline-title">{title}</h2>
        <span>{detail}</span>
      </div>
      <div className="deadline-time" aria-label={`${deadline}, ${relativeLabel}`}>
        <strong>{deadline}</strong>
        <span>{relativeLabel}</span>
      </div>
      {action ? <div className="deadline-action">{action}</div> : null}
    </section>
  );
}
