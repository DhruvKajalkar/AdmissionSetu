import type { ReactNode } from "react";

interface DeadlineBannerProps {
  label: string;
  title: string;
  detail: string;
  action?: ReactNode;
}

export function DeadlineBanner({ label, title, detail, action }: DeadlineBannerProps) {
  return (
    <section className="deadline-banner" aria-labelledby="deadline-title">
      <span className="deadline-marker" aria-hidden="true">!</span>
      <div>
        <p>{label}</p>
        <h2 id="deadline-title">{title}</h2>
        <span>{detail}</span>
      </div>
      {action ? <div className="deadline-action">{action}</div> : null}
    </section>
  );
}
