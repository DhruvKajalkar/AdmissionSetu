import Link from "next/link";
import { PageHeader, StatusBadge } from "@/components";
import { colleges, spotRounds } from "@/data";
import { formatDateTime } from "@/lib/format";

export default function SpotRoundsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Institute rounds"
        title="Spot Rounds"
        description="A single place to discover and track institute-level vacancy rounds. Joining and queue activity are not enabled in this phase."
      />
      <div className="round-list">
        {spotRounds.map((round) => {
          const college = colleges.find((item) => item.id === round.collegeId);
          return (
            <Link className="round-row" href={`/spot-rounds/${round.id}`} key={round.id}>
              <div>
                <h2>{round.title}</h2>
                <p>{college?.city} · Starts {formatDateTime(round.startsAt)}</p>
              </div>
              <div className="round-meta">
                <StatusBadge tone={round.status === "REGISTRATION_OPEN" ? "success" : "info"}>
                  {round.status.replaceAll("_", " ")}
                </StatusBadge>
                <span className="round-vacancies">{round.vacancyCount} synthetic vacancies →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
