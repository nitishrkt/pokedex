import { PokemonSortKey } from '../models/pokemon-state.model';

/** One Pokédex table column header. */
export interface PokemonTableColumn {
  readonly label: string;
  /** Full name, for the tooltip and the caption, when `label` is abbreviated. */
  readonly title?: string;
  /** Set on sortable columns. */
  readonly sortKey?: PokemonSortKey;
  /** Width and alignment modifier: `pokemon-table__th--{variant}`. */
  readonly variant: 'id' | 'sprite' | 'name' | 'types' | 'num';
  /** Hide the label on screen; it still names the column for screen readers. */
  readonly hideLabel?: boolean;
}

/** Every column, in display order. */
export const POKEMON_TABLE_COLUMNS: readonly PokemonTableColumn[] = [
  { label: '#', title: 'Number', sortKey: 'id', variant: 'id' },
  { label: 'Sprite', variant: 'sprite', hideLabel: true },
  { label: 'Name', sortKey: 'name', variant: 'name' },
  { label: 'Types', variant: 'types' },
  { label: 'HP', sortKey: 'hp', variant: 'num' },
  { label: 'Attack', sortKey: 'attack', variant: 'num' },
  { label: 'Defense', sortKey: 'defense', variant: 'num' },
  { label: 'Sp. Atk', title: 'Special Attack', sortKey: 'specialAttack', variant: 'num' },
  { label: 'Sp. Def', title: 'Special Defense', sortKey: 'specialDefense', variant: 'num' },
  { label: 'Speed', sortKey: 'speed', variant: 'num' },
  { label: 'Total', sortKey: 'totalStats', variant: 'num' },
];

/** Keys of the numeric columns, in the same order as {@link POKEMON_TABLE_COLUMNS}. */
export const POKEMON_STAT_KEYS = [
  'hp',
  'attack',
  'defense',
  'specialAttack',
  'specialDefense',
  'speed',
  'totalStats',
] as const;
