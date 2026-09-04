import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildDataset } from "./pipeline.mts";

const outputRoot = resolve(import.meta.dirname, "../../src/data/official/generated");
const header = "// DO NOT MANUALLY EDIT — generated from official source material by npm run data:generate.\n";
const dataset = await buildDataset();

await mkdir(outputRoot, { recursive: true });

async function emit(file: string, typeName: string, exportName: string, value: unknown) {
  const content = `${header}import type { ${typeName} } from "@/types";\n\nexport const ${exportName} = ${JSON.stringify(value, null, 2)} as const satisfies readonly ${typeName}[];\n`;
  await writeFile(resolve(outputRoot, file), content, "utf8");
}

await emit("institutes.generated.ts", "OfficialInstitute", "officialInstitutes", dataset.institutes);
await emit("programmes.generated.ts", "OfficialProgram", "officialPrograms", dataset.programs);
const cutoffSources = [...new Map(dataset.cutoffs.map((item) => [item.round, item.source])).entries()];
const sourceNames = new Map(cutoffSources.map(([round], index) => [round, `cutoffSource${index + 1}`]));
const cutoffSourceDeclarations = cutoffSources.map(([round, source], index) =>
  `const cutoffSource${index + 1} = ${JSON.stringify(source, null, 2)} as const; // ${round}`
).join("\n\n");
const serializedCutoffs = dataset.cutoffs.map((item) => {
  const record = {
    programChoiceCode: item.programChoiceCode,
    academicYear: item.academicYear,
    round: item.round,
    seatType: item.seatType,
    meritNumber: item.meritNumber,
    percentile: item.percentile,
    stage: item.stage,
    candidature: item.candidature,
    admissionType: item.admissionType,
  };
  const serialized = JSON.stringify(record, null, 2).replace(/\n/g, "\n  ");
  return `  ${serialized.replace(/\n\s*}$/, "")},\n    \"source\": ${sourceNames.get(item.round)}\n  }`;
}).join(",\n");
await writeFile(
  resolve(outputRoot, "cutoffs.generated.ts"),
  `${header}import type { OfficialCutoffObservation } from "@/types";\n\n${cutoffSourceDeclarations}\n\nexport const officialCutoffs = [\n${serializedCutoffs}\n] as const satisfies readonly OfficialCutoffObservation[];\n`,
  "utf8",
);
await emit("vacancies.generated.ts", "OfficialHistoricalVacancyObservation", "officialHistoricalVacancies", dataset.historicalVacancies);
await writeFile(
  resolve(outputRoot, "metadata.generated.ts"),
  `${header}import type { OfficialDatasetMetadata } from "@/types";\n\nexport const officialDatasetMetadata = ${JSON.stringify(dataset.metadata, null, 2)} as const satisfies OfficialDatasetMetadata;\n`,
  "utf8",
);

console.log(`Institutes: ${dataset.institutes.length}`);
console.log(`Programmes: ${dataset.programs.length}`);
console.log(`Cutoffs: ${dataset.cutoffs.length}`);
console.log(`Vacancy snapshots: ${dataset.historicalVacancies.length}`);
console.log(`Warnings: ${dataset.report.warnings.length}`);
console.log(`Skipped: ${dataset.report.skipped.length}`);
dataset.report.warnings.forEach((warning) => console.warn(`Warning: ${warning}`));
dataset.report.skipped.slice(0, 20).forEach((skipped) => console.warn(`Skipped: ${skipped}`));
if (dataset.report.skipped.length > 20) console.warn(`Skipped: ${dataset.report.skipped.length - 20} additional rows (see parser report during source refresh).`);
