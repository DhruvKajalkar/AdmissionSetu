import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, SectionCard, StatusBadge } from "@/components";
import { colleges, programs, spotRounds } from "@/data";
import { formatDateTime } from "@/lib/format";

export function generateStaticParams() {
  return spotRounds.map((round) => ({ id: round.id }));
}

export async function generateMetadata({ params }: PageProps<"/spot-rounds/[id]">): Promise<Metadata> {
  const { id } = await params;
  const round = spotRounds.find((item) => item.id === id);

  if (!round) return { title: "Spot round not found" };

  return {
    title: round.title,
    description: `Synthetic AdmissionSetu spot-round shell with ${round.vacancyCount} demo vacancies.`,
    openGraph: { images: [] },
    twitter: { images: [] },
  };
}

export default async function SpotRoundDetailPage({ params }: PageProps<"/spot-rounds/[id]">) {
  const { id } = await params;
  const round = spotRounds.find((item) => item.id === id);
  if (!round) notFound();

  const college = colleges.find((item) => item.id === round.collegeId);
  const roundProgramIds: readonly string[] = round.programIds;
  const roundPrograms = programs.filter((program) => roundProgramIds.includes(program.id));

  return (
    <>
      <PageHeader
        eyebrow="Spot-round detail"
        title={round.title}
        description="A static preview of the information students will receive before deciding whether to join."
        action={<StatusBadge tone="info">Phase 0 preview</StatusBadge>}
      />
      <SectionCard title="Round information" description="All dates, vacancy counts, and participant activity are synthetic.">
        <div className="round-detail-grid">
          <div className="detail-item"><span>Institute</span><strong>{college?.name}</strong></div>
          <div className="detail-item"><span>Registration closes</span><strong>{formatDateTime(round.registrationDeadline)}</strong></div>
          <div className="detail-item"><span>Round starts</span><strong>{formatDateTime(round.startsAt)}</strong></div>
          <div className="detail-item"><span>Programmes</span><strong>{roundPrograms.map((program) => program.name).join(", ")}</strong></div>
          <div className="detail-item"><span>Vacancies</span><strong>{round.vacancyCount} demo seats</strong></div>
          <div className="detail-item"><span>Current state</span><strong>{round.status.replaceAll("_", " ")}</strong></div>
        </div>
      </SectionCard>
      <p style={{ marginTop: "22px" }}><Link className="text-link" href="/spot-rounds">← Back to all spot rounds</Link></p>
    </>
  );
}
