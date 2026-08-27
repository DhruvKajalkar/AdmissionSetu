import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SpotRoundLive } from "@/components";
import { officialInstitutes, officialPrograms, spotRounds } from "@/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return spotRounds.map((round) => ({ id: round.id }));
}

export async function generateMetadata({ params }: PageProps<"/spot-rounds/[id]">): Promise<Metadata> {
  const { id } = await params;
  const round = spotRounds.find((item) => item.id === id);
  if (!round) return { title: "Spot round not found" };
  const institute = officialInstitutes.find((item) => item.code === round.instituteCode);
  const program = officialPrograms.find((item) => item.choiceCode === round.programId);
  return {
    title: `${institute?.commonName ?? "Spot Round"} — ${program?.name ?? "Live round"}`,
    description: "Synthetic AdmissionSetu live online spot-round simulation. No official admission submission occurs.",
    openGraph: { images: [] },
    twitter: { images: [] },
  };
}

export default async function SpotRoundDetailPage({ params }: PageProps<"/spot-rounds/[id]">) {
  const { id } = await params;
  if (!spotRounds.some((round) => round.id === id)) notFound();
  return <SpotRoundLive roundId={id} institutes={officialInstitutes} programs={officialPrograms} />;
}
