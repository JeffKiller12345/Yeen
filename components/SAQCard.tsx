'use client'
import { useState, useEffect } from 'react'
import type { SAQQuestion } from '@/types'

interface Props {
  question: SAQQuestion
  userAnswer: string
  showFeedback: boolean
  onAnswer: (answer: string) => void
  timeExpired?: boolean
  hideContext?: boolean
}

function normalise(str: string): string {
  return str.toLowerCase().trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
}

export function checkAnswer(userAnswer: string, acceptable: string[]): boolean {
  const normUser = normalise(userAnswer)
  if (!normUser) return false

  return acceptable.some(a => {
    const normA = normalise(a)
    if (normUser === normA) return true
    if (normUser.includes(normA) && normA.length > 3) return true
    if (normUser === normA + 's' || normA === normUser + 's') return true
    return false
  })
}

export default function SAQCard({ question, userAnswer, showFeedback, onAnswer, timeExpired, hideContext }: Props) {
  const [localAnswer, setLocalAnswer] = useState(userAnswer)

  useEffect(() => {
    setLocalAnswer(userAnswer)
  }, [userAnswer, question.id])

  const isAwarded = showFeedback ? checkAnswer(userAnswer, question.acceptable_answers) : false
  const hasSubmitted = showFeedback && (userAnswer !== '' || timeExpired)

  return (
    <div className="saq-card">

      {/* 1. Clinical Context — only shown when not hidden by parent */}
      {question.case_context && !hideContext && (
        <div className="scenario-box">
          <span className="box-label">CLINICAL SCENARIO</span>
          <p className="context-text">{question.case_context}</p>
        </div>
      )}

      {/* 2. Question Stem */}
      <div className="stem-box">
        <div className="stem-header">
          <span className="marks-pill">{question.marks} {question.marks === 1 ? 'mark' : 'marks'}</span>
        </div>
        <p className="stem-text">{question.question}</p>
      </div>

      {/* 3. Answer Section */}
      <div className="answer-box">
        <span className="box-label">{hasSubmitted ? 'YOUR SUBMISSION' : 'TYPE YOUR ANSWER'}</span>
        <textarea
          className={`answer-input ${hasSubmitted ? (isAwarded ? 'correct' : 'wrong') : ''}`}
          value={localAnswer}
          onChange={e => setLocalAnswer(e.target.value)}
          disabled={hasSubmitted}
          placeholder="Type your answer here..."
          rows={3}
        />
        {!hasSubmitted && !timeExpired && (
          <button
            className="btn-kawaii"
            style={{ marginTop: '10px', width: '100%' }}
            onClick={() => onAnswer(localAnswer)}
            disabled={!localAnswer.trim()}
          >
            ▶ SUBMIT ANSWER
          </button>
        )}
      </div>

      {/* 4. Feedback Section */}
      {hasSubmitted && (
        <div className={`feedback-box ${isAwarded ? 'correct' : 'wrong'}`}>
          <div className="feedback-header">
            <span className="pixel-label" style={{ fontSize: '7px' }}>
              {isAwarded ? '★ CORRECT' : '✗ REVIEW REQUIRED'}
            </span>
            <span className="marks-result">
              {isAwarded ? question.marks : 0} / {question.marks} marks
            </span>
          </div>

          <div className="acceptable-answers">
            <p className="acceptable-label">Acceptable answers:</p>
            <div className="ans-grid">
              {question.acceptable_answers.map((a, i) => (
                <span key={i} className="ans-tag">{a}</span>
              ))}
            </div>
          </div>

          {question.feedback && (
            <div className="feedback-explanation">
              <p className="feedback-text">{question.feedback}</p>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .saq-card {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* Scenario box — keeps kawaii-panel look for the case context */
        .scenario-box {
          background: white;
          border: 3px solid var(--pink-mid);
          box-shadow: 4px 4px 0 var(--pink-mid);
          padding: 14px 16px 16px;
          position: relative;
        }

        /* Question stem — plain bordered box, no floating label */
        .stem-box {
          background: white;
          border: 2px solid var(--border-px);
          padding: 14px 16px;
        }

        .stem-header {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }

        .marks-pill {
          font-family: var(--font-pixel);
          font-size: 7px;
          background: var(--pink-light);
          border: 1.5px solid var(--pink-mid);
          color: var(--pink-dark);
          padding: 3px 8px;
        }

        .stem-text {
          font-family: var(--font-body);
          font-size: 14px;
          line-height: 1.6;
          color: #222;
          margin: 0;
        }

        .context-text {
          font-family: var(--font-body);
          font-size: 13px;
          line-height: 1.6;
          color: #333;
          margin: 6px 0 0;
        }

        /* Shared label style for box headers */
        .box-label {
          font-family: var(--font-pixel);
          font-size: 7px;
          color: var(--pink-dark);
          letter-spacing: 0.1em;
          display: block;
          margin-bottom: 8px;
        }

        /* Answer box */
        .answer-box {
          background: white;
          border: 2px solid var(--border-px);
          padding: 14px 16px;
        }

        .answer-input {
          width: 100%;
          font-family: var(--font-body);
          font-size: 13px;
          padding: 10px;
          border: 2px solid var(--border-px);
          resize: vertical;
          background: #fafafa;
          color: #222;
          box-sizing: border-box;
          line-height: 1.5;
        }

        .answer-input:focus {
          outline: none;
          border-color: var(--pink-mid);
          background: white;
        }

        .answer-input.correct {
          border-color: #66bb6a;
          background: #f1f8e9;
        }

        .answer-input.wrong {
          border-color: #ef9a9a;
          background: #fff5f5;
        }

        .answer-input:disabled {
          opacity: 0.85;
          cursor: default;
        }

        /* Feedback box */
        .feedback-box {
          border: 2px solid;
          padding: 14px 16px;
        }

        .feedback-box.correct {
          border-color: #66bb6a;
          background: #f1f8e9;
        }

        .feedback-box.wrong {
          border-color: #ef9a9a;
          background: #fff5f5;
        }

        .feedback-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .marks-result {
          font-family: var(--font-pixel);
          font-size: 8px;
          color: #555;
        }

        .acceptable-label {
          font-family: var(--font-pixel);
          font-size: 7px;
          color: #777;
          margin: 0 0 8px;
        }

        .ans-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .ans-tag {
          font-family: var(--font-body);
          font-size: 12px;
          background: white;
          padding: 3px 10px;
          border: 1.5px solid #ccc;
        }

        .feedback-explanation {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px dashed rgba(0,0,0,0.15);
        }

        .feedback-text {
          font-family: var(--font-body);
          font-size: 12px;
          color: #555;
          line-height: 1.6;
          margin: 0;
        }
      `}</style>
    </div>
  )
}
