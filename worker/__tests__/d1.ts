/**
 * En D1-kompatibel adapter over `node:sqlite`, så worker-rutene kan testes mot
 * ekte SQL uten miniflare. D1 er SQLite under panseret, så spørringene som går
 * her er de samme som går i produksjon – det var slik feilen med `HAVING total`
 * ble funnet.
 *
 * Krever Node 22.5 eller nyere (`node:sqlite`).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

type Param = string | number | null

class FakeStatement {
  constructor(
    private readonly db: DatabaseSync,
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
  constructor(private readonly db: DatabaseSync) {}

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
  db.exec(readFileSync(resolve(process.cwd(), 'migrations/0001_init.sql'), 'utf8'))

  return {
    DB: new FakeD1(db) as unknown as D1Database,
    ASSETS: { fetch: async () => new Response('frontend') } as unknown as Fetcher,
    APP_NAME: 'Theme Quiz',
  }
}
