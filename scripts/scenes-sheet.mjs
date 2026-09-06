/**
 * Kontaktark for temascenene.
 *
 * Tegner alle scenene som temakort – med tittel og det samme mørke sløret som
 * startskjermen legger over – og skriver dem til `sheet.html`. Åpne fila i
 * nettleseren: animasjonene går der, så du ser både komposisjonen og
 * bevegelsen. Reglene står i `src/themes/SCENES.md`.
 *
 * Kjør: npm run scenes:sheet
 */
import { writeFileSync, readFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { build } from 'esbuild'

// Både inn- og utfila må ligge inne i prosjektet, ellers finner ikke esbuild
// `react` og `react-dom` – node-oppslaget starter der fila står.
const tmp = join(process.cwd(), 'node_modules', '.scenes-sheet')
mkdirSync(tmp, { recursive: true })
const entry = join(tmp, 'entry.tsx')
const out = join(tmp, 'out.cjs')

writeFileSync(
  entry,
  `import { renderToStaticMarkup } from 'react-dom/server'
   import { createElement } from 'react'
   import { ThemeScene, SCENE_IDS } from ${JSON.stringify(join(process.cwd(), 'src/themes/scenes.tsx'))}
   export const tiles = SCENE_IDS.map((id) => [id, renderToStaticMarkup(createElement(ThemeScene, { scene: id }))])
  `,
)

await build({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  jsx: 'automatic',
  outfile: out,
  logLevel: 'error',
})

const { tiles } = await import(`file://${out}`)
const css = readFileSync('src/styles/scenes.css', 'utf8')

const cards = tiles
  .map(
    ([id, svg]) =>
      `<figure class="card"><span class="scene">${svg}</span><span class="veil"></span><b>${id}</b></figure>`,
  )
  .join('\n')

writeFileSync(
  'sheet.html',
  `<!doctype html><meta charset="utf-8"><title>Temascenene</title><style>
${css}
body{margin:0;background:#05081e;font-family:system-ui,sans-serif;padding:20px;color:#fff}
h1{font-size:15px;font-weight:600;opacity:.6;margin:0 0 16px;letter-spacing:.04em;text-transform:uppercase}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
.card{position:relative;isolation:isolate;overflow:hidden;border-radius:14px;border:1px solid rgba(255,255,255,.12);
  min-height:172px;display:flex;flex-direction:column;justify-content:flex-end;padding:20px;margin:0;background:#0b1030}
.scene{position:absolute;inset:0;z-index:-2}.scene svg{width:100%;height:100%;display:block}
.veil{position:absolute;inset:0;z-index:-1;background:linear-gradient(to top,rgba(5,8,30,.95) 8%,rgba(5,8,30,.55) 48%,rgba(5,8,30,.1) 100%)}
b{font-size:24px;font-weight:800;letter-spacing:-.03em}
</style><h1>${tiles.length} temascener</h1><div class="grid">${cards}</div>`,
)

rmSync(tmp, { recursive: true, force: true })
console.log(`sheet.html – ${tiles.length} scener. Åpne den i nettleseren.`)
