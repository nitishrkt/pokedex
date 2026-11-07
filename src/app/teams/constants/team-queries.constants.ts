/*
 * json-graphql-server documents for the local mock (`db.js`). Each was
 * checked against the running server. Its query errors arrive as HTTP 200
 * with `errors[]`, like PokéAPI's.
 */

const TEAM_FRAGMENT = `
  fragment TeamFields on Team {
    id
    trainer_id
    name
    pokemon_ids
    created_at
    Trainer {
      id
      name
      region
      avatar_url
    }
  }
`;

/** All teams, newest first. */
export const GET_TEAMS_QUERY = `
  query GetTeams {
    allTeams(sortField: "created_at", sortOrder: "DESC") {
      ...TeamFields
    }
  }
  ${TEAM_FRAGMENT}
`;

/** `created_at` is a required argument; the server does not set it. */
export const CREATE_TEAM_MUTATION = `
  mutation CreateTeam(
    $name: String!
    $trainerId: ID!
    $pokemonIds: [Int]!
    $createdAt: String!
  ) {
    createTeam(
      name: $name
      trainer_id: $trainerId
      pokemon_ids: $pokemonIds
      created_at: $createdAt
    ) {
      ...TeamFields
    }
  }
  ${TEAM_FRAGMENT}
`;

/** Returns the removed team's id, or `null` when no team had that id. */
export const DELETE_TEAM_MUTATION = `
  mutation DeleteTeam($id: ID!) {
    removeTeam(id: $id) {
      id
    }
  }
`;
