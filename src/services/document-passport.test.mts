import { strict as assert } from "node:assert";
import test from "node:test";
import {
  createInitialAdmissionSimulationState,
} from "../data/admission-simulation.ts";
import {
  DIGILOCKER_DEMO_SCOPES,
  documentDemoTimestamps,
} from "../data/document-passport.ts";
import { resetAdmissionSimulation, sanitizeAdmissionSimulationState } from "./admission-state.ts";
import {
  connectDocumentProvider,
  getAccessibleDocumentTypes,
  getDocumentActivity,
  getWorkflowReadiness,
  isDocumentPassportStateValid,
  revokeDocumentConsent,
  shareDocumentsForPurpose,
} from "./document-passport.ts";

function requireSuccess(result: ReturnType<typeof connectDocumentProvider>) {
  assert.equal(result.ok, true);
  return result.state;
}

function connectedState() {
  return requireSuccess(connectDocumentProvider(
    createInitialAdmissionSimulationState(),
    DIGILOCKER_DEMO_SCOPES,
    documentDemoTimestamps.connectProvider,
  ));
}

const aissmsShare = {
  workflowId: "INSTITUTE_REPORTING" as const,
  recipientInstituteCode: "06278",
  recipientInstituteName: "AISSMS COE",
  recipientProgramId: "0627824510",
  recipientProgramName: "Computer Engineering",
  purpose: "confirmed admission reporting",
};

test("initial document passport matches the deterministic seed", () => {
  const state = createInitialAdmissionSimulationState();
  assert.equal(state.version, 4);
  assert.equal(state.documentPassport.providerConnection.status, "NOT_CONNECTED");
  assert.equal(state.documentPassport.records.length, 6);
  assert.equal(state.documentPassport.records.filter((record) => record.verificationStatus === "VERIFIED").length, 5);
  assert.equal(state.documentPassport.records.find((record) => record.documentType === "INCOME_CERTIFICATE")?.verificationStatus, "MISSING");
});

test("connecting the provider grants access only to documents covered by selected scopes", () => {
  const initial = createInitialAdmissionSimulationState();
  const originalRecords = structuredClone(initial.documentPassport.records);
  const connected = requireSuccess(connectDocumentProvider(
    initial,
    ["SSC_MARKSHEET", "DOMICILE_CERTIFICATE"],
    documentDemoTimestamps.connectProvider,
  ));
  assert.deepEqual(getAccessibleDocumentTypes(connected), ["SSC_MARKSHEET", "DOMICILE_CERTIFICATE"]);
  assert.deepEqual(connected.documentPassport.records, originalRecords);
  assert.deepEqual(initial.documentPassport.providerConnection.grantedScopes, []);
});

test("consent must be granted before documents can be shared", () => {
  const result = shareDocumentsForPurpose(
    createInitialAdmissionSimulationState(),
    aissmsShare,
    documentDemoTimestamps.shareForAdmission,
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "DOCUMENT_PROVIDER_NOT_CONNECTED");
});

test("only consented document types are accessible", () => {
  const state = requireSuccess(connectDocumentProvider(
    createInitialAdmissionSimulationState(),
    ["ENTRANCE_EXAM_RECORDS"],
    documentDemoTimestamps.connectProvider,
  ));
  assert.deepEqual(getAccessibleDocumentTypes(state), ["MHT_CET_SCORECARD", "JEE_MAIN_SCORECARD"]);
});

test("revoking provider access removes active access without deleting records", () => {
  const connected = connectedState();
  const recordIds = connected.documentPassport.records.map((record) => record.id);
  const revoked = requireSuccess(revokeDocumentConsent(connected, documentDemoTimestamps.revokeProvider));
  assert.deepEqual(getAccessibleDocumentTypes(revoked), []);
  assert.deepEqual(revoked.documentPassport.records.map((record) => record.id), recordIds);
  assert.equal(revoked.documentPassport.providerConnection.status, "REVOKED");
});

test("workflow readiness is derived from document records", () => {
  const state = createInitialAdmissionSimulationState();
  assert.deepEqual(getWorkflowReadiness(state, "DOCUMENT_PASSPORT"), {
    workflowId: "DOCUMENT_PASSPORT",
    readyCount: 5,
    requiredCount: 6,
    ready: false,
    missingDocumentTypes: ["INCOME_CERTIFICATE"],
    attentionDocumentTypes: [],
  });
  assert.equal(getWorkflowReadiness(state, "CAP").ready, true);
  assert.equal(getWorkflowReadiness(state, "INSTITUTE_REPORTING").readyCount, 4);
});

test("a missing required document makes its workflow incomplete", () => {
  const state = createInitialAdmissionSimulationState();
  const readiness = getWorkflowReadiness(state, "DOCUMENT_PASSPORT");
  assert.equal(readiness.ready, false);
  assert.deepEqual(readiness.missingDocumentTypes, ["INCOME_CERTIFICATE"]);
});

test("verified required documents produce a ready workflow", () => {
  const state = createInitialAdmissionSimulationState();
  state.documentPassport.records = state.documentPassport.records.map((record) => record.documentType === "INCOME_CERTIFICATE"
    ? { ...record, verificationStatus: "VERIFIED" as const, source: "MANUAL" as const }
    : record);
  assert.equal(getWorkflowReadiness(state, "DOCUMENT_PASSPORT").ready, true);
});

test("the same records can be reused across workflows without duplication", () => {
  const connected = connectedState();
  const first = requireSuccess(shareDocumentsForPurpose(connected, aissmsShare, documentDemoTimestamps.shareForAdmission));
  const second = requireSuccess(shareDocumentsForPurpose(first, {
    ...aissmsShare,
    workflowId: "SPOT_ROUND",
    recipientInstituteCode: "06273",
    recipientInstituteName: "VIT Pune",
    recipientProgramId: "0627324510",
    purpose: "spot-round admission reporting",
  }, "2026-08-27T10:44:00+05:30"));
  assert.equal(second.documentPassport.records.length, connected.documentPassport.records.length);
  assert.equal(second.documentPassport.shares.length, 2);
  assert.deepEqual(second.documentPassport.shares[0].documentTypes, second.documentPassport.shares[1].documentTypes);
});

test("institute-specific sharing records recipient, purpose and minimum document set", () => {
  const state = requireSuccess(shareDocumentsForPurpose(connectedState(), aissmsShare, documentDemoTimestamps.shareForAdmission));
  const share = state.documentPassport.shares[0];
  assert.equal(share.recipientInstituteCode, "06278");
  assert.equal(share.recipientProgramId, "0627824510");
  assert.equal(share.purpose, "confirmed admission reporting");
  assert.deepEqual(share.documentTypes, ["SSC_MARKSHEET", "HSC_MARKSHEET", "MHT_CET_SCORECARD", "DOMICILE_CERTIFICATE"]);
});

test("revoked documents cannot be newly shared without renewed consent", () => {
  const revoked = requireSuccess(revokeDocumentConsent(connectedState(), documentDemoTimestamps.revokeProvider));
  const result = shareDocumentsForPurpose(revoked, aissmsShare, documentDemoTimestamps.shareForAdmission);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "DOCUMENT_PROVIDER_NOT_CONNECTED");
});

test("document activity remains append-only throughout a run", () => {
  const connected = connectedState();
  const shared = requireSuccess(shareDocumentsForPurpose(connected, aissmsShare, documentDemoTimestamps.shareForAdmission));
  const revoked = requireSuccess(revokeDocumentConsent(shared, documentDemoTimestamps.revokeProvider));
  assert.deepEqual(getDocumentActivity(revoked).map((activity) => activity.type), [
    "PROVIDER_ACCESS_REVOKED",
    "DOCUMENTS_SHARED",
    "PROVIDER_CONNECTED",
  ]);
  assert.deepEqual(connected.documentPassport.activity, shared.documentPassport.activity.slice(0, 1));
});

test("reset restores the exact deterministic document and clearing state", () => {
  const shared = requireSuccess(shareDocumentsForPurpose(connectedState(), aissmsShare, documentDemoTimestamps.shareForAdmission));
  const reset = resetAdmissionSimulation(createInitialAdmissionSimulationState());
  assert.notDeepEqual(shared.documentPassport, reset.documentPassport);
  assert.deepEqual(reset, createInitialAdmissionSimulationState());
  assert.equal(isDocumentPassportStateValid(reset), true);
});

test("malformed persisted document state fails safely", () => {
  const initial = createInitialAdmissionSimulationState();
  const malformed = structuredClone(initial);
  malformed.documentPassport.records.push({ ...malformed.documentPassport.records[0] });
  assert.deepEqual(sanitizeAdmissionSimulationState(malformed, initial), initial);
});
