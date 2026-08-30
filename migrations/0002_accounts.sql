-- Kontoer med nickname og passord, valgfritt fødselsår og land,
-- flere samtidige innlogginger per bruker, og åpen toppliste.

ALTER TABLE users ADD COLUMN nickname      TEXT;
ALTER TABLE users ADD COLUMN nickname_key  TEXT;
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN password_salt TEXT;
ALTER TABLE users ADD COLUMN birth_year    INTEGER;
ALTER TABLE users ADD COLUMN country       TEXT;

-- Eksisterende kontoer (fra tiden før innlogging) arver navnet sitt som nickname.
UPDATE users
   SET nickname = display_name,
       nickname_key = lower(replace(replace(display_name, ' ', ''), '-', ''))
 WHERE nickname IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_nickname_key ON users (nickname_key);

-- Én rad per innlogget enhet, så man kan være logget inn flere steder
-- og logge ut ett sted uten å ryke ut overalt.
CREATE TABLE IF NOT EXISTS auth_tokens (
  token_hash   TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_user ON auth_tokens (user_id);

-- Ta med de gamle enhetsnøklene, så ingen mister kontoen sin i overgangen.
INSERT OR IGNORE INTO auth_tokens (token_hash, user_id, created_at, last_seen_at)
  SELECT token_hash, id, created_at, created_at FROM users WHERE token_hash IS NOT NULL;
