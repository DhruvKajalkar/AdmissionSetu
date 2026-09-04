import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { instituteCuration } from "./curation.mts";
import { cetSources, DATASET_GENERATED_ON, selectedInstituteCodes } from "./source-manifest.mts";

const root = resolve(import.meta.dirname, "../..");
const sourceRoot = resolve(root, "scripts/cet/source-data");

export interface PipelineReport {
  warnings: string[];
  skipped: string[];
}

export interface SourceReferenceRecord {
  kind: "OFFICIAL_CET_CELL";
  label: string;
  academicYear: string;
  url: string;
  accessedOn: string;
  sourceType: "OFFICIAL_WEB_PAGE" | "OFFICIAL_PDF";
}

export interface InstituteRecord {
  code: string;
  name: string;
  commonName: string;
  searchAliases: readonly string[];
  address: string;
  locality: string;
  city: string;
  district: string;
  region: string;
  university: string;
  status: string;
  autonomyStatus: string;
  minorityStatus: string;
  gender: string;
  source: SourceReferenceRecord;
}

export interface ProgramRecord {
  choiceCode: string;
  instituteCode: string;
  name: string;
  branchFamily: string;
  intake: number;
  shift: string;
  gender: string;
  source: SourceReferenceRecord;
}

export interface CutoffRecord {
  programChoiceCode: string;
  academicYear: string;
  round: string;
  seatType: string;
  meritNumber: number;
  percentile: number;
  stage: string;
  candidature: string;
  admissionType: string;
  source: SourceReferenceRecord;
}

export interface HistoricalVacancyRecord {
  programChoiceCode: string;
  academicYear: string;
  round: string;
  publishedVacancyCount: number;
  snapshotLabel: string;
  source: SourceReferenceRecord;
}

export interface PipelineDataset {
  institutes: readonly InstituteRecord[];
  programs: readonly ProgramRecord[];
  cutoffs: readonly CutoffRecord[];
  historicalVacancies: readonly HistoricalVacancyRecord[];
  metadata: {
    generatedOn: string;
    academicYears: readonly string[];
    sourceSnapshot: string;
    counts: { institutes: number; programs: number; cutoffs: number; historicalVacancies: number };
  };
  report: PipelineReport;
}

function decodeHtml(value: string) {
  const entities: Record<string, string> = {
    "&amp;": "&", "&quot;": "\"", "&#39;": "'", "&#x27;": "'", "&nbsp;": " ", "&lt;": "<", "&gt;": ">",
  };
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&(amp|quot|#39|#x27|nbsp|lt|gt);/gi, (match) => entities[match.toLowerCase()] ?? match)
    .replace(/\s+/g, " ")
    .trim();
}

function spanValue(html: string, idSuffix: string) {
  const match = html.match(new RegExp(`id="[^"]*${idSuffix}"[^>]*>\\s*<b>([\\s\\S]*?)<\\/b>`, "i"));
  return match ? decodeHtml(match[1]) : "";
}

function sourceForInstitute(code: string): SourceReferenceRecord {
  return {
    kind: "OFFICIAL_CET_CELL",
    label: `${cetSources.instituteSummaries.title} · ${code}`,
    academicYear: cetSources.instituteSummaries.academicYear,
    url: cetSources.instituteSummaries.urlTemplate.replace("{code}", code),
    accessedOn: cetSources.instituteSummaries.retrievedOn,
    sourceType: cetSources.instituteSummaries.sourceType,
  };
}

function sourceForCutoff(source: typeof cetSources.capTwoCutoff | typeof cetSources.capThreeCutoff): SourceReferenceRecord {
  return {
    kind: "OFFICIAL_CET_CELL",
    label: source.title,
    academicYear: source.academicYear,
    url: source.url,
    accessedOn: source.retrievedOn,
    sourceType: source.sourceType,
  };
}

export function normalizeBranchFamily(name: string) {
  const value = name.toLowerCase();
  if (/artificial intelligence|data science|machine learning|ai and|ai &|cyber security/.test(value)) return "AI & Data";
  if (/computer|information technology|software/.test(value)) return "Computer & IT";
  if (/electronics|electrical|telecommunication|instrumentation|vlsi/.test(value)) return "Electronics & Electrical";
  if (/mechanical|automobile|robotics|automation|production/.test(value)) return "Mechanical & Automation";
  if (/civil|structural|construction|mining/.test(value)) return "Civil & Core";
  if (/chemical|biotechnology|food|textile|polymer|pharmaceutical|oil/.test(value)) return "Chemical & Biotechnology";
  return "Other";
}

function parseCourseRows(html: string, code: string, report: PipelineReport) {
  const table = html.match(/id="[^"]*gvChoiceCodeList"[\s\S]*?<\/table>/i)?.[0];
  if (!table) throw new Error(`Institute summary ${code} has no course table.`);
  const rows = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const courses: Array<{ choiceCode: string; name: string; university: string; shift: string; gender: string; intake: number }> = [];
  for (const row of rows) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => decodeHtml(match[1]));
    if (!cells.length) continue;
    if (cells.length !== 10) {
      report.skipped.push(`${code}: course row had ${cells.length} cells instead of 10.`);
      continue;
    }
    const intake = Number.parseInt(cells[9], 10);
    if (!/^\d{10}[A-Z]{0,2}$/.test(cells[0]) || !Number.isInteger(intake)) {
      report.skipped.push(`${code}: malformed course row ${JSON.stringify(cells)}.`);
      continue;
    }
    courses.push({ choiceCode: cells[0], name: cells[1], university: cells[2], shift: cells[6], gender: cells[8], intake });
  }
  if (!courses.length) throw new Error(`Institute summary ${code} produced no valid programmes.`);
  return courses;
}

async function importInstitutesAndPrograms(report: PipelineReport) {
  const files = (await readdir(resolve(sourceRoot, "institute-summaries"))).filter((file) => file.endsWith(".html")).sort();
  const expected = new Set(selectedInstituteCodes);
  const institutes: InstituteRecord[] = [];
  const programs: ProgramRecord[] = [];

  for (const file of files) {
    const html = await readFile(resolve(sourceRoot, "institute-summaries", file), "utf8");
    const code = spanValue(html, "lblInstituteCode");
    if (!expected.has(code as (typeof selectedInstituteCodes)[number])) continue;
    const name = spanValue(html, "lblInstituteName");
    const address = spanValue(html, "lblInstituteAddress");
    const region = spanValue(html, "lblRegion");
    const district = spanValue(html, "lblDistrict");
    const status = spanValue(html, "lblStatus1");
    const autonomyStatus = spanValue(html, "lblStatus2");
    const minorityStatus = spanValue(html, "lblStatus3");
    if (![code, name, address, region, district, status, autonomyStatus, minorityStatus].every(Boolean)) {
      throw new Error(`Institute summary ${file} is missing a required labelled field.`);
    }
    const courses = parseCourseRows(html, code, report);
    const curated = instituteCuration[code] ?? {};
    const genders = new Set(courses.map((course) => course.gender));
    const gender = genders.size === 1 ? courses[0].gender : "Co-Education";
    const source = sourceForInstitute(code);
    institutes.push({
      code,
      name,
      commonName: curated.commonName ?? name,
      searchAliases: [...(curated.searchAliases ?? [])],
      address,
      locality: curated.locality ?? district,
      city: curated.city ?? region,
      district,
      region,
      university: courses[0].university,
      status,
      autonomyStatus,
      minorityStatus,
      gender,
      source,
    });
    for (const course of courses) {
      programs.push({
        choiceCode: course.choiceCode,
        instituteCode: code,
        name: course.name,
        branchFamily: normalizeBranchFamily(course.name),
        intake: course.intake,
        shift: course.shift,
        gender: course.gender,
        source,
      });
    }
  }

  const importedCodes = new Set(institutes.map((institute) => institute.code));
  const missing = selectedInstituteCodes.filter((code) => !importedCodes.has(code));
  if (missing.length) throw new Error(`Missing selected institute summaries: ${missing.join(", ")}`);
  return {
    institutes: institutes.toSorted((a, b) => a.code.localeCompare(b.code)),
    programs: programs.toSorted((a, b) => a.choiceCode.localeCompare(b.choiceCode)),
  };
}

function isCategoryLine(line: string) {
  const tokens = line.split(/\s+/);
  return tokens.length > 0 && tokens.every((token) => /^[A-Z][A-Z0-9-]+$/.test(token)) && !["STATUS", "STAGE"].includes(tokens[0]);
}

function importCutoffText(text: string, source: typeof cetSources.capTwoCutoff | typeof cetSources.capThreeCutoff, report: PipelineReport) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const records: CutoffRecord[] = [];
  let instituteCode = "";
  let programChoiceCode = "";
  let candidature = "Not separately stated";
  let categories: string[] = [];
  let stage = "";
  let categoryIndex = 0;
  let pendingMerit: number | null = null;

  function resetTable() {
    categories = [];
    stage = "";
    categoryIndex = 0;
    pendingMerit = null;
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const instituteMatch = line.match(/^(\d{5})\s+-\s+(.+)$/);
    if (instituteMatch) {
      instituteCode = instituteMatch[1];
      programChoiceCode = "";
      candidature = "Not separately stated";
      resetTable();
      continue;
    }
    const programMatch = line.match(/^(\d{10}[A-Z]{0,2})\s+-\s+(.+)$/);
    if (programMatch) {
      programChoiceCode = programMatch[1];
      candidature = "Not separately stated";
      resetTable();
      continue;
    }
    if (!programChoiceCode || !selectedInstituteCodes.includes(instituteCode as (typeof selectedInstituteCodes)[number])) continue;
    if (/^(State Level|.*Seats.*|.*Candidates.*)$/i.test(line) && !line.startsWith("Legends")) {
      candidature = line.replace(/\s+/g, " ");
      continue;
    }
    if (isCategoryLine(line) && !stage) {
      const tokens = line.split(/\s+/);
      if (tokens.length === 1 && tokens[0] === "S" && categories.length) {
        categories[categories.length - 1] += "S";
      } else {
        categories.push(...tokens);
      }
      continue;
    }
    const stagedMerit = line.match(/^(I|II|III|IV|V|VI|VII|VIII)\s+(\d+)$/);
    if (stagedMerit && categories.length) {
      stage = stagedMerit[1];
      categoryIndex = 0;
      pendingMerit = Number(stagedMerit[2]);
      continue;
    }
    if (/^\d+$/.test(line) && stage && categories.length && pendingMerit === null) {
      pendingMerit = Number(line);
      continue;
    }
    const percentileMatch = line.match(/^\((\d+(?:\.\d+)?)\)$/);
    if (percentileMatch && pendingMerit !== null && stage && categories.length) {
      const seatType = categories[categoryIndex];
      if (!seatType) {
        report.skipped.push(`${source.round} ${programChoiceCode}: more values than categories at source line ${index + 1}.`);
      } else {
        records.push({
          programChoiceCode,
          academicYear: source.academicYear,
          round: source.round,
          seatType,
          meritNumber: pendingMerit,
          percentile: Number(percentileMatch[1]),
          stage,
          candidature,
          admissionType: "Maharashtra and Minority Seats",
          source: sourceForCutoff(source),
        });
      }
      categoryIndex += 1;
      pendingMerit = null;
      continue;
    }
    if (line === "Stage") resetTable();
  }
  if (!records.length) throw new Error(`${source.title} produced no cutoff observations.`);
  return records;
}

export function validateDataset(dataset: Omit<PipelineDataset, "report">) {
  const errors: string[] = [];
  const duplicateValues = <T,>(items: readonly T[], value: (item: T) => string) => {
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    items.forEach((item) => { const key = value(item); if (seen.has(key)) duplicates.add(key); else seen.add(key); });
    return [...duplicates];
  };
  const instituteDuplicates = duplicateValues(dataset.institutes, (item) => item.code);
  if (instituteDuplicates.length) errors.push(`Duplicate institute codes: ${instituteDuplicates.join(", ")}`);
  const choiceDuplicates = duplicateValues(dataset.programs, (item) => item.choiceCode);
  if (choiceDuplicates.length) errors.push(`Duplicate programme choice codes: ${choiceDuplicates.join(", ")}`);
  const instituteCodes = new Set(dataset.institutes.map((item) => item.code));
  const programCodes = new Set(dataset.programs.map((item) => item.choiceCode));
  dataset.institutes.forEach((item) => {
    if (!item.name.trim()) errors.push(`Institute ${item.code} has an empty official name.`);
    if (!item.source.url || !item.source.academicYear || !item.source.label) errors.push(`Institute ${item.code} has incomplete provenance.`);
  });
  dataset.programs.forEach((item) => {
    if (!instituteCodes.has(item.instituteCode)) errors.push(`Programme ${item.choiceCode} references missing institute ${item.instituteCode}.`);
    if (!/^\d{10}[A-Z]{0,2}$/.test(item.choiceCode)) errors.push(`Programme has malformed choice code ${item.choiceCode}.`);
    if (item.intake < 0 || !Number.isInteger(item.intake)) errors.push(`Programme ${item.choiceCode} has invalid intake ${item.intake}.`);
    if (!item.source.url || !item.source.academicYear || !item.source.label) errors.push(`Programme ${item.choiceCode} has incomplete provenance.`);
  });
  dataset.cutoffs.forEach((item) => {
    if (!programCodes.has(item.programChoiceCode)) errors.push(`Cutoff references missing programme ${item.programChoiceCode}.`);
    if (!Number.isFinite(item.percentile) || item.percentile < 0 || item.percentile > 100) errors.push(`Cutoff ${item.programChoiceCode} has invalid percentile ${item.percentile}.`);
    if (!item.academicYear || !item.round || !item.seatType || !item.candidature || !item.admissionType) errors.push(`Cutoff ${item.programChoiceCode} has incomplete context.`);
    if (!item.source.url || !item.source.label) errors.push(`Cutoff ${item.programChoiceCode} has incomplete provenance.`);
  });
  dataset.historicalVacancies.forEach((item) => {
    if (!programCodes.has(item.programChoiceCode)) errors.push(`Historical vacancy references missing programme ${item.programChoiceCode}.`);
    if (!Number.isInteger(item.publishedVacancyCount) || item.publishedVacancyCount < 0) errors.push(`Historical vacancy ${item.programChoiceCode} has an invalid count.`);
    if (!item.source.url || !item.academicYear || !item.round || !item.snapshotLabel) errors.push(`Historical vacancy ${item.programChoiceCode} has incomplete context.`);
  });
  const cutoffConflicts = new Map<string, string>();
  dataset.cutoffs.forEach((item) => {
    const context = [item.academicYear, item.round, item.programChoiceCode, item.candidature, item.seatType, item.stage].join("|");
    const value = `${item.meritNumber}|${item.percentile}`;
    const existing = cutoffConflicts.get(context);
    if (existing && existing !== value) errors.push(`Conflicting cutoff observations for ${context}.`);
    cutoffConflicts.set(context, value);
  });
  if (errors.length) throw new Error(`Official CET dataset validation failed:\n- ${errors.join("\n- ")}`);
}

export async function buildDataset(): Promise<PipelineDataset> {
  const report: PipelineReport = { warnings: [], skipped: [] };
  const { institutes, programs } = await importInstitutesAndPrograms(report);
  const capTwoText = await readFile(resolve(sourceRoot, "cutoffs/cap2-selected.txt"), "utf8");
  const capThreeText = await readFile(resolve(sourceRoot, "cutoffs/cap3-selected.txt"), "utf8");
  const importedCutoffs = [
    ...importCutoffText(capTwoText, cetSources.capTwoCutoff, report),
    ...importCutoffText(capThreeText, cetSources.capThreeCutoff, report),
  ];
  const programCodes = new Set(programs.map((program) => program.choiceCode));
  const cutoffs = importedCutoffs.filter((cutoff) => {
    if (programCodes.has(cutoff.programChoiceCode)) return true;
    report.skipped.push(`${cutoff.round} ${cutoff.programChoiceCode}: choice code is absent from the selected institute summaries.`);
    return false;
  }).toSorted((a, b) =>
    a.programChoiceCode.localeCompare(b.programChoiceCode)
    || a.round.localeCompare(b.round)
    || a.candidature.localeCompare(b.candidature)
    || a.seatType.localeCompare(b.seatType)
    || a.stage.localeCompare(b.stage)
  );
  const historicalVacancies: HistoricalVacancyRecord[] = [];
  const metadata = {
    generatedOn: DATASET_GENERATED_ON,
    academicYears: [...new Set([cetSources.instituteSummaries.academicYear, ...cutoffs.map((item) => item.academicYear)])].sort(),
    sourceSnapshot: "Static reference snapshot from official Maharashtra CET Cell sources.",
    counts: { institutes: institutes.length, programs: programs.length, cutoffs: cutoffs.length, historicalVacancies: historicalVacancies.length },
  };
  const dataset = { institutes, programs, cutoffs, historicalVacancies, metadata };
  validateDataset(dataset);
  return { ...dataset, report };
}
