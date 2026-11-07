import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_REQUEST_TIMEOUT_MS, MOCK_GRAPHQL_URL } from '../../common/constants/api.constants';
import { AppError } from '../../common/models/app-error.model';
import { TIMEOUT_ERROR_MESSAGE } from '../../core/graphql/graphql-error.util';
import { LoggerService } from '../../core/logger.service';
import { TEAMS_SERVER_UNREACHABLE_MESSAGE } from '../constants/team.constants';
import { TeamDto } from '../models/team-api.model';
import { CreateTeamInput, Team } from '../models/team.model';
import { TeamApiService } from './team-api.service';

const MISTY_TEAM_DTO: TeamDto = {
  id: '3',
  trainer_id: '2',
  name: 'Water Specialists',
  pokemon_ids: [121, null, 130],
  created_at: '2024-02-10T09:00:00Z',
  Trainer: { id: '2', name: 'Misty Waterflower', region: 'Kanto', avatar_url: '' },
};

const RAIN_TEAM_INPUT: CreateTeamInput = {
  name: 'Rain Team',
  trainerId: '1',
  pokemonIds: [7, 8],
  createdAt: '2026-11-07T12:00:00.000Z',
};

describe('TeamApiService', () => {
  let service: TeamApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TeamApiService);
    httpMock = TestBed.inject(HttpTestingController);
    const logger = TestBed.inject(LoggerService);
    vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
  });

  it('maps teams, turning an empty avatar URL into null', () => {
    let teams: Team[] | undefined;
    service.getTeams$().subscribe((value) => (teams = value));

    httpMock.expectOne(MOCK_GRAPHQL_URL).flush({ data: { allTeams: [MISTY_TEAM_DTO] } });

    expect(teams).toEqual([
      {
        id: '3',
        trainerId: '2',
        name: 'Water Specialists',
        pokemonIds: [121, 130],
        createdAt: '2024-02-10T09:00:00Z',
        trainer: { id: '2', name: 'Misty Waterflower', region: 'Kanto', avatarUrl: null },
      },
    ]);
  });

  it('sends the caller-provided created_at with the create mutation and maps the result', () => {
    let team: Team | undefined;
    service.createTeam$(RAIN_TEAM_INPUT).subscribe((value) => (team = value));

    const req = httpMock.expectOne(MOCK_GRAPHQL_URL);
    expect(req.request.body.variables).toEqual(RAIN_TEAM_INPUT);
    req.flush({ data: { createTeam: { ...MISTY_TEAM_DTO, id: '4', name: 'Rain Team' } } });

    expect(team).toMatchObject({ id: '4', name: 'Rain Team' });
  });

  it('points at the mock server when it cannot be reached, without retrying', () => {
    let error: AppError | undefined;
    service.createTeam$(RAIN_TEAM_INPUT).subscribe({ error: (e: AppError) => (error = e) });

    httpMock.expectOne(MOCK_GRAPHQL_URL).error(new ProgressEvent('error'));

    expect(error).toMatchObject({ kind: 'network', message: TEAMS_SERVER_UNREACHABLE_MESSAGE });
  });

  it('keeps the timeout message when the mock is slow rather than down', () => {
    vi.useFakeTimers();
    let error: AppError | undefined;
    service.getTeams$().subscribe({ error: (e: AppError) => (error = e) });

    httpMock.expectOne(MOCK_GRAPHQL_URL);
    vi.advanceTimersByTime(API_REQUEST_TIMEOUT_MS);

    expect(error).toMatchObject({ kind: 'network', message: TIMEOUT_ERROR_MESSAGE });
  });

  it('deletes a team by id and completes', () => {
    let emitted = 0;
    let completed = false;
    service
      .deleteTeam$('3')
      .subscribe({ next: () => emitted++, complete: () => (completed = true) });

    const req = httpMock.expectOne(MOCK_GRAPHQL_URL);
    expect(req.request.body.variables).toEqual({ id: '3' });
    req.flush({ data: { removeTeam: { id: '3' } } });

    expect({ emitted, completed }).toEqual({ emitted: 1, completed: true });
  });

  it('treats deleting an already deleted team as success', () => {
    let completed = false;
    service.deleteTeam$('99').subscribe({ complete: () => (completed = true) });

    httpMock.expectOne(MOCK_GRAPHQL_URL).flush({ data: { removeTeam: null } });

    expect(completed).toBe(true);
  });
});
