'use client'
import type { Question, AnswerOption } from '@/types'

interface Props {
  question: Question
  chosen: AnswerOption | null
  showFeedback: boolean          // true = study immediate mode
  onAnswer: (option: AnswerOption) => void
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'] as AnswerOption[]

export default function QuizCard({ question, chosen, showFeedback, onAnswer }: Props) {
  const getOptionState = (letter: AnswerOption) => {
    if (!chosen || !showFeedback) {
      return chosen === letter ? 'selected' : 'default'
    }
    if (letter === question.correct_answer) return 'correct'
    if (letter === chosen && chosen !== question.correct_answer) return 'wrong'
    return 'default'
  }

  return (
    <div className="quiz-card">
      {/* Topic breadcrumb */}
      <div className="breadcrumb">
        <span className="pixel-label" style={{ fontSize: '7px', color: '#aaa' }}>
          {question.topic} › {question.subtopic}
        </span>
      </div>

      {/* Question stem */}
      <div className="question-stem kawaii-panel">
        <p className="stem-text">{question.question}</p>
      </div>

      {/* Options */}
      <div className="options-list">
        {OPTION_LABELS.map(letter => {
          const state = getOptionState(letter)
          return (
            <button
              key={letter}
              className={`option-btn option-${state}`}
              onClick={() => !chosen && onAnswer(letter)}
              disabled={!!chosen}
            >
              <span className="option-letter">{letter}</span>
              <span className="option-text">{question.options[letter]}</span>
              {showFeedback && chosen && letter === question.correct_answer && (
                <span className="option-tick">✓</span>
              )}
              {showFeedback && chosen === letter && letter !== question.correct_answer && (
                <span className="option-cross">✗</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Feedback panel — only shown when answered in study mode */}
      {showFeedback && chosen && (
        <div className={`feedback-panel ${chosen === question.correct_answer ? 'correct' : 'wrong'}`}>
          <div className="feedback-header">
            <span className="pixel-label" style={{ fontSize: '7px' }}>
              {chosen === question.correct_answer ? '★ CORRECT ★' : '✗ INCORRECT'}
            </span>
            <span className="correct-answer-label">
              Answer: <strong>{question.correct_answer}</strong>
            </span>
          </div>
          <p className="feedback-text">{question.feedback}</p>
        </div>
      )}

      <style jsx>{`
        .quiz-card { display: flex; flex-direction: column; gap: 16px; }

        .breadcrumb { margin-bottom: -8px; }

        .question-stem {
          background: var(--cream);
          border-color: var(--green-mid);
          box-shadow: 3px 3px 0 var(--green-mid);
        }

        .stem-text {
          font-family: var(--font-body);
          font-size: 15px;
          line-height: 1.7;
          margin: 0;
          color: #222;
        }

        .options-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .option-btn {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          width: 100%;
          text-align: left;
          padding: 12px 16px;
          background: white;
          border: 2px solid var(--border-px);
          cursor: pointer;
          box-shadow: 3px 3px 0 var(--border-px);
          transition: all 0.1s;
          font-family: var(--font-body);
          font-size: 14px;
          line-height: 1.5;
        }

        .option-btn:hover:not(:disabled) {
          border-color: var(--pink-mid);
          box-shadow: 3px 3px 0 var(--pink-mid);
          background: var(--pink-light);
          transform: translate(-1px, -1px);
        }

        .option-btn:active:not(:disabled) {
          transform: translate(2px, 2px);
          box-shadow: none;
        }

        .option-btn:disabled { cursor: default; }

        .option-letter {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--pink-light);
          border: 1.5px solid var(--pink-mid);
          font-family: var(--font-pixel);
          font-size: 8px;
          color: var(--pink-dark);
        }

        .option-text { flex: 1; }

        .option-tick  { margin-left: auto; color: #2e7d32; font-size: 18px; font-weight: bold; }
        .option-cross { margin-left: auto; color: #c62828; font-size: 18px; font-weight: bold; }

        /* State variants */
        .option-selected {
          border-color: var(--pink-mid);
          box-shadow: 3px 3px 0 var(--pink-mid);
          background: var(--pink-light);
        }

        .option-correct {
          border-color: #66bb6a;
          box-shadow: 3px 3px 0 #66bb6a;
          background: #f1f8e9;
        }

        .option-correct .option-letter {
          background: #c8e6c9;
          border-color: #66bb6a;
          color: #1b5e20;
        }

        .option-wrong {
          border-color: #ef9a9a;
          box-shadow: 3px 3px 0 #ef9a9a;
          background: #ffebee;
        }

        .option-wrong .option-letter {
          background: #ffcdd2;
          border-color: #ef9a9a;
          color: #b71c1c;
        }

        /* Feedback panel */
        .feedback-panel {
          padding: 16px;
          border: 2px solid;
          margin-top: 4px;
        }

        .feedback-panel.correct {
          border-color: #66bb6a;
          background: #f1f8e9;
          box-shadow: 3px 3px 0 #66bb6a;
        }

        .feedback-panel.wrong {
          border-color: #ef9a9a;
          background: #ffebee;
          box-shadow: 3px 3px 0 #ef9a9a;
        }

        .feedback-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .correct-answer-label {
          font-family: var(--font-body);
          font-size: 12px;
          color: #555;
        }

        .feedback-text {
          font-family: var(--font-body);
          font-size: 13px;
          line-height: 1.7;
          color: #333;
          margin: 0;
        }
      `}</style>
    </div>
  )
}