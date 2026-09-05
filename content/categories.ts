import type { Category } from '../shared/types'

/**
 * Temaene. `scene` peker på en SVG-scene i `src/themes/scenes.tsx`.
 * `gradient` er to fargestopp som brukes på kategorikortet og som
 * bakgrunnsstemning under spillet.
 */
export const CATEGORIES: Category[] = [
  {
    id: 'blaa',
    name: { nb: 'Blå', sv: 'Blå' },
    scene: 'blaa',
    gradient: ['#2B5CE6', '#FF2D8E'],
  },
  {
    id: 'rod',
    name: { nb: 'Rød', sv: 'Röd' },
    scene: 'rod',
    gradient: ['#FF2D8E', '#FF7A3D'],
  },
  {
    id: 'gull',
    name: { nb: 'Gull', sv: 'Guld' },
    scene: 'gull',
    gradient: ['#F5A623', '#FF2D8E'],
  },
  {
    id: 'vikinger',
    name: { nb: 'Vikinger', sv: 'Vikingar' },
    scene: 'vikinger',
    gradient: ['#7A2BE6', '#FF2D8E'],
  },
  {
    id: 'japan',
    name: { nb: 'Japan', sv: 'Japan' },
    scene: 'japan',
    gradient: ['#FF5FA8', '#8E44D8'],
  },
  {
    id: 'manen',
    name: { nb: 'Månen', sv: 'Månen' },
    scene: 'manen',
    gradient: ['#1B2360', '#FF2D8E'],
  },
  {
    id: 'kaffe',
    name: { nb: 'Kaffe', sv: 'Kaffe' },
    scene: 'kaffe',
    gradient: ['#8A4A2B', '#FF2D8E'],
  },
  {
    id: 'kongelige',
    name: { nb: 'Kongelige', sv: 'Kungligheter' },
    scene: 'kongelige',
    gradient: ['#3B2BE6', '#FF6FB5' ],
  },
  {
    id: 'fjell',
    name: { nb: 'Fjell', sv: 'Berg' },
    scene: 'fjell',
    gradient: ['#2E7DA8', '#FF2D8E'],
  },
  {
    id: 'havet',
    name: { nb: 'Havet', sv: 'Havet' },
    scene: 'havet',
    gradient: ['#0E7C86', '#FF3D9B'],
  },
  {
    id: 'ild',
    name: { nb: 'Ild', sv: 'Eld' },
    scene: 'ild',
    gradient: ['#FF3D2E', '#FF2D8E'],
  },
  {
    id: 'rovdyr',
    name: { nb: 'Rovdyr', sv: 'Rovdjur' },
    scene: 'rovdyr',
    gradient: ['#4A3B8C', '#FF5FA8'],
  },
  {
    id: 'drikke',
    name: { nb: 'Vin og øl', sv: 'Vin och öl' },
    scene: 'drikke',
    gradient: ['#9B1D5A', '#FF7A3D'],
  },
  {
    id: 'tog',
    name: { nb: 'Tog', sv: 'Tåg' },
    scene: 'tog',
    gradient: ['#1F3A93', '#FF2D8E'],
  },
  {
    id: 'nobel',
    name: { nb: 'Nobel', sv: 'Nobel' },
    scene: 'nobel',
    gradient: ['#C79A2B', '#8E2BE6'],
  },
  {
    id: 'sjokolade',
    name: { nb: 'Sjokolade', sv: 'Choklad' },
    scene: 'sjokolade',
    gradient: ['#6B3A2A', '#FF4D9E'],
  },
  {
    id: 'vinter',
    name: { nb: 'Vinter', sv: 'Vinter' },
    scene: 'vinter',
    gradient: ['#3FA9D8', '#FF6FB5'],
  },
  {
    id: 'fugler',
    name: { nb: 'Fugler', sv: 'Fåglar' },
    scene: 'fugler',
    gradient: ['#1E9E7A', '#FF3D9B'],
  },
  {
    id: 'broer',
    name: { nb: 'Broer', sv: 'Broar' },
    scene: 'broer',
    gradient: ['#2B4BE6', '#FF5FA8'],
  },
  {
    id: 'tid',
    name: { nb: 'Tid', sv: 'Tid' },
    scene: 'tid',
    gradient: ['#5B2BE6', '#FF8A3D'],
  },
  {
    id: 'storm',
    name: { nb: 'Storm', sv: 'Storm' },
    scene: 'storm',
    gradient: ['#1F3A8A', '#FF2D8E'],
  },
  {
    id: 'salt',
    name: { nb: 'Salt', sv: 'Salt' },
    scene: 'salt',
    gradient: ['#1E8FA8', '#FF5FA8'],
  },
  {
    id: 'hjerte',
    name: { nb: 'Hjerte', sv: 'Hjärta' },
    scene: 'hjerte',
    gradient: ['#E62B5C', '#FF8A3D'],
  },
  {
    id: 'linn',
    name: { nb: 'Linn', sv: 'Linn' },
    scene: 'linn',
    gradient: ['#3FA66A', '#FF5FA8'],
  },
  {
    id: 'brun',
    name: { nb: 'Brun', sv: 'Brun' },
    scene: 'brun',
    gradient: ['#6B3A22', '#FFC94D'],
  },
  {
    id: 'borg',
    name: { nb: 'Borg', sv: 'Borg' },
    scene: 'borg',
    gradient: ['#2B3A6B', '#8E44D8'],
  },
  {
    id: 'fot',
    name: { nb: 'Fot', sv: 'Fot' },
    scene: 'fot',
    gradient: ['#1F7A4D', '#FFC94D'],
  },
  {
    id: 'ball',
    name: { nb: 'Ball', sv: 'Boll' },
    scene: 'ball',
    gradient: ['#FF7A3D', '#8E44D8'],
  },
  {
    id: 'stein',
    name: { nb: 'Stein', sv: 'Sten' },
    scene: 'stein',
    gradient: ['#5A5F73', '#3AD6E0'],
  },
  {
    id: 'ring',
    name: { nb: 'Ring', sv: 'Ring' },
    scene: 'ring',
    gradient: ['#D4A017', '#2B5CE6'],
  },
  {
    id: 'sol',
    name: { nb: 'Sol', sv: 'Sol' },
    scene: 'sol',
    gradient: ['#FFD54A', '#FF7A3D'],
  },
  {
    id: 'natt',
    name: { nb: 'Natt', sv: 'Natt' },
    scene: 'natt',
    gradient: ['#0C1338', '#3AD6E0'],
  },
  {
    id: 'hus',
    name: { nb: 'Hus', sv: 'Hus' },
    scene: 'hus',
    gradient: ['#345B8C', '#FF5FA8'],
  },
]

export const CATEGORY_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]))
