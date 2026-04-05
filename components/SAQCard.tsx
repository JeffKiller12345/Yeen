'use client'
import { useState, useEffect } from 'react'
import type { SAQQuestion } from '@/types'

interface Props {
  question: SAQQuestion
  userAnswer: string
  showFeedback: boolean
  onAnswer: (answer: string) => void
  onScoreOverride?: (questionId: string, marksAwarded: number) => void
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
    // Partial match for longer words to catch "The answer is [word]"
    if (normUser.includes(normA) && normA.length > 3) return true
    // Simple pluralization check
    if (normUser === normA + 's' || normA === normUser + 's') return true
    return false
  })
}

export default function SAQCard({ 
  question, 
  userAnswer, 
  showFeedback, 
  onAnswer, 
  onScoreOverride, 
  timeExpired, 
  hideContext 
}: Props) {
  const [localAnswer, setLocalAnswer] = useState(userAnswer)
  const [override, setOverride] = useState<number | null>(null)

  // Reset state when the question changes or a new user answer is provided externally
  useEffect(() => {
    setLocalAnswer(userAnswer)
    setOverride(null)
  }, [userAnswer, question.id])

  const autoMarks = showFeedback
    ? (checkAnswer(userAnswer, question.acceptable_answers) ? question.marks : 0)
    : 0

  const effectiveMarks = override !== null ? override : autoMarks
  const isAwarded = effectiveMarks === question.marks
  const hasSubmitted = showFeedback && (userAnswer !== '' || timeExpired)

  return (
    <div className="saq-card">
      {/* 1. Clinical Context */}
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
            <span className="box-label">
              {isAwarded ? '★ CORRECT' : '✗ REVIEW REQUIRED'}
            </span>
            
            {onScoreOverride && (
              <> {/* Wrap multiple elements in a fragment */}
                <span className="marks-result">{effectiveMarks} / {question.marks} marks</span>
                <div className="mark-picker">
                  <span className="mark-picker-label">OVERRIDE:</span>
                  {Array.from({ length: question.marks + 1 }, (_, i) => i).map(m => (
                    <button
                      key={m}
                      className={`mark-btn ${effectiveMarks === m ? 'active' : ''}`}
                      onClick={() => {
                        setOverride(m)
                        onScoreOverride(question.id, m)
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </>
            )}
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
              <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
              <p className="feedback-text">{question.feedback}</p>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .mark-picker { display: flex; align-items: center; gap: 4px; }
        .mark-picker-label { font-family: var(--font-pixel); font-size: 8px; color: #999; margin-right: 2px; }
        .mark-btn {
          font-family: var(--font-pixel);
          font-size: 10px;
          width: 24px; height: 24px;
          border: 1.5px solid #bbb;
          background: white;
          cursor: pointer;
          color: #666;
          display: flex; align-items: center; justify-content: center;
        }
        .mark-btn:hover { border-color: #888; color: #222; }
        .mark-btn.active { background: #fce4ec; border-color: #f06292; color: #880e4f; }

        .saq-card { display: flex; flex-direction: column; gap: 10px; }
        .scenario-box { background: white; border: 3px solid #f06292; box-shadow: 4px 4px 0 #f06292; padding: 14px 16px 16px; position: relative; }
        .stem-box { background: white; border: 2px solid #ddd; padding: 14px 16px; }
        .marks-pill { font-family: var(--font-pixel); font-size: 8px; background: #fce4ec; border: 1.5px solid #f06292; color: #880e4f; padding: 3px 8px; }
        .box-label { font-family: var(--font-pixel); font-size: 8px; color: #880e4f; letter-spacing: 0.1em; display: block; margin-bottom: 8px; }
        .answer-box { background: white; border: 2px solid #ddd; padding: 14px 16px; }
        .answer-input { width: 100%; font-size: 14px; padding: 10px; border: 2px solid #ddd; box-sizing: border-box; font-family: sans-serif; }
        .answer-input.correct { border-color: #66bb6a; background: #f1f8e9; }
        .answer-input.wrong { border-color: #ef9a9a; background: #fff5f5; }
        .feedback-box { border: 2px solid; padding: 14px 16px; margin-top: 10px; }
        .feedback-box.correct { border-color: #66bb6a; background: #f1f8e9; }
        .feedback-box.wrong { border-color: #ef9a9a; background: #fff5f5; }
        .feedback-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 10px; }
        .ans-grid { display: flex; flex-wrap: wrap; gap: 6px; }
        .ans-tag { font-size: 12px; background: white; padding: 3px 10px; border: 1.5px solid #ccc; border-radius: 4px; }
        .feedback-text { font-style: italic; color: #555; font-size: 13px; }
      `}</style>
    </div>
  )
}
