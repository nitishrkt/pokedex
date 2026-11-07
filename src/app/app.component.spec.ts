import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NEVER } from 'rxjs';

import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { PokemonApiService } from './pokedex/services/pokemon-api.service';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let router: Router;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter(routes),
        // The Pokédex page loads on navigation; keep it loading, off the network.
        { provide: PokemonApiService, useValue: { getPokemonList$: () => NEVER } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    router = TestBed.inject(Router);
  });

  it('renders the title and the Pokédex and Teams nav links', async () => {
    await fixture.whenStable();

    expect(element().querySelector('.app-shell__brand')?.textContent?.trim()).toBe('Mini Pokédex');
    const links = Array.from(
      element().querySelectorAll<HTMLAnchorElement>('.app-shell__nav-link'),
    ).map((link) => ({ label: link.textContent?.trim(), href: link.getAttribute('href') }));
    expect(links).toEqual([
      { label: 'Pokédex', href: '/pokedex' },
      { label: 'Teams', href: '/teams' },
    ]);
  });

  it('redirects the empty path to the pokedex page and marks its link active', async () => {
    await router.navigateByUrl('/');
    await fixture.whenStable();

    expect(router.url).toBe('/pokedex');
    expect(element().querySelector('app-pokedex-page h1')?.textContent).toContain('Pokédex');
    const active = element().querySelector('.app-shell__nav-link--active');
    expect(active?.textContent?.trim()).toBe('Pokédex');
    expect(active?.getAttribute('aria-current')).toBe('page');
  });

  it('marks the Teams link active on the teams page', async () => {
    await router.navigateByUrl('/teams');
    await fixture.whenStable();

    const active = element().querySelectorAll('.app-shell__nav-link--active');
    expect(active.length).toBe(1);
    expect(active[0].textContent?.trim()).toBe('Teams');
    expect(active[0].getAttribute('aria-current')).toBe('page');
  });

  it('redirects unknown paths to the pokedex page', async () => {
    await router.navigateByUrl('/does-not-exist');
    await fixture.whenStable();

    expect(router.url).toBe('/pokedex');
  });
});
