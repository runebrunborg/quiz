/**
 * Passordhåndtering på klientsiden.
 *
 * Selve nøkkelutledningen gjøres her i nettleseren, ikke i workeren. Grunnen er
 * at Cloudflares gratisplan gir hver forespørsel svært lite CPU-tid, og en
 * forsvarlig PBKDF2 med hundretusenvis av runder ville sprengt den. I stedet
 * gjør nettleseren det tunge arbeidet, og serveren lagrer en saltet SHA-256 av
 * resultatet. En angriper som får tak i databasen må dermed fortsatt kjøre hele
 * PBKDF2-jobben per passordgjetning.
 *
 * Saltet i utledningen er nicknamet, slik at samme passord gir samme nøkkel ved
 * innlogging fra en ny enhet. Serveren legger på sitt eget tilfeldige salt før
 * lagring.
 */

const ITERATIONS = 600_000

export function nicknameKey(nickname: string): string {
  return nickname
    .normalize('NFKC')
    .toLocaleLowerCase('nb-NO')
    .replace(/[\s\-_.]/g, '')
}

export async function derivePasswordKey(nickname: string, password: string): Promise<string> {
  const encoder = new TextEncoder()
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(`theme-quiz|${nicknameKey(nickname)}`),
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    material,
    256,
  )
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Enkel styrkevurdering – vises som veiledning, ikke som sperre utover minstelengden. */
export function passwordStrength(password: string): { score: 0 | 1 | 2 | 3; label: string } {
  let score = 0
  if (password.length >= 10) score++
  if (password.length >= 14) score++
  if (/[^a-zA-Z0-9]/.test(password) || (/[a-zA-Z]/.test(password) && /\d/.test(password))) score++
  const labels = ['For kort', 'Svakt', 'Greit', 'Sterkt']
  return { score: Math.min(score, 3) as 0 | 1 | 2 | 3, label: labels[Math.min(score, 3)] }
}
