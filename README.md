# Mini Pokédex

An Angular 21 single-page app: browse the Pokédex in a sortable table with a detail panel, and build teams of up to six Pokémon. Data comes over GraphQL from PokéAPI (read) and a local mock server (teams).

State is a small custom RxJS store (no NgRx/Akita/NGXS); the UI is standalone, OnPush, zoneless components that bridge to the stores with signals.

## Setup

Requires Node 20.19+ (or 22.12+ / 24+), as Angular 21 does, and npm.

```bash
npm install
npm run start:all   # mock server (port 4000) and ng serve (port 4200) together
```

Or in two terminals: `npm run mock` and `npm start`. Open http://localhost:4200.

| Command                | What it does                      |
| ---------------------- | --------------------------------- |
| `npm test`             | Vitest unit tests (jsdom)         |
| `npm run lint`         | ESLint (enforces OnPush, signals) |
| `npm run format:check` | Prettier                          |
| `npm run build`        | Production build                  |

Commits follow Conventional Commits, enforced by commitlint through husky. Allowed scopes: `core`, `common`, `pokedex`, `teams`, `deps`, `readme`.

### PokéAPI endpoint change

The URL in the task, `https://beta.pokeapi.co/graphql/v1beta`, returns `401 Unauthorized`. The app uses the current public endpoint, `https://graphql.pokeapi.co/v1beta2`. Its schema drops the `pokemon_v2_` prefix (`pokemon`, `pokemontypes`, `pokemonstats`, …), and it has no `pokemon_by_pk`, so detail uses `pokemon(where: {id: {_eq: $id}})`. The endpoint is a constant in `src/app/common/constants/api.constants.ts`.

### Mock server notes

`db.js` seeds the task's trainers and teams, with one change: Ash's avatar URL from the task returns 404, so it points at a Showdown sprite (commented in `db.js`). Misty's avatar stays empty on purpose, to exercise the initials fallback. The server keeps data in memory, validates nothing (duplicate names are accepted), returns errors as HTTP 200 with `errors[]`, and reuses ids after a delete.

## Architecture

```
src/app/
  core/       GraphQL client, logger
  common/     shared components (skeleton, empty/error state, paginator, toasts),
              AsyncState model, retry/timeout utils, pipes
  pokedex/    services, state (store + selectors), table, filters, detail panel, radar chart
  teams/      services, state (store + selectors), list, summary, builder form, picker
```

**Data layer.** `GraphqlClientService` is a thin wrapper over `HttpClient` with a 15 s timeout. Every failure becomes an `AppError` (`network`, `server`, `rate-limit`, `client`, `graphql`, `unknown`) with a friendly `message` for the UI and technical `details` that are only logged. PokéAPI calls retry transient failures (network, 5xx, 429) three times with exponential backoff (`retryTransient`). Mutations are never retried, because a create is not idempotent.

**Stores.** `PokemonStore` and `TeamStore` each hold one private `BehaviorSubject` of an immutable state object and expose commands. `PokemonSelectors` and `TeamSelectors` derive read-only streams with `map`, `distinctUntilChanged`, `combineLatest` and `shareReplay({bufferSize: 1, refCount: true})`; every stream emits synchronously so `toSignal(..., {requireSync: true})` is safe. HTTP subscriptions use `takeUntilDestroyed`.

**Async views.** Every async view renders from an `AsyncState<T>` (`loading | success | error`) and handles all four states: a skeleton sized like the real content (no layout jump), a meaningful empty message, a friendly error with a working Retry, and the data. This covers the Pokédex table, the detail panel's abilities, the team list, the team summary and the autocomplete dropdown.

### Where each requirement lives

| Requirement                                                   | Location                                                                                                                                                                       |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Search `debounceTime(300) → distinctUntilChanged → switchMap` | `pokedex/state/pokemon.selectors.ts` (`searchResults$`) and `teams/components/pokemon-picker` (autocomplete; `switchMap` cancels the in-flight HTTP request for an older term) |
| Filtered, sorted, paged selectors                             | `pokemon.selectors.ts` (`searchResults$` → `sorted$` → `page$` → `table$`)                                                                                                     |
| Optimistic create with rollback and error toast               | `teams/state/team.store.ts` (`createTeam`; covered by `team.store.spec.ts`)                                                                                                    |
| Optimistic delete with rollback                               | `team.store.ts` (`deleteTeam`)                                                                                                                                                 |
| `effect()` persisting the selected team                       | `teams/services/selected-team.service.ts`                                                                                                                                      |
| `computed()` type distribution and total base stats           | `selected-team.service.ts` (`summary`), `teams/utils/team-summary.util.ts`                                                                                                     |
| `toSignal()` bridging selectors                               | `pokedex.component.ts`, `teams.component.ts`, `selected-team.service.ts`                                                                                                       |
| Async unique-name validator                                   | `teams/utils/team-validators.util.ts` (`uniqueTeamNameValidator`, with spec)                                                                                                   |
| Animated radar chart                                          | `pokedex/components/stats-radar-chart` (ECharts; stats arrive through `[merge]`, so the polygon animates between Pokémon)                                                      |

### Decisions worth knowing

- **Root-provided stores.** The Pokédex cache outlives route changes, and the teams feature reuses it for sprites, types and stats.
- **The full list is loaded once.** PokéAPI returns all 1025 Pokémon in about 38 KB gzipped, so sorting, filtering and pagination are client-side, as the task asks, and the team summary needs no extra requests.
- **Detail panel.** Its header, stats and radar come from the cached list entry, so they show instantly and the chart stays mounted, which is what makes it animate when another Pokémon is selected. Only abilities need a request, and they have their own four states.
- **Optimistic create.** The new team gets a temporary id (`temp-<uuid>`) and `pending: true`. It cannot be selected or deleted until the server replies, so the selection never refers to a temporary id.
- **Selected team.** Stored in localStorage by id. Once the list loads, an id that matches no team is dropped. This matters because the mock reuses ids.
- **Accessibility.** Semantic tables with `aria-sort`, a combobox/listbox picker with arrow-key navigation, Escape closes the panel and returns focus, a polite live region for results, reduced-motion support.

## Tests

`npm test` runs the unit tests. Highlights:

- Store: optimistic create and delete, rollback and toast (`team.store.spec.ts`), caching and retry (`pokemon.store.spec.ts`).
- Selectors: filtering, sorting, paging, debounce and loaded/stale ordering (`pokemon.selectors.spec.ts`).
- Signals: `SelectedTeamService` summary and localStorage persistence.
- Forms: name length, team size and the debounced unique-name validator.
- Components: table, filters, paginator, detail panel, picker (debounce and request cancellation), builder form.

## Bonus

Option 4: skeleton shimmer (all loading states), staggered team-card entry, and toasts for every mutation (success and rollback errors). Animations respect `prefers-reduced-motion`.

## Known limitations and what I would do with more time

- A 429 `Retry-After` header is ignored; retries use fixed exponential backoff.
- A create that times out may still have been saved on the server; the rollback then hides a team that exists until the next reload. A request id (idempotency key) would fix this.
- The unique-name check reads the teams in the store, so it cannot catch a team created elsewhere. The real fix is server-side validation.
- The mock has no validation, and reuses ids after a delete.
- Clearing the search passes through the 300 ms debounce, so "Clear filters" shows the empty state briefly.
- Below about 1100 px the table scrolls horizontally inside its own wrapper (the page itself never does).
- No e2e tests. I verified the throttled, offline, empty and 375 px states by hand in a browser, but a Playwright suite would make that repeatable.
