"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { demoCandidate } from "@/data";
import { buildAssistantContextSnapshot } from "@/services/assistant-context";
import { buildFormGuideContextSnapshot } from "@/services/form-guide";
import { FORM_GUIDE_IMAGE_TYPES, FORM_GUIDE_LIMITS } from "@/services/form-guide-validation";
import type { FormGuideErrorResponse, FormGuideResponse } from "@/types";
import { useAdmissionSimulation } from "./admission-simulation-provider";
import { usePreferenceShortlist } from "./preference-shortlist";

type FormGuideStage = "INTRO" | "READY" | "ANALYZING" | "GUIDANCE" | "ERROR";

const statusLabels: Record<FormGuideResponse["fields"][number]["status"], string> = {
  KNOWN_FROM_PROFILE: "Known from profile",
  KNOWN_FROM_DOCUMENTS: "Known from documents",
  KNOWN_FROM_ADMISSION: "Known from admission",
  UNKNOWN: "Not available",
  USER_MUST_ENTER: "You must enter this",
  SENSITIVE_DO_NOT_ASSIST: "Sensitive — enter yourself",
  NEEDS_VERIFICATION: "Needs your verification",
};

function readableSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function FormGuideView() {
  const { state } = useAdmissionSimulation();
  const { preferences } = usePreferenceShortlist();
  const [stage, setStage] = useState<FormGuideStage>("INTRO");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [question, setQuestion] = useState("Help me fill this form.");
  const [guidance, setGuidance] = useState<FormGuideResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function clearScreenshot() {
    setImageFile(null);
    setPreview(null);
    setGuidance(null);
    setError(null);
    setStage("READY");
    if (inputRef.current) inputRef.current.value = "";
  }

  function selectScreenshot(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setGuidance(null);
    setError(null);
    if (!file) return clearScreenshot();
    if (!FORM_GUIDE_IMAGE_TYPES.includes(file.type as typeof FORM_GUIDE_IMAGE_TYPES[number])) {
      setError("Use a PNG, JPEG or WebP screenshot.");
      setStage("ERROR");
      event.target.value = "";
      return;
    }
    if (file.size > FORM_GUIDE_LIMITS.imageBytes) {
      setError("Screenshot must be 4 MB or smaller.");
      setStage("ERROR");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(typeof reader.result === "string" ? reader.result : null);
      setImageFile(file);
      setStage("READY");
    };
    reader.onerror = () => {
      setError("The screenshot could not be previewed. Choose another image.");
      setStage("ERROR");
    };
    reader.readAsDataURL(file);
  }

  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!imageFile || stage === "ANALYZING") return;
    setError(null);
    setGuidance(null);
    setStage("ANALYZING");
    const assistantContext = buildAssistantContextSnapshot(state, preferences, demoCandidate);
    const formData = new FormData();
    formData.set("image", imageFile);
    formData.set("question", question);
    formData.set("context", JSON.stringify(buildFormGuideContextSnapshot(assistantContext)));
    try {
      const response = await fetch("/api/form-guide", { method: "POST", body: formData });
      const body = await response.json() as FormGuideResponse | FormGuideErrorResponse;
      if (!response.ok || !("fields" in body)) {
        throw new Error("error" in body ? body.error : "Form analysis is temporarily unavailable.");
      }
      setGuidance(body);
      setStage("GUIDANCE");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Form analysis is temporarily unavailable.");
      setStage("ERROR");
    }
  }

  if (stage === "INTRO") {
    return (
      <section className="form-guide-intro" aria-labelledby="form-guide-intro-title">
        <p>Supervised screenshot assistance</p>
        <h2 id="form-guide-intro-title">Guided form assistance</h2>
        <span>Share only the form you want help with. AdmissionSetu will explain what each visible field means and suggest information from your existing profile where appropriate.</span>
        <div className="form-guide-privacy-warning">
          <strong>Before you share</strong>
          <p>Only share the admission form you want help with. Avoid unrelated tabs, chats, passwords, OTPs, banking details or other sensitive information.</p>
        </div>
        <ul>
          <li>AdmissionSetu does not submit forms or enter values.</li>
          <li>AdmissionSetu does not enter OTPs or provide authentication secrets.</li>
          <li>AdmissionSetu does not make final classifications or selections.</li>
          <li>You must verify every suggestion before manually entering it.</li>
          <li>Only the screenshot you intentionally select is analyzed.</li>
        </ul>
        <div className="form-guide-intro-actions">
          <button className="primary-link-button" type="button" onClick={() => setStage("READY")}>Continue</button>
          <Link href="/demo-forms/cet-reporting" target="_blank" rel="noreferrer">Open prototype reporting form ↗</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="form-guide-workspace" aria-labelledby="form-guide-workspace-title">
      <header>
        <div>
          <p>Guided form assistance</p>
          <h2 id="form-guide-workspace-title">Share one form screenshot</h2>
          <span>The image stays in this page session and is sent only to the server for the requested analysis. It is not stored in localStorage.</span>
        </div>
        <Link href="/demo-forms/cet-reporting" target="_blank" rel="noreferrer">Open demo form ↗</Link>
      </header>

      <div className="form-guide-privacy-warning compact">
        <strong>Protect sensitive information</strong>
        <p>Crop the image to the form. Do not include passwords, OTP values, Aadhaar numbers, banking details or unrelated content.</p>
      </div>

      <form className="form-guide-upload" onSubmit={analyze}>
        <label htmlFor="form-guide-image">Form screenshot</label>
        <input
          ref={inputRef}
          id="form-guide-image"
          name="image"
          type="file"
          accept={FORM_GUIDE_IMAGE_TYPES.join(",")}
          onChange={selectScreenshot}
          disabled={stage === "ANALYZING"}
        />
        <small>PNG, JPEG or WebP · one image · maximum 4 MB</small>

        {preview && imageFile ? (
          <div className="form-guide-preview">
            <Image src={preview} alt="Preview of the selected form screenshot" width={1200} height={800} unoptimized />
            <div>
              <span>{imageFile.name} · {readableSize(imageFile.size)}</span>
              <button type="button" onClick={clearScreenshot} disabled={stage === "ANALYZING"}>Remove screenshot</button>
            </div>
          </div>
        ) : null}

        <label htmlFor="form-guide-question">What do you want help with?</label>
        <textarea
          id="form-guide-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={FORM_GUIDE_LIMITS.questionCharacters}
          rows={2}
          disabled={stage === "ANALYZING"}
        />
        <small>{question.length}/{FORM_GUIDE_LIMITS.questionCharacters} · Do not type personal identifiers or secrets.</small>
        <button className="primary-link-button" type="submit" disabled={!imageFile || stage === "ANALYZING"}>
          {stage === "ANALYZING" ? "Analyzing visible fields…" : "Analyze form screenshot"}
        </button>
      </form>

      {error ? (
        <div className="form-guide-error" role="alert">
          <strong>{error}</strong>
          <span>No visual guidance has been generated. Your admission state and selected form have not changed.</span>
        </div>
      ) : null}

      {guidance ? (
        <section className="form-guide-results" aria-live="polite" aria-labelledby="form-guide-results-title">
          <header>
            <div>
              <p>Structured guidance</p>
              <h2 id="form-guide-results-title">{guidance.summary}</h2>
            </div>
            <span>{guidance.notice}</span>
          </header>
          {guidance.fields.length ? (
            <ol>
              {guidance.fields.map((field, index) => (
                <li key={`${field.detectedPurpose}:${field.fieldLabel}:${index}`}>
                  <div className="form-guide-field-heading">
                    <div>
                      <span>Field {index + 1}</span>
                      <h3>{field.fieldLabel}</h3>
                    </div>
                    <strong>{statusLabels[field.status]}</strong>
                  </div>
                  <dl>
                    <div><dt>What it means</dt><dd>{field.explanation}</dd></div>
                    {field.suggestedValue ? <div><dt>AdmissionSetu value</dt><dd>{field.suggestedValue}</dd></div> : null}
                    {field.source ? <div><dt>Source</dt><dd>{field.source}</dd></div> : null}
                    <div><dt>Suggestion</dt><dd>{field.suggestion}</dd></div>
                    <div><dt>Detection confidence</dt><dd>{field.confidence.toLowerCase()}</dd></div>
                  </dl>
                  {field.warning ? <p className="form-guide-field-warning">{field.warning}</p> : null}
                </li>
              ))}
            </ol>
          ) : <p className="form-guide-empty">Try a tighter crop with clearly readable form labels.</p>}
        </section>
      ) : null}
    </section>
  );
}
