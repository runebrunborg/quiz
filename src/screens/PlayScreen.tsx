import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { AskedQuestion, Difficulty, QuizSession, Region } from '../../shared/types'
import { langForRegion, t } from '../../shared/types'
import { QuestionCard } from '../components/QuestionCard'
import { syncOutbox } from '../lib/api'
import { CATEGORY_BY_ID, pickQuestions, QUESTIONS_PER_ROUND } from '../lib/content'
import { markPlayed } from '../lib/played'
import { queueForSync, saveSession } from '../lib/storage'
import { DIFFICULTY_LABELS, ORIGIN_LABELS, ui } from '../lib/ui'
import { verdictFor } from '../lib/verdicts'
import { CelebrationLayer } from '../themes/celebrations'
import { ThemeMotifField } from '../themes/motifs'
import { ThemeScene } from '../themes/scenes'

const DIFFICULTIES: Difficulty[] = ['lett', 'medium', 'vanskelig']
const REGIONS: Region[] = ['no', 'se', 'int']

export default function PlayScreen() {
  const params = useParams()
  const navigate = useNavigate()

  const category = params.category ?? ''
  const difficulty = (DIFFICULTIES.includes(params.difficulty as Difficulty) ? params.difficulty : 'medium') as Difficulty
  const region = (REGIONS.includes(params.region as Region) ? params.region : 'no') as Region
  const lang = langForRegion(region)
  const txt = ui(lang)

  const meta = CATEGORY_BY_ID.get(category)

  // Én økt per montering. Id-en er også frøet til trekningen, så en runde
  // kan gjenskapes nøyaktig fra id-en alene.
  const [sessionId] = useState(() => crypto.randomUUID())
  const [startedAt] = useState(() => Date.now())
  const questions = useMemo(
    () => pickQuestions(category, difficulty, region, sessionId, QUESTIONS_PER_ROUND),
    [category, difficulty, region, sessionId],
  )

  const [asked, setAsked] = useState<AskedQuestion[]>(() =>
    questions.map((q) => ({
      questionId: q.id,
      hintsUsed: 0,
      usedTextHint: false,
      usedShape: false,
      usedLetters: [],
      verdict: null,
    })),
  )
  const [revealed, setRevealed] = useState(false)
  const [saved, setSaved] = useState(false)
  // Telleren bytter animasjon uten å røre resultatet – frøet er `id|replay`.
  const [replay, setReplay] = useState(0)
  const resultRef = useRef<HTMLDivElement>(null)

  // Resultatet dukker opp nederst på en lang side. Uten dette står brukeren
  // igjen midt i spørsmålslista mens feiringen spilles utenfor synsfeltet.
  useEffect(() => {
    if (saved) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [saved])

  if (!meta || questions.length === 0) {
    return (
      <div className="empty" style={{ marginTop: 'var(--sp-7)' }}>
        Fant ingen spørsmål for dette temaet ennå. <Link to="/">Tilbake til start</Link>
      </div>
    )
  }

  const marked = asked.filter((a) => a.verdict !== null).length
  const correct = asked.filter((a) => a.verdict === 'rett').length
  const hintsUsed = asked.reduce((sum, a) => sum + a.hintsUsed, 0)
  const verdict = verdictFor(category, correct, sessionId)

  function update(index: number, next: AskedQuestion) {
    setAsked((prev) => prev.map((a, i) => (i === index ? next : a)))
  }

  function finish() {
    const session: QuizSession = {
      id: sessionId,
      category,
      difficulty,
      region,
      lang,
      startedAt,
      finishedAt: Date.now(),
      questions: asked,
    }
    saveSession(session)
    markPlayed(session)
    queueForSync(session.id)
    setSaved(true)
    void syncOutbox().catch(() => undefined)
  }

  return (
    <>
      <div className="play-hero">
        <span className="play-hero__scene">
          <ThemeScene scene={meta.scene} />
        </span>
        <span className="play-hero__veil" />
        <p className="eyebrow">{txt.question} 1–{questions.length}</p>
        <h1>{t(meta.name, lang)}</h1>
        <div className="play-hero__meta">
          <span className="pill pill--pink">{DIFFICULTY_LABELS[difficulty]}</span>
          <span className="pill">{`${ORIGIN_LABELS[lang][region]} ${txt.startingPoint}`}</span>
          <span className="pill">{lang === 'sv' ? 'På svenska' : 'På norsk'}</span>
        </div>
      </div>

      <ol className="q-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            index={i}
            question={q}
            asked={asked[i]}
            lang={lang}
            revealed={revealed}
            onChange={(next) => update(i, next)}
          />
        ))}
      </ol>

      {!revealed && (
        <div className="launchbar" style={{ marginTop: 'var(--sp-5)' }}>
          <div className="launchbar__text">
            <strong>{questions.length} {txt.questionsPlural}</strong>
            <br />
            <span className="faint">
              {hintsUsed} {txt.hintsUsed}
            </span>
          </div>
          <button type="button" className="btn btn--primary btn--lg" onClick={() => setRevealed(true)}>
            {txt.showAnswers}
          </button>
        </div>
      )}

      {revealed && !saved && (
        <div className="launchbar" style={{ marginTop: 'var(--sp-5)' }}>
          <div className="launchbar__text">
            <strong className="tabular">
              {marked}/{questions.length}
            </strong>{' '}
            {lang === 'sv' ? 'bedömda' : 'vurdert'}
            <br />
            <span className="faint">
              {lang === 'sv'
                ? 'Markera varje fråga som rätt eller fel för att spara rundan.'
                : 'Marker hvert spørsmål som rett eller galt for å lagre runden.'}
            </span>
          </div>
          <button
            type="button"
            className="btn btn--primary btn--lg"
            disabled={marked < questions.length}
            onClick={finish}
          >
            {txt.finish}
          </button>
        </div>
      )}

      {saved && (
        <div className="result" ref={resultRef} style={{ marginTop: 'var(--sp-6)' }}>
          <span className="result__motif">
            <ThemeMotifField scene={meta.scene} id={sessionId} />
          </span>
          <CelebrationLayer correct={correct} total={questions.length} seed={sessionId} replay={replay} />
          <p className="eyebrow" style={{ marginBottom: 0 }}>
            {t(meta.name, lang)} · {DIFFICULTY_LABELS[difficulty]}
          </p>
          <p className="result__score tabular">
            {correct}
            <span className="result__score-of">{txt.ofTen}</span>
          </p>
          <p className="result__hints">
            {hintsUsed} {txt.hintsUsed}
          </p>
          {verdict && <p className="result__verdict">{t(verdict, lang)}</p>}
          <div className="result__actions">
            <button type="button" className="btn btn--primary" onClick={() => navigate('/')}>
              {txt.playAgain}
            </button>
            <Link className="btn btn--ghost" to="/statistikk">
              {txt.toStats}
            </Link>
          </div>
          <button type="button" className="result__replay" onClick={() => setReplay((n) => n + 1)}>
            {lang === 'sv' ? 'Spela upp igen' : 'Spill av igjen'}
          </button>
        </div>
      )}
    </>
  )
}
