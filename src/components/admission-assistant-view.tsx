"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { demoCandidate } from "@/data";
import { buildAssistantContextSnapshot } from "@/services/assistant-context";
import type { AssistantAction, AssistantAnswer, AssistantHistoryMessage, AssistantSource } from "@/types";
import { useAdmissionSimulation } from "./admission-simulation-provider";
import { PageHeader } from "./page-header";
import { usePreferenceShortlist } from "./preference-shortlist";
import { StatusBadge } from "./status-badge";

const suggestedQuestions = [
  "What happens if I accept VIT?",
  "Why are my top six preferences risky?",
  "Which documents am I missing?",
  "Which scholarships could match me?",
  "Where am I highest in the merit lists?",
  "Am I ready for institute reporting?",
] as const;

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: AssistantSource[];
  actions?: AssistantAction[];
  notice?: string;
}

export function AdmissionAssistantView() {
  const { state } = useAdmissionSimulation();
  const { preferences } = usePreferenceShortlist();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextId = useRef(1);

  async function sendQuestion(question: string) {
    const message = question.trim();
    if (!message || loading) return;
    const userMessage: ChatMessage = { id: nextId.current++, role: "user", content: message };
    const boundedHistory: AssistantHistoryMessage[] = messages.slice(-8).map((item) => ({ role: item.role, content: item.content }));
    setMessages((current) => [...current, userMessage].slice(-24));
    setDraft("");
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: boundedHistory,
          context: buildAssistantContextSnapshot(state, preferences, demoCandidate),
        }),
      });
      const body = await response.json() as AssistantAnswer | { error?: string };
      if (!response.ok || !("answer" in body)) throw new Error("error" in body && body.error ? body.error : "The assistant could not answer right now.");
      const assistantMessage: ChatMessage = {
        id: nextId.current++,
        role: "assistant",
        content: body.answer,
        sources: body.sources,
        actions: body.actions,
        notice: body.notice,
      };
      setMessages((current) => [...current, assistantMessage].slice(-24));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The assistant could not answer right now.");
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion(draft);
  }

  return (
    <>
      <PageHeader
        eyebrow="Read-only admission guide"
        title="Ask AdmissionSetu"
        description="Ask questions about your admission, preferences, documents, merit lists and financial aid."
        action={<StatusBadge tone="info">Synthetic context</StatusBadge>}
      />

      <section className="assistant-boundary-note" aria-label="Assistant limitations">
        <strong>Advice only — no admission actions</strong>
        <span>The assistant can explain your current demo state and link to the right page. It cannot accept seats, change preferences, share documents or submit applications.</span>
      </section>

      <section className="assistant-panel" aria-label="Admission assistant conversation">
        <div className="assistant-transcript" aria-live="polite" aria-busy={loading}>
          {messages.length === 0 ? (
            <div className="assistant-empty-state">
              <p>Questions grounded in your current state</p>
              <h2>You do not need to repeat your admission details.</h2>
              <span>Choose a question below or write your own. Answers distinguish synthetic demo state from official public references.</span>
              <div className="assistant-suggestions" aria-label="Suggested questions">
                {suggestedQuestions.map((question) => (
                  <button type="button" key={question} onClick={() => void sendQuestion(question)} disabled={loading}>{question}</button>
                ))}
              </div>
            </div>
          ) : (
            <ol className="assistant-messages">
              {messages.map((message) => (
                <li className={`assistant-message ${message.role}`} key={message.id}>
                  <span>{message.role === "user" ? "You" : "AdmissionSetu"}</span>
                  <div className="assistant-bubble">
                    <p>{message.content}</p>
                    {message.notice ? <small className="assistant-mode-notice">{message.notice}</small> : null}
                    {message.sources?.length ? (
                      <div className="assistant-sources">
                        <strong>Sources</strong>
                        <ul>{message.sources.map((source) => <li key={source.id}>{source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.label}</a> : <span>{source.label}</span>}<em>{source.kind.replace("_", " ").toLowerCase()}</em></li>)}</ul>
                      </div>
                    ) : null}
                    {message.actions?.length ? <nav className="assistant-actions" aria-label="Related pages">{message.actions.map((action) => <Link href={action.href} key={action.href}>{action.label} →</Link>)}</nav> : null}
                  </div>
                </li>
              ))}
              {loading ? <li className="assistant-message assistant"><span>AdmissionSetu</span><div className="assistant-bubble assistant-loading">Checking your current demo state…</div></li> : null}
            </ol>
          )}
        </div>

        <form className="assistant-composer" onSubmit={submit}>
          <label htmlFor="assistant-question">Your question</label>
          <div>
            <textarea id="assistant-question" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={500} rows={2} placeholder="Ask about your current admission or next step" disabled={loading} />
            <button className="primary-link-button" type="submit" disabled={loading || !draft.trim()}>{loading ? "Checking…" : "Ask AdmissionSetu"}</button>
          </div>
          <small>{draft.length}/500 · Do not enter real personal or document information.</small>
          {error ? <p className="assistant-error" role="alert">{error} Your admission state has not changed.</p> : null}
        </form>
      </section>
    </>
  );
}
