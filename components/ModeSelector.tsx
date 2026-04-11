'use client'
import { useState } from 'react'
import { clearSeen } from '@/lib/seenTracker' 
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
  onSeenReset?: () => void
}

export default function ModeSelector({
  examMode, onExamModeChange,
  feedbackMode, onFeedbackModeChange,
  seenMode, onSeenModeChange,
  questionType, onQuestionTypeChange,
  onSeenReset,
}: Props) {
  const [resetState, setResetState] = useState<'idle' | 'confirming' | 'done'>('idle')

  const handleReset = async (type?: 'mcq' | 'saq') => {
    await clearSeen(type)
    setResetState('done')
    onSeenReset?.()  // tell parent to refresh counts
    setTimeout(() => setResetState('idle'), 2000)
  }
  return (
    <div className="mode-selector kawaii-panel">
      <p className="pixel-label">⚙ QUIZ SETTINGS</p>

      <div className="mode-grid">
        {/* Exam mode toggle */}
        <div className="mode-row">
          <div className="mode-info">
            <span className="mode-name">Exam Mode</span>
            <span className="mode-desc">Global countdown timer</span>
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
            <span className="mode-desc">SBA or SAQ</span>
          </div>
          <div className="pill-toggle">
            <button
              className={`pill ${questionType === 'mcq' ? 'active' : ''}`}
              onClick={() => onQuestionTypeChange('mcq')}
            >
              SBA
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

<div className="mode-row">
          <div className="mode-info">
            <span className="mode-name">Reset Progress</span>
            <span className="mode-desc">Clear seen question history</span>
          </div>

          {resetState === 'done' && (
            <span className="reset-done">✓ CLEARED</span>
          )}

          {resetState === 'idle' && (
            <button className="reset-btn" onClick={() => setResetState('confirming')}>
              RESET
            </button>
          )}

          {resetState === 'confirming' && (
            <div className="confirm-row">
              <span className="confirm-label">RESET:</span>
              <button className="confirm-btn" onClick={() => handleReset('mcq')}>MCQ</button>
              <button className="confirm-btn" onClick={() => handleReset('saq')}>SAQ</button>
              <button className="confirm-btn all" onClick={() => handleReset()}>ALL</button>
              <button className="cancel-btn" onClick={() => setResetState('idle')}>✕</button>
            </div>
          )}
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

        .reset-btn {
          font-family: var(--font-pixel);
          font-size: 7px;
          padding: 6px 12px;
          background: white;
          border: 2px solid var(--pink-mid);
          color: var(--pink-dark);
          cursor: pointer;
          transition: all 0.15s;
        }
        .reset-btn:hover { background: var(--pink-light); }

        .confirm-row {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .confirm-label {
          font-family: var(--font-pixel);
          font-size: 7px;
          color: #c62828;
        }
        .confirm-btn {
          font-family: var(--font-pixel);
          font-size: 7px;
          padding: 5px 8px;
          background: #fce4ec;
          border: 1.5px solid #f48fb1;
          color: #c62828;
          cursor: pointer;
          transition: all 0.15s;
        }
        .confirm-btn:hover { background: #c62828; color: white; }
        .confirm-btn.all { background: #c62828; color: white; }
        .confirm-btn.all:hover { background: #7f0000; }
        .cancel-btn {
          font-family: var(--font-pixel);
          font-size: 7px;
          padding: 5px 7px;
          background: white;
          border: 1.5px solid #aaa;
          color: #888;
          cursor: pointer;
        }
        .cancel-btn:hover { background: #eee; }

        .reset-done {
          font-family: var(--font-pixel);
          font-size: 7px;
          color: #2e7d32;
        }
      `}</style>
    </div>
  )
}
