import { inject, Injectable } from '@angular/core';
import { catchError, map, MonoTypeOperatorFunction, Observable, throwError } from 'rxjs';

import { MOCK_GRAPHQL_URL } from '../../common/constants/api.constants';
import { GraphqlClientService } from '../../core/graphql/graphql-client.service';
import { normalizeAppError, toAppError } from '../../core/graphql/graphql-error.util';
import { LoggerService } from '../../core/logger.service';
import {
  CREATE_TEAM_MUTATION,
  DELETE_TEAM_MUTATION,
  GET_TEAMS_QUERY,
} from '../constants/team-queries.constants';
import { TEAMS_SERVER_UNREACHABLE_MESSAGE } from '../constants/team.constants';
import { CreateTeamResponse, DeleteTeamResponse, GetTeamsResponse } from '../models/team-api.model';
import { CreateTeamInput, Team } from '../models/team.model';
import { mapTeam } from '../utils/team-mapper.util';

/**
 * Teams CRUD against the local mock. Nothing is retried: mutations are not
 * idempotent, and the spec's retry rule covers PokéAPI only.
 */
@Injectable({ providedIn: 'root' })
export class TeamApiService {
  private readonly graphql = inject(GraphqlClientService);
  private readonly logger = inject(LoggerService);

  /** Loads all teams with their trainer, newest first. Errors with an AppError. */
  getTeams$(): Observable<Team[]> {
    return this.graphql.request$<GetTeamsResponse>(MOCK_GRAPHQL_URL, GET_TEAMS_QUERY).pipe(
      map(({ allTeams }) => allTeams.map(mapTeam)),
      normalizeAppError(this.logger, 'getTeams$'),
      explainUnreachableServer(),
    );
  }

  /**
   * Creates a team and emits it as stored, with its server id. The server does
   * no validation, so validate `input` first. Errors with an AppError.
   */
  createTeam$(input: CreateTeamInput): Observable<Team> {
    return this.graphql
      .request$<CreateTeamResponse>(MOCK_GRAPHQL_URL, CREATE_TEAM_MUTATION, {
        name: input.name,
        trainerId: input.trainerId,
        pokemonIds: input.pokemonIds,
        createdAt: input.createdAt,
      })
      .pipe(
        map(({ createTeam }) => mapTeam(createTeam)),
        normalizeAppError(this.logger, 'createTeam$'),
        explainUnreachableServer(),
      );
  }

  /**
   * Deletes a team and emits once it is gone. An already deleted team counts as
   * success, so an optimistic delete never restores a ghost. Errors with an AppError.
   */
  deleteTeam$(id: string): Observable<void> {
    return this.graphql
      .request$<DeleteTeamResponse>(MOCK_GRAPHQL_URL, DELETE_TEAM_MUTATION, { id })
      .pipe(
        map(({ removeTeam }) => {
          if (removeTeam === null) {
            this.logger.warn(`Team ${id} was already deleted on the server`);
          }
        }),
        normalizeAppError(this.logger, 'deleteTeam$'),
        explainUnreachableServer(),
      );
  }
}

/** Names the mock server when there was no HTTP response at all (status 0). */
function explainUnreachableServer<T>(): MonoTypeOperatorFunction<T> {
  return catchError((error: unknown) => {
    const appError = toAppError(error);
    return throwError(() =>
      appError.status === 0 ? { ...appError, message: TEAMS_SERVER_UNREACHABLE_MESSAGE } : appError,
    );
  });
}
