/**
 * En D1-kompatibel adapter over `node:sqlite`, så worker-rutene kan testes mot
 * ekte SQL uten miniflare. D1 er SQLite under panseret, så spørringene som går
 * her er de samme som går i produksjon – det var slik feilen med `HAVING total`
 * ble funnet.
 *
 * Krever Node 22.5 eller nyere (`node:sqlite`).
 */
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'

// Vites modulgraf kjenner ikke node:sqlite og forsøker å bundle «sqlite».
// createRequire laster den på kjøretid og går klar av den statiske analysen.
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite')

// Type-only import emitteres ikke, så den går klar av bundleren.
type Db = import('node:sqlite').DatabaseSync

type Param = string | number | null

class FakeStatement {
  constructor(
    private readonly db: Db,
    private readonly sql: string,
    private readonly args: Param[] = [],
  ) {}

  bind(...args: Param[]): FakeStatement {
    return new FakeStatement(this.db, this.sql, args)
  }

  async first<T>(): Promise<T | null> {
    const row = this.db.prepare(this.sql).get(...this.args)
    return (row ?? null) as T | null
  }

  async all<T>(): Promise<{ results: T[]; success: true }> {
    return { results: this.db.prepare(this.sql).all(...this.args) as T[], success: true }
  }

  async run(): Promise<{ success: true; meta: { last_row_id: number } }> {
    const res = this.db.prepare(this.sql).run(...this.args)
    return { success: true, meta: { last_row_id: Number(res.lastInsertRowid ?? 0) } }
  }
}

class FakeD1 {
  constructor(private readonly db: Db) {}

  prepare(sql: string): FakeStatement {
    return new FakeStatement(this.db, sql)
  }

  async batch(statements: FakeStatement[]): Promise<unknown[]> {
    const out: unknown[] = []
    for (const s of statements) out.push(await s.run())
    return out
  }
}

/** Fersk database med skjemaet fra migrations/, klar til bruk i én test. */
export function makeEnv() {
  const db = new DatabaseSync(':memory:')
  // Vitest kjører fra prosjektroten, så skjemaet hentes derfra.
  // Alle migrasjoner i rekkefølge, slik at testene kjører mot samme skjema som
  // produksjon. Legger du til en migrasjon, kommer den med av seg selv.
  for (const file of readdirSync(resolve(process.cwd(), 'migrations')).filter((f) => f.endsWith('.sql')).sort()) {
    db.exec(readFileSync(resolve(process.cwd(), 'migrations', file), 'utf8'))
  }

  return {
    DB: new FakeD1(db) as unknown as D1Database,
    ASSETS: { fetch: async () => new Response('frontend') } as unknown as Fetcher,
    APP_NAME: 'Theme Quiz',
  }
}
