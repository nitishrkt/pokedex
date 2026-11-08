/** The app has no auth, so every new team belongs to Ash (trainer 1). */
export const DEFAULT_TRAINER_ID = '1';

export const TEAM_NAME_MIN_LENGTH = 3;
export const TEAM_NAME_MAX_LENGTH = 30;

export const TEAM_MIN_SIZE = 1;
export const TEAM_MAX_SIZE = 6;

/** Shown instead of the generic network message when the mock is down. */
export const TEAMS_SERVER_UNREACHABLE_MESSAGE =
  "Can't reach the teams server. Is the mock server running on port 4000?";

/** localStorage key holding the id of the selected team. */
export const SELECTED_TEAM_STORAGE_KEY = 'pokedex.selectedTeamId';
