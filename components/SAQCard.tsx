'use client'
import { useState, useEffect } from 'react'
import type { SAQQuestion } from '@/types'

interface Props {
  question: SAQQuestion
  userAnswer: string
  showFeedback: boolean
  onAnswer: (answer: string) => void
  timeExpired?: boolean
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
    
    // 1. Exact match (High confidence)
    if (normUser === normA) return true
    
    // 2. User provided a longer answer that contains the key term
    // e.g., "The answer is insulin" vs "insulin"
    if (normUser.includes(normA) && normA.length > 3) return true
    
    // 3. Simple pluralisation check (very basic)
    if (normUser === normA + 's' || normA === normUser + 's') return true

    return false
  })
}

export default function SAQCard({ question, userAnswer, showFeedback, onAnswer, timeExpired }: Props) {
  // Fix: Sync local state when the prop changes (e.g., clicking 'Prev' or 'Next')
  const [localAnswer, setLocalAnswer] = useState(userAnswer)

  useEffect(() => {
    setLocalAnswer(userAnswer)
  }, [userAnswer, question.id])

  const isAwarded = showFeedback ? checkAnswer(userAnswer, question.acceptable_answers) : false
  const hasSubmitted = showFeedback && (userAnswer !== '' || timeExpired)

  return (
    <div className="saq-card">
      {/* 1. Clinical Context (Scenario) */}
      {question.case_context && (
        <div className="case-context kawaii-panel">
          <span className="pixel-label" style={{ fontSize: '7px', marginBottom: '8px', display: 'block' }}>
            CLINICAL SCENARIO
          </span>
          <p className="context-text">{question.case_context}</p>
        </div>
      )}

      {/* 2. Question Stem */}
      <div className="question-stem kawaii-panel">
        <div className="marks-badge">
          {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
        </div>
        <p className="stem-text">{question.question}</p>
      </div>

      {/* 3. Answer Section */}
      <div className="answer-section">
        <span className="pixel-label" style={{ fontSize: '7px', marginBottom: '8px', display: 'block' }}>
          {hasSubmitted ? 'YOUR SUBMISSION' : 'TYPE YOUR ANSWER'}
        </span>
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
        <div className={`saq-feedback ${isAwarded ? 'correct' : 'wrong'}`}>
          <div className="feedback-header">
            <span className="pixel-label" style={{ fontSize: '7px' }}>
              {isAwarded ? '★ CORRECT' : '✗ REVIEW REQUIRED'}
            </span>
            <span className="marks-label">
              {isAwarded ? question.marks : 0} / {question.marks} Marks
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
        /* ... existing styles ... */
        .ans-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
        .ans-tag { 
          font-size: 11px; 
          background: white; 
          padding: 2px 8px; 
          border: 1px solid #ccc; 
          border-radius: 4px;
        }
        .feedback-explanation {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px dashed rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  )
}