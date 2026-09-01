import { useEffect, useState } from 'react'
import type { Difficulty, FeedbackReason, FeedbackVote, Lang, Question } from '../../shared/types'
import { FEEDBACK_COMMENT_MAX, FEEDBACK_REASON_LABELS, FEEDBACK_REASONS } from '../../shared/types'
import { syncFeedback } from '../lib/api'
import { feedbackFor, loadProfile, saveFeedback, type LocalFeedback } from '../lib/storage'
import { ui } from '../lib/ui'

/**
 * Tommel opp/ned på et spørsmål. Tilgjengelig hele tiden – ser du at
 * spørsmålet er dårlig formulert før du har svart, skal du kunne si fra der og
 * da, uten å vente på fasit.
 *
 * Stemmen lagres lokalt med én gang og sendes til serveren i bakgrunnen.
 * Uten konto blir den liggende på enheten til man logger inn, og følger da med
 * kontoen.
 */
interface Props {
  question: Question
  lang: Lang
}

export function QuestionFeedback({ question, lang }: Props) {
  const txt = ui(lang)
  const [saved, setSaved] = useState<LocalFeedback | null>(() => feedbackFor(question.id))
  // Grunn-panelet åpnes bare av et friskt klikk på tommel ned, ikke av en
  // gammel stemme som lastes inn.
  const [panelOpen, setPanelOpen] = useState(false)
  const [comment, setComment] = useState('')
  const hasAccount = Boolean(loadProfile().token)

  useEffect(() => {
    setSaved(feedbackFor(question.id))
    setPanelOpen(false)
    setComment('')
  }, [question.id])

  const vote = saved?.vote ?? null

  function store(next: Partial<LocalFeedback> & { vote: FeedbackVote | null }) {
    const entry: LocalFeedback = {
      questionId: question.id,
      reason: null,
      comment: null,
      category: question.category,
      difficulty: question.difficulty as Difficulty,
      lang,
      ...next,
      updatedAt: Date.now(),
    }
    saveFeedback(entry)
    setSaved(entry)
    void syncFeedback().catch(() => undefined)
  }

  function clickUp() {
    setPanelOpen(false)
    // Andre klikk på samme tommel trekker stemmen tilbake.
    store({ vote: vote === 'opp' ? null : 'opp' })
  }

  function clickDown() {
    if (vote === 'ned') {
      setPanelOpen(false)
      store({ vote: null })
      return
    }
    // Selve stemmen teller med én gang; grunnen er en frivillig presisering.
    store({ vote: 'ned' })
    setComment('')
    setPanelOpen(true)
  }

  function chooseReason(reason: FeedbackReason) {
    const next = saved?.reason === reason ? null : reason
    store({ vote: 'ned', reason: next, comment: saved?.comment ?? null })
  }

  function sendComment() {
    const text = comment.trim().slice(0, FEEDBACK_COMMENT_MAX)
    store({ vote: 'ned', reason: saved?.reason ?? null, comment: text || null })
    setPanelOpen(false)
  }

  return (
    <div className="q-feedback">
      <div className="q-feedback__row">
        <span className="q-feedback__label">{txt.feedbackLabel}</span>
        <button
          type="button"
          className="btn btn--tiny btn--thumb-up"
          aria-pressed={vote === 'opp'}
          aria-label={txt.thumbUp}
          title={txt.thumbUp}
          onClick={clickUp}
        >
          👍
        </button>
        <button
          type="button"
          className="btn btn--tiny btn--thumb-down"
          aria-pressed={vote === 'ned'}
          aria-label={txt.thumbDown}
          title={txt.thumbDown}
          onClick={clickDown}
        >
          👎
        </button>

        {vote !== null && !panelOpen && (
          <span className="q-feedback__note faint">
            {hasAccount ? txt.feedbackThanks : txt.feedbackOffline}
            {vote === 'ned' && (
              <>
                {' · '}
                <button type="button" className="linklike" onClick={() => setPanelOpen(true)}>
                  {txt.feedbackWhy}
                </button>
              </>
            )}
          </span>
        )}
      </div>

      {panelOpen && vote === 'ned' && (
        <div className="q-feedback__panel">
          <p className="q-feedback__label" style={{ marginBottom: 'var(--sp-2)' }}>
            {txt.feedbackWhy}
          </p>
          <div className="q-feedback__reasons">
            {FEEDBACK_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                className="chip"
                aria-pressed={saved?.reason === reason}
                onClick={() => chooseReason(reason)}
              >
                {FEEDBACK_REASON_LABELS[reason][lang]}
              </button>
            ))}
          </div>

          <label className="q-feedback__comment">
            <span className="q-feedback__label">{txt.feedbackComment}</span>
            <textarea
              className="input"
              rows={2}
              maxLength={FEEDBACK_COMMENT_MAX}
              placeholder={txt.feedbackCommentPlaceholder}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </label>

          <div className="row">
            <button type="button" className="btn btn--tiny btn--primary" onClick={sendComment}>
              {txt.feedbackSend}
            </button>
            <button
              type="button"
              className="btn btn--tiny btn--ghost"
              onClick={() => {
                setPanelOpen(false)
                store({ vote: null })
              }}
            >
              {txt.feedbackUndo}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
