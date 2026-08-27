import { SectionCard } from "./section-card";
import type { AdmissionJourneyStage, AdmissionJourneyStageId, AdmissionJourneyStageState } from "@/types";

interface AdmissionJourneyProps {
  stages: readonly AdmissionJourneyStage[];
  currentStageId: AdmissionJourneyStageId;
}

function getStageState(index: number, currentIndex: number): AdmissionJourneyStageState {
  if (index < currentIndex) return "COMPLETED";
  if (index === currentIndex) return "CURRENT";
  return "UPCOMING";
}

const stateLabels: Record<AdmissionJourneyStageState, string> = {
  COMPLETED: "Completed",
  CURRENT: "Current stage",
  UPCOMING: "Upcoming",
};

export function AdmissionJourney({ stages, currentStageId }: AdmissionJourneyProps) {
  const currentIndex = stages.findIndex((stage) => stage.id === currentStageId);

  return (
    <SectionCard
      className="journey-card"
      title="Your Admission Journey"
      description="One clear view of where you are across the engineering admission process."
    >
      <ol className="journey-timeline">
        {stages.map((stage, index) => {
          const state = getStageState(index, currentIndex);
          return (
            <li
              key={stage.id}
              className={`journey-stage ${state.toLowerCase()}`}
              aria-current={state === "CURRENT" ? "step" : undefined}
            >
              <div className="journey-stage-top">
                <span className="journey-node" aria-hidden="true">
                  {state === "COMPLETED" ? "✓" : index + 1}
                </span>
                <span className="journey-state-label">{stateLabels[state]}</span>
              </div>
              <h3>{stage.title}</h3>
              <p>{stage.description}</p>
            </li>
          );
        })}
      </ol>
    </SectionCard>
  );
}
