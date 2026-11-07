import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-teams-page',
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamsPage {}
