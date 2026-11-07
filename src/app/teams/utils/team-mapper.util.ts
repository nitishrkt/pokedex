import { TeamDto, TrainerDto } from '../models/team-api.model';
import { Team, Trainer } from '../models/team.model';

/** Maps a raw trainer. An empty avatar URL becomes `null`. */
export function mapTrainer(dto: TrainerDto): Trainer {
  return {
    id: dto.id,
    name: dto.name,
    region: dto.region,
    avatarUrl: dto.avatar_url.trim() === '' ? null : dto.avatar_url,
  };
}

/** Maps a raw team. Null Pokémon ids are dropped. */
export function mapTeam(dto: TeamDto): Team {
  return {
    id: dto.id,
    trainerId: dto.trainer_id,
    name: dto.name,
    pokemonIds: dto.pokemon_ids.filter((id): id is number => id !== null),
    createdAt: dto.created_at,
    trainer: dto.Trainer ? mapTrainer(dto.Trainer) : null,
  };
}
