/** A trainer from the mock server. */
export interface Trainer {
  id: string;
  name: string;
  region: string;
  /** `null` when the trainer has no avatar; the UI shows initials instead. */
  avatarUrl: string | null;
}

/** A saved team. */
export interface Team {
  /** Server id. The mock returns ids as strings. */
  id: string;
  trainerId: string;
  name: string;
  /** Pokédex ids, in pick order. */
  pokemonIds: number[];
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** `null` when `trainerId` matches no trainer. */
  trainer: Trainer | null;
}

/** Fields sent when creating a team. */
export interface CreateTeamInput {
  name: string;
  trainerId: string;
  pokemonIds: number[];
  /** ISO 8601 timestamp set by the caller, so an optimistic copy can share it. */
  createdAt: string;
}
