import type { Category } from '../shared/types'

/**
 * De 20 temaene. `scene` peker på en SVG-scene i `src/themes/scenes.tsx`.
 * `gradient` er to fargestopp som brukes på kategorikortet og som
 * bakgrunnsstemning under spillet.
 */
export const CATEGORIES: Category[] = [
  {
    id: 'blaa',
    name: { nb: 'Blå', sv: 'Blå' },
    tagline: { nb: 'Fra blåtann til blåhval', sv: 'Från blåtand till blåval' },
    scene: 'blaa',
    gradient: ['#2B5CE6', '#FF2D8E'],
  },
  {
    id: 'rod',
    name: { nb: 'Rød', sv: 'Röd' },
    tagline: { nb: 'Blod, brann og røde løpere', sv: 'Blod, brand och röda mattor' },
    scene: 'rod',
    gradient: ['#FF2D8E', '#FF7A3D'],
  },
  {
    id: 'gull',
    name: { nb: 'Gull', sv: 'Guld' },
    tagline: { nb: 'Medaljer, gullalder og gullfeber', sv: 'Medaljer, guldålder och guldfeber' },
    scene: 'gull',
    gradient: ['#F5A623', '#FF2D8E'],
  },
  {
    id: 'vikinger',
    name: { nb: 'Vikinger', sv: 'Vikingar' },
    tagline: { nb: 'Langskip, runer og fotballklubben', sv: 'Långskepp, runor och fotbollsklubben' },
    scene: 'vikinger',
    gradient: ['#7A2BE6', '#FF2D8E'],
  },
  {
    id: 'japan',
    name: { nb: 'Japan', sv: 'Japan' },
    tagline: { nb: 'Kirsebærblomster, keisere og konsoller', sv: 'Körsbärsblom, kejsare och konsoler' },
    scene: 'japan',
    gradient: ['#FF5FA8', '#8E44D8'],
  },
  {
    id: 'manen',
    name: { nb: 'Månen', sv: 'Månen' },
    tagline: { nb: 'Landinger, tidevann og måneskinn', sv: 'Landningar, tidvatten och månsken' },
    scene: 'manen',
    gradient: ['#1B2360', '#FF2D8E'],
  },
  {
    id: 'kaffe',
    name: { nb: 'Kaffe', sv: 'Kaffe' },
    tagline: { nb: 'Bønner, kanner og koffein', sv: 'Bönor, kannor och koffein' },
    scene: 'kaffe',
    gradient: ['#8A4A2B', '#FF2D8E'],
  },
  {
    id: 'kongelige',
    name: { nb: 'Kongelige', sv: 'Kungligheter' },
    tagline: { nb: 'Kroner, slott og tronfølge', sv: 'Kronor, slott och tronföljd' },
    scene: 'kongelige',
    gradient: ['#3B2BE6', '#FF6FB5' ],
  },
  {
    id: 'fjell',
    name: { nb: 'Fjell', sv: 'Berg' },
    tagline: { nb: 'Topper, tinder og førstebestigninger', sv: 'Toppar, tinnar och förstabestigningar' },
    scene: 'fjell',
    gradient: ['#2E7DA8', '#FF2D8E'],
  },
  {
    id: 'havet',
    name: { nb: 'Havet', sv: 'Havet' },
    tagline: { nb: 'Dyp, skip og salte historier', sv: 'Djup, skepp och salta historier' },
    scene: 'havet',
    gradient: ['#0E7C86', '#FF3D9B'],
  },
  {
    id: 'ild',
    name: { nb: 'Ild', sv: 'Eld' },
    tagline: { nb: 'Vulkaner, branner og olympisk flamme', sv: 'Vulkaner, bränder och olympisk låga' },
    scene: 'ild',
    gradient: ['#FF3D2E', '#FF2D8E'],
  },
  {
    id: 'rovdyr',
    name: { nb: 'Rovdyr', sv: 'Rovdjur' },
    tagline: { nb: 'Ulv, bjørn og andre med tenner', sv: 'Varg, björn och andra med tänder' },
    scene: 'rovdyr',
    gradient: ['#4A3B8C', '#FF5FA8'],
  },
  {
    id: 'drikke',
    name: { nb: 'Vin og øl', sv: 'Vin och öl' },
    tagline: { nb: 'Druer, humle og hundre år gamle bryggerier', sv: 'Druvor, humle och hundraåriga bryggerier' },
    scene: 'drikke',
    gradient: ['#9B1D5A', '#FF7A3D'],
  },
  {
    id: 'tog',
    name: { nb: 'Tog', sv: 'Tåg' },
    tagline: { nb: 'Skinner, tunneler og togtabeller', sv: 'Räls, tunnlar och tidtabeller' },
    scene: 'tog',
    gradient: ['#1F3A93', '#FF2D8E'],
  },
  {
    id: 'nobel',
    name: { nb: 'Nobel', sv: 'Nobel' },
    tagline: { nb: 'Dynamitt, diplomer og desember i Stockholm', sv: 'Dynamit, diplom och december i Stockholm' },
    scene: 'nobel',
    gradient: ['#C79A2B', '#8E2BE6'],
  },
  {
    id: 'sjokolade',
    name: { nb: 'Sjokolade', sv: 'Choklad' },
    tagline: { nb: 'Kakao, konfekt og kvikk lunsj', sv: 'Kakao, konfekt och kexchoklad' },
    scene: 'sjokolade',
    gradient: ['#6B3A2A', '#FF4D9E'],
  },
  {
    id: 'vinter',
    name: { nb: 'Vinter', sv: 'Vinter' },
    tagline: { nb: 'Snø, ski og skøyter', sv: 'Snö, skidor och skridskor' },
    scene: 'vinter',
    gradient: ['#3FA9D8', '#FF6FB5'],
  },
  {
    id: 'fugler',
    name: { nb: 'Fugler', sv: 'Fåglar' },
    tagline: { nb: 'Vinger, trekk og talende papegøyer', sv: 'Vingar, flyttning och talande papegojor' },
    scene: 'fugler',
    gradient: ['#1E9E7A', '#FF3D9B'],
  },
  {
    id: 'broer',
    name: { nb: 'Broer', sv: 'Broar' },
    tagline: { nb: 'Spenn, sund og seriedrama', sv: 'Spann, sund och seriedrama' },
    scene: 'broer',
    gradient: ['#2B4BE6', '#FF5FA8'],
  },
  {
    id: 'tid',
    name: { nb: 'Tid', sv: 'Tid' },
    tagline: { nb: 'Klokker, kalendere og tidssoner', sv: 'Klockor, kalendrar och tidszoner' },
    scene: 'tid',
    gradient: ['#5B2BE6', '#FF8A3D'],
  },
]

export const CATEGORY_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]))
