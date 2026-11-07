import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-pokedex-page',
  templateUrl: './pokedex.component.html',
  styleUrl: './pokedex.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokedexPage {}
