import { useState } from 'react'
import type { AskedQuestion, Lang, Question } from '../../shared/types'
import { t } from '../../shared/types'
import { promptFor } from '../../shared/questions'
import { answerShape, hintCount, letterOptions, revealLetter, type LetterChoice } from '../lib/hints'
import { QuestionFeedback } from './QuestionFeedback'
import { ui } from '../lib/ui'

interface Props {
  index: number
  question: Question
  asked: AskedQuestion
  lang: Lang
  revealed: boolean
  onChange: (next: AskedQuestion) => void
}

export function QuestionCard({ index, question, asked, lang, revealed, onChange }: Props) {
  const [funFactOpen, setFunFactOpen] = useState(false)
  const txt = ui(lang)
  const options = letterOptions(question)

  const usedLetters = asked.usedLetters ?? []

  /** Hvert hint er uavhengig – vi setter bare sitt eget flagg og teller opp på nytt. */
  const apply = (patch: Partial<AskedQuestion>) => {
    const next = { ...asked, ...patch }
    onChange({ ...next, hintsUsed: hintCount(next) })
  }

  const showHint = () => apply({ usedTextHint: true })
  const showShape = () => apply({ usedShape: true })
  const showLetter = (choice: LetterChoice) => apply({ usedLetters: [...usedLetters, choice] })

  const letterLabel = (choice: LetterChoice) =>
    choice === 'given' ? txt.firstLetterGiven : choice === 'family' ? txt.firstLetterFamily : txt.firstLetter

  return (
    <li
      className={`q-card${revealed && asked.verdict ? ` q-card--${asked.verdict}` : ''}`}
      aria-label={`${txt.question} ${index + 1}`}
    >
      <div className="q-card__top">
        <span className="q-num" aria-hidden="true">
          {index + 1}
        </span>
        {/* Treffer dagens dato en «på denne dag»-variant, er det den som vises. */}
        <p className="q-prompt">{promptFor(question, lang)}</p>
      </div>

      {!revealed && (
        <div className="q-actions">
          <button type="button" className="btn btn--tiny" onClick={showHint} disabled={asked.usedTextHint}>
            💡 {txt.showHint}
          </button>
          {options.map((choice) => (
            <button
              key={choice}
              type="button"
              className="btn btn--tiny"
              onClick={() => showLetter(choice)}
              disabled={usedLetters.includes(choice)}
            >
              🔤 {letterLabel(choice)}
            </button>
          ))}
          <button type="button" className="btn btn--tiny" onClick={showShape} disabled={asked.usedShape}>
            🔢 {txt.letterCount}
          </button>
        </div>
      )}

      {asked.usedTextHint && (
        <p className="q-hint">
          <strong>{txt.hint}:</strong> {t(question.hint, lang)}
        </p>
      )}

      {options
        .filter((choice) => usedLetters.includes(choice))
        .map((choice) => (
          <p
            key={choice}
            className="q-hint"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}
          >
            <span className="letter-chip">{revealLetter(question, lang, choice)}</span>
            <strong>{letterLabel(choice)}</strong>
          </p>
        ))}

      {asked.usedShape && (
        <p className="q-hint" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <strong>{txt.letterCount}:</strong>
          <span className="faint" style={{ letterSpacing: '0.14em' }}>
            {answerShape(question, lang)}
          </span>
        </p>
      )}

      {revealed && (
        <>
          <div className="q-answer">
            <span className="q-answer__label">{txt.answer}</span>
            <span className="q-answer__text">{t(question.answer, lang)}</span>

            <div className="funfact">
              <button
                type="button"
                className="funfact__toggle"
                aria-expanded={funFactOpen}
                onClick={() => setFunFactOpen((v) => !v)}
              >
                <span className="funfact__caret" aria-hidden="true">
                  ▸
                </span>
                {txt.funFact}
              </button>
              {funFactOpen && (
                <div className="funfact__body">
                  <p>{t(question.funFact, lang)}</p>
                  <p className="funfact__source">
                    {txt.source}: {question.source}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="q-verdict">
            <span className="q-verdict__label">{txt.scoreLabel}</span>
            <button
              type="button"
              className="btn btn--tiny btn--verdict-ok"
              aria-pressed={asked.verdict === 'rett'}
              onClick={() => onChange({ ...asked, verdict: 'rett' })}
            >
              ✓ {txt.right}
            </button>
            <button
              type="button"
              className="btn btn--tiny btn--verdict-bad"
              aria-pressed={asked.verdict === 'galt'}
              onClick={() => onChange({ ...asked, verdict: 'galt' })}
            >
              ✕ {txt.wrong}
            </button>
          </div>
        </>
      )}

      <QuestionFeedback question={question} lang={lang} />
    </li>
  )
}
