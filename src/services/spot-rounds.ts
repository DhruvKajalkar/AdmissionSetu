import type { SpotRound, SpotRoundParticipant } from "@/types";

export interface SpotRoundService {
  listSpotRounds(): Promise<readonly SpotRound[]>;
  getSpotRoundById(id: string): Promise<SpotRound | null>;
  listParticipants(spotRoundId: string): Promise<readonly SpotRoundParticipant[]>;
}
