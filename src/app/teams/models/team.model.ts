import { PokemonTypeName } from '../../pokedex/constants/pokemon-types.constants';

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

/** A team in the store: a saved {@link Team}, or an optimistic one still being created. */
export interface TeamEntry extends Team {
  /** True while the create request is in flight; the id is then a temporary one. */
  pending: boolean;
}

/** What the team builder form submits. */
export type NewTeam = Pick<CreateTeamInput, 'name' | 'pokemonIds'>;

/** One slice of a team's type distribution. */
export interface TypeCount {
  type: PokemonTypeName;
  count: number;
}

/** Numbers shown for the selected team. */
export interface TeamSummary {
  /** Types across all members, most common first (ties in canonical type order). */
  typeDistribution: TypeCount[];
  /** Sum of every resolved member's six base stats. */
  totalBaseStats: number;
  /** Members whose Pokémon data is not loaded, so they are left out of the numbers. */
  unresolvedCount: number;
}
