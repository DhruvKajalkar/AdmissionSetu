import Link from "next/link";
import { PageHeader } from "./page-header";
import { SectionCard } from "./section-card";
import { StatusBadge } from "./status-badge";

interface PlaceholderPageProps {
  eyebrow: string;
  title: string;
  description: string;
  futureCapability: string;
  context: string;
}

export function PlaceholderPage({ eyebrow, title, description, futureCapability, context }: PlaceholderPageProps) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <SectionCard>
        <div className="placeholder-content">
          <StatusBadge tone="info">Phase 0 shell</StatusBadge>
          <h2>{futureCapability}</h2>
          <p>{context}</p>
          <Link className="text-link" href="/dashboard">← Return to overview</Link>
        </div>
      </SectionCard>
    </>
  );
}
