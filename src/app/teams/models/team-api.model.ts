/*
 * Raw json-graphql-server response shapes, matching the documents in
 * `team-queries.constants.ts`. Map them with `team-mapper.util.ts`.
 */

export interface TrainerDto {
  id: string;
  name: string;
  region: string;
  /** Empty string when the trainer has no avatar. */
  avatar_url: string;
}

export interface TeamDto {
  id: string;
  trainer_id: string;
  name: string;
  /** Declared `[Int]!`, so entries are nullable in the schema. */
  pokemon_ids: (number | null)[];
  created_at: string;
  Trainer: TrainerDto | null;
}

export interface GetTeamsResponse {
  allTeams: TeamDto[];
}

export interface CreateTeamResponse {
  createTeam: TeamDto;
}

export interface DeleteTeamResponse {
  removeTeam: { id: string } | null;
}
