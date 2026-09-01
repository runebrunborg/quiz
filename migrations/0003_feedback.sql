-- Tommel opp/ned på enkeltspørsmål, med grunn og valgfri kommentar.
-- Én rad per (bruker, spørsmål): stemmer du på nytt, erstattes den gamle.
-- Spørsmålsteksten bor i content/, ikke her – bare id-en lagres, slik at
-- eksporten kan slå opp teksten og rapporten alltid viser gjeldende ordlyd.

CREATE TABLE IF NOT EXISTS question_feedback (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  -- 1 = tommel opp, -1 = tommel ned. Ingen rad = ingen mening.
  vote        INTEGER NOT NULL,
  -- Lukket liste, se shared/types.ts. Bare aktuelt ved tommel ned.
  reason      TEXT,
  -- Valgfri fritekst, høyst 400 tegn. Vises anonymt i oversikten.
  comment     TEXT,
  -- Kopieres fra spørsmålet ved stemmegivning, så oversikten kan filtrere
  -- uten å laste hele banken i workeren.
  category    TEXT NOT NULL DEFAULT '',
  difficulty  TEXT NOT NULL DEFAULT '',
  lang        TEXT NOT NULL DEFAULT 'nb',
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  PRIMARY KEY (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_question ON question_feedback (question_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user     ON question_feedback (user_id);
