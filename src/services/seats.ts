import type { Seat } from "@/types";

export interface SeatService {
  getSeatById(id: string): Promise<Seat | null>;
  listAvailableSeats(programId?: string): Promise<readonly Seat[]>;
}
