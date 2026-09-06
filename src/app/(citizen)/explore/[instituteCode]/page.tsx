import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollegeIntelligenceView } from "@/components";
import { officialInstitutes } from "@/data";
import { getCoveredInstituteCodes } from "@/services";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCoveredInstituteCodes().map((instituteCode) => ({ instituteCode }));
}

export async function generateMetadata({ params }: { params: Promise<{ instituteCode: string }> }): Promise<Metadata> {
  const { instituteCode } = await params;
  const institute = officialInstitutes.find((item) => item.code === instituteCode);
  return institute
    ? { title: `${institute.commonName} College Intelligence`, description: `Sourced programme, cutoff, fee, placement, accreditation and facility context for ${institute.name}.` }
    : { title: "College Intelligence" };
}

export default async function InstituteIntelligencePage({ params }: { params: Promise<{ instituteCode: string }> }) {
  const { instituteCode } = await params;
  if (!getCoveredInstituteCodes().includes(instituteCode)) notFound();
  return <CollegeIntelligenceView instituteCode={instituteCode} />;
}
