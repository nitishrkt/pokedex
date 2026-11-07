import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'pokedex', pathMatch: 'full' },
  {
    path: 'pokedex',
    loadChildren: () => import('./pokedex/pokedex.routes').then((m) => m.pokedexRoutes),
  },
  {
    path: 'teams',
    loadChildren: () => import('./teams/teams.routes').then((m) => m.teamsRoutes),
  },
  { path: '**', redirectTo: 'pokedex' },
];
