import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { cetSources, selectedInstituteCodes } from "./source-manifest.mts";

const root = resolve(import.meta.dirname, "../..");
const sourceRoot = resolve(root, "scripts/cet/source-data");

async function fetchText(url: string) {
  const response = await fetch(url, { headers: { "user-agent": "AdmissionSetu offline CET data importer" } });
  if (!response.ok) throw new Error(`Source request failed (${response.status}): ${url}`);
  return response.text();
}

async function writeSource(path: string, content: string | Uint8Array) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

function embeddedPdf(html: string, url: string) {
  const match = html.match(/LoadPublicDocument\('([^']+)'\)/);
  if (!match) throw new Error(`Official publication page did not contain the expected PDF payload: ${url}`);
  return Buffer.from(match[1], "base64");
}

const instituteListHtml = await fetchText(cetSources.instituteList.url);
for (const code of selectedInstituteCodes) {
  if (!instituteListHtml.includes(`>${code}<`)) throw new Error(`Official institute list did not contain selected code ${code}.`);
}
await writeSource(resolve(sourceRoot, "institute-list.html"), instituteListHtml);
console.log(`Fetched institute list and verified ${selectedInstituteCodes.length} selected codes`);

for (const code of selectedInstituteCodes) {
  const url = cetSources.instituteSummaries.urlTemplate.replace("{code}", code);
  const html = await fetchText(url);
  if (!html.includes(`>${code}<`)) throw new Error(`Institute summary ${code} did not contain its expected code.`);
  await writeSource(resolve(sourceRoot, `institute-summaries/${code}.html`), html);
  console.log(`Fetched institute summary ${code}`);
}

for (const [fileName, source] of [["cap2", cetSources.capTwoCutoff], ["cap3", cetSources.capThreeCutoff]] as const) {
  const wrapper = await fetchText(source.url);
  const pdf = embeddedPdf(wrapper, source.url);
  if (pdf.subarray(0, 4).toString() !== "%PDF") throw new Error(`${fileName} payload is not a PDF.`);
  await writeSource(resolve(sourceRoot, `cutoffs/${fileName}.pdf`), pdf);
  console.log(`Fetched ${fileName} cutoff PDF (${pdf.length.toLocaleString("en-IN")} bytes)`);
}
