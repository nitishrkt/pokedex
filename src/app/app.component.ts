import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface NavLink {
  readonly label: string;
  readonly path: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected readonly appTitle = 'Mini Pokédex';
  protected readonly navLinks: readonly NavLink[] = [
    { label: 'Pokédex', path: '/pokedex' },
    { label: 'Teams', path: '/teams' },
  ];
}
