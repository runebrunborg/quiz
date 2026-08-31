import { chromium } from 'playwright'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1180, height: 1200 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto('http://127.0.0.1:4180/banken', { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
await page.screenshot({ path: '/tmp/bank.png', fullPage: true })
// startskjermen to ganger, for å vise at rekkefølgen stokkes
for (const n of [1, 2]) {
  await page.goto('http://127.0.0.1:4180/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await page.screenshot({ path: `/tmp/start-${n}.png`, clip: { x: 200, y: 700, width: 800, height: 500 } })
}
await browser.close()
console.log('konsollfeil:', errors.length ? errors : 'ingen')
