import { defineConfig } from 'vitest/config'

/**
 * Egen konfigurasjon for testene, holdt utenfor vite.config.ts fordi
 * `vitest/config` og react-pluginen har uenige plugin-typer.
 *
 * Testene trenger ingen JSX-transform – de dekker rene .ts-moduler og
 * worker-rutene. `node:sqlite` må stå som innebygd Node-modul, ellers prøver
 * Vite å bundle «sqlite».
 */
export default defineConfig({
  test: {
    environment: 'node',
    server: { deps: { external: [/^node:sqlite$/] } },
  },
})
