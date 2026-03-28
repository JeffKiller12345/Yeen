'use client'
import type { StudyFeedbackMode, SeenMode } from '@/types'

interface Props {
  examMode: boolean
  onExamModeChange: (v: boolean) => void
  feedbackMode: StudyFeedbackMode
  onFeedbackModeChange: (v: StudyFeedbackMode) => void
  seenMode: SeenMode
  onSeenModeChange: (v: SeenMode) => void
  questionType: 'mcq' | 'saq'
  onQuestionTypeChange: (v: 'mcq' | 'saq') => void
}

export default function ModeSelector({
  examMode, onExamModeChange,
  feedbackMode, onFeedbackModeChange,
  seenMode, onSeenModeChange,
  questionType, onQuestionTypeChange, // 1. Added these two here!
}: Props) {
  return (
    <div className="mode-selector kawaii-panel">
      <p className="pixel-label">⚙ QUIZ SETTINGS</p>

      <div className="mode-grid">
        {/* Exam mode toggle */}
        <div className="mode-row">
          <div className="mode-info">
            <span className="mode-name">Exam Mode</span>
            <span className="mode-desc">1.2 min per question timer</span>
          </div>
          <label className="kawaii-toggle">
            <input
              type="checkbox"
              checked={examMode}
              onChange={e => onExamModeChange(e.target.checked)}
            />
            <span className="toggle-track">
              <span className="toggle-thumb" />
            </span>
          </label>
        </div>

        {/* 2. Fixed the function names below to match the props */}
        <div className="mode-row">
          <div className="mode-info">
            <span className="mode-name">Question Type</span>
            <span className="mode-desc">MCQ or Short Answer</span>
          </div>
          <div className="pill-toggle">
            <button
              className={`pill ${questionType === 'mcq' ? 'active' : ''}`}
              onClick={() => onQuestionTypeChange('mcq')}
            >
              MCQ
            </button>
            <button
              className={`pill ${questionType === 'saq' ? 'active' : ''}`}
              onClick={() => onQuestionTypeChange('saq')}
            >
              SAQ
            </button>
          </div>
        </div>

        {/* Feedback timing */}
        <div className="mode-row">
          <div className="mode-info">
            <span className="mode-name">Feedback Timing</span>
            <span className="mode-desc">When to reveal answers</span>
          </div>
          <div className="pill-toggle">
            <button
              className={`pill ${feedbackMode === 'immediate' ? 'active' : ''}`}
              onClick={() => onFeedbackModeChange('immediate')}
            >
              Immediate
            </button>
            <button
              className={`pill ${feedbackMode === 'end' ? 'active' : ''}`}
              onClick={() => onFeedbackModeChange('end')}
            >
              End only
            </button>
          </div>
        </div>

        {/* Seen filter */}
        <div className="mode-row">
          <div className="mode-info">
            <span className="mode-name">Question Pool</span>
            <span className="mode-desc">Filter by seen status</span>
          </div>
          <div className="pill-toggle">
            {(['all', 'unseen', 'seen'] as SeenMode[]).map(m => (
              <button
                key={m}
                className={`pill ${seenMode === m ? 'active' : ''}`}
                onClick={() => onSeenModeChange(m)}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Styles remain the same */}
      <style jsx>{`
        .mode-selector { margin-bottom: 20px; }

        .mode-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 12px;
        }

        .mode-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .mode-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .mode-name {
          font-family: var(--font-body);
          font-weight: 700;
          font-size: 13px;
        }

        .mode-desc {
          font-family: var(--font-body);
          font-size: 11px;
          color: #888;
        }

        /* Kawaii toggle switch */
        .kawaii-toggle { position: relative; cursor: pointer; }
        .kawaii-toggle input { position: absolute; opacity: 0; width: 0; height: 0; }

        .toggle-track {
          display: block;
          width: 44px;
          height: 22px;
          background: var(--pink-light);
          border: 2px solid var(--pink-mid);
          position: relative;
          transition: background 0.2s;
        }

        .kawaii-toggle input:checked + .toggle-track {
          background: var(--pink-mid);
        }

        .toggle-thumb {
          position: absolute;
          top: 1px;
          left: 1px;
          width: 16px;
          height: 16px;
          background: white;
          border: 1.5px solid var(--pink-mid);
          transition: transform 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
        }

        .kawaii-toggle input:checked + .toggle-track .toggle-thumb {
          transform: translateX(22px);
        }

        /* Pill toggle */
        .pill-toggle {
          display: flex;
          border: 2px solid var(--pink-mid);
          overflow: hidden;
        }

        .pill {
          font-family: var(--font-pixel);
          font-size: 7px;
          padding: 6px 10px;
          background: white;
          border: none;
          border-right: 1px solid var(--pink-mid);
          cursor: pointer;
          color: #888;
          transition: all 0.15s;
        }

        .pill:last-child { border-right: none; }

        .pill.active {
          background: var(--pink-mid);
          color: white;
        }

        .pill:hover:not(.active) { background: var(--pink-light); }
      `}</style>
    </div>
  )
}