-- LinnieQuiz – grunnskjema for D1.
-- Kjør: npx wrangler d1 migrations apply theme-quiz --local (eller --remote)

CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  friend_code  TEXT NOT NULL UNIQUE,
  token_hash   TEXT NOT NULL UNIQUE,
  created_at   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,
  difficulty  TEXT NOT NULL,
  region      TEXT NOT NULL,
  started_at  INTEGER NOT NULL,
  finished_at INTEGER NOT NULL,
  iso_day     TEXT NOT NULL,
  iso_week    TEXT NOT NULL,
  correct     INTEGER NOT NULL,
  total       INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_week ON sessions (user_id, iso_week);
CREATE INDEX IF NOT EXISTS idx_sessions_user_day  ON sessions (user_id, iso_day);

CREATE TABLE IF NOT EXISTS answers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,
  question_id TEXT NOT NULL,
  correct     INTEGER NOT NULL,
  hints_used  INTEGER NOT NULL DEFAULT 0,
  iso_week    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_answers_session ON answers (session_id);
CREATE INDEX IF NOT EXISTS idx_answers_user    ON answers (user_id);

-- Skjulte emne-tags, én rad per (svar, tag). Gir enkel GROUP BY i statistikken.
CREATE TABLE IF NOT EXISTS answer_topics (
  answer_id INTEGER NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
  user_id   TEXT NOT NULL,
  topic     TEXT NOT NULL,
  correct   INTEGER NOT NULL,
  iso_week  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_answer_topics_user ON answer_topics (user_id, topic);

CREATE TABLE IF NOT EXISTS friends (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, friend_id)
);
