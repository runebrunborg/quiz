#!/usr/bin/env bash
#
# Setter opp Theme Quiz paa Cloudflare: logger inn, oppretter D1-databasen,
# skriver database_id inn i wrangler.jsonc, kjoerer migrasjonen og deployer.
# Trygg aa kjoere flere ganger. Holdt i ren ASCII fordi macOS' bash 3.2
# behandler enkelte flerbyte-tegn som del av variabelnavn.
#
set -euo pipefail
cd "$(dirname "$0")/.."

DB_NAME="theme-quiz"

echo "==> Sjekker Cloudflare-innlogging"
if ! npx --yes wrangler whoami >/dev/null 2>&1; then
  echo "    Ikke innlogget - aapner nettleseren."
  npx --yes wrangler login
fi

echo "==> Sorger for at D1-databasen ${DB_NAME} finnes"
npx --yes wrangler d1 create "${DB_NAME}" >/dev/null 2>&1 || true

DB_ID="$(npx --yes wrangler d1 list --json | DB_NAME="${DB_NAME}" node -e '
let s = "";
process.stdin.on("data", (d) => (s += d)).on("end", () => {
  const start = s.indexOf("[");
  if (start < 0) { console.error("Uventet svar fra wrangler d1 list"); process.exit(1); }
  const list = JSON.parse(s.slice(start));
  const hit = list.find((d) => d.name === process.env.DB_NAME);
  if (!hit) { console.error("Fant ingen database med det navnet."); process.exit(1); }
  process.stdout.write(hit.uuid || hit.database_id || "");
});')"

if [ -z "${DB_ID}" ]; then
  echo "!! Klarte ikke aa lese ut database_id."
  echo "   Kjor 'npx wrangler d1 list' og lim id-en inn i wrangler.jsonc for haand."
  exit 1
fi
echo "    database_id: ${DB_ID}"

echo "==> Skriver id-en inn i wrangler.jsonc"
DB_ID="${DB_ID}" node -e '
const fs = require("fs");
const path = "wrangler.jsonc";
const id = process.env.DB_ID;
const before = fs.readFileSync(path, "utf8");
const after = before.replace(/"database_id":\s*"[^"]*"/, "\"database_id\": \"" + id + "\"");
if (after === before && !before.includes(id)) {
  console.error("Klarte ikke aa sette database_id automatisk - gjor det for haand.");
  process.exit(1);
}
fs.writeFileSync(path, after);
'

echo "==> Kjorer migrasjonen mot Cloudflare"
npx --yes wrangler d1 migrations apply "${DB_NAME}" --remote

echo "==> Bygger"
npm run build

echo "==> Deployer"
npx --yes wrangler deploy

echo
echo "Ferdig. Adressen staar i linjen over (Deployed theme-quiz ...)."
echo "Eget domene: Cloudflare-dashbordet -> Workers & Pages -> theme-quiz"
echo "-> Settings -> Domains & Routes -> Add custom domain."
