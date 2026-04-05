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
    if (normUser.includes(normA) && normA.length > 3) return true
    if (normUser === normA + 's' || normA === normUser + 's') return true
    return false
  })
}

export default function SAQCard({ question, userAnswer, showFeedback, onAnswer, onScoreOverride, timeExpired, hideContext }: Props) {
  const [localAnswer, setLocalAnswer] = useState(userAnswer)
  // Changed to number | null to match marksAwarded
  const [override, setOverride] = useState<number | null>(null) 

  useEffect(() => {
    setLocalAnswer(userAnswer)
    setOverride(null) 
  }, [userAnswer, question.id])

  const autoAwarded = showFeedback ? checkAnswer(userAnswer, question.acceptable_answers) : false
  
  // Logic: Use override if present, otherwise use full marks if auto-correct, or 0 if wrong.
  const currentScore = override !== null ? override : (autoAwarded ? question.marks : 0)
  const isAwarded = currentScore > 0 
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
              <div className="mark-picker">
                <span className="mark-picker-label">OVERRIDE:</span>
                {Array.from({ length: question.marks + 1 }, (_, i) => i).map(m => (
                  <button
                    key={m}
                    className={`mark-btn ${currentScore === m ? 'active' : ''}`}
                    onClick={() => {
                      setOverride(m)
                      onScoreOverride(question.id, m)
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
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
              <p className="feedback-text">{question.feedback}</p>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        /* ... keeping your existing styles ... */
        
        .mark-picker {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .mark-picker-label {
          font-family: var(--font-pixel);
          font-size: 7px;
          margin-right: 4px;
        }

        .mark-btn {
          font-family: var(--font-pixel);
          font-size: 8px;
          padding: 2px 6px;
          border: 1px solid #ccc;
          background: white;
          cursor: pointer;
        }

        .mark-btn.active {
          background: var(--pink-mid);
          color: white;
          border-color: var(--pink-dark);
        }

        /* Existing styles continue below */
        .saq-card { display: flex; flex-direction: column; gap: 10px; }
        .scenario-box { background: white; border: 3px solid var(--pink-mid); box-shadow: 4px 4px 0 var(--pink-mid); padding: 14px 16px 16px; position: relative; }
        .stem-box { background: white; border: 2px solid #ddd; padding: 14px 16px; }
        .marks-pill { font-family: var(--font-pixel); font-size: 7px; background: var(--pink-light); border: 1.5px solid var(--pink-mid); color: var(--pink-dark); padding: 3px 8px; }
        .box-label { font-family: var(--font-pixel); font-size: 7px; color: var(--pink-dark); letter-spacing: 0.1em; display: block; margin-bottom: 8px; }
        .answer-box { background: white; border: 2px solid #ddd; padding: 14px 16px; }
        .answer-input { width: 100%; font-size: 13px; padding: 10px; border: 2px solid #ddd; box-sizing: border-box; }
        .answer-input.correct { border-color: #66bb6a; background: #f1f8e9; }
        .answer-input.wrong { border-color: #ef9a9a; background: #fff5f5; }
        .feedback-box { border: 2px solid; padding: 14px 16px; }
        .feedback-box.correct { border-color: #66bb6a; background: #f1f8e9; }
        .feedback-box.wrong { border-color: #ef9a9a; background: #fff5f5; }
        .feedback-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .ans-grid { display: flex; flex-wrap: wrap; gap: 6px; }
        .ans-tag { font-size: 12px; background: white; padding: 3px 10px; border: 1.5px solid #ccc; }
      `}</style>
    </div>
  )
}
