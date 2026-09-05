"use client";

import { useEffect, useId, useState } from "react";
import { useAdmissionSimulation } from "./admission-simulation-provider";

export function DemoResetControl() {
  const { resetDemo } = useAdmissionSimulation();
  const confirmationId = useId();
  const confirmationTitleId = useId();
  const [confirming, setConfirming] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  useEffect(() => {
    if (!resetComplete) return;
    const feedbackTimer = window.setTimeout(() => setResetComplete(false), 5000);
    return () => window.clearTimeout(feedbackTimer);
  }, [resetComplete]);

  function openConfirmation() {
    setResetComplete(false);
    setConfirming(true);
  }

  function confirmReset() {
    resetDemo();
    setConfirming(false);
    setResetComplete(true);
  }

  return (
    <>
      <div className="prototype-banner">
        <span>Hackathon prototype · Candidate, admission, document, vacancy, and seat states are synthetic. Official CET reference data is labelled.</span>
        <div className="demo-reset-actions">
          {resetComplete ? <span role="status">Demo reset complete</span> : null}
          <button
            type="button"
            aria-expanded={confirming}
            aria-controls={confirmationId}
            onClick={openConfirmation}
          >
            Reset Demo
          </button>
        </div>
      </div>
      {confirming ? (
        <section
          className="demo-reset-confirmation"
          id={confirmationId}
          aria-labelledby={confirmationTitleId}
        >
          <div>
            <strong id={confirmationTitleId}>Restore the starting demo state?</strong>
            <span>The original AISSMS seat, vacancies, clearing queues, document passport, consent, sharing history, scholarship demo profile and in-app reminder controls will be restored. Your saved preferences will not be changed.</span>
          </div>
          <div>
            <button autoFocus type="button" onClick={() => setConfirming(false)}>Cancel</button>
            <button className="confirm-reset-button" type="button" onClick={confirmReset}>Reset Demo</button>
          </div>
        </section>
      ) : null}
    </>
  );
}
