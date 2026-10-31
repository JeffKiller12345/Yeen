'use client'
import { useState } from 'react'
import { clearSeen } from '@/lib/seenTracker'
import type { StudyFeedbackMode, SeenMode } from '@/types'
import { PHASE_CONFIG, type StudentPhase } from '@/lib/phaseConfig'

interface Props {
  examMode: boolean
  onExamModeChange: (v: boolean) => void
  feedbackMode: StudyFeedbackMode
  onFeedbackModeChange: (v: StudyFeedbackMode) => void
  seenMode: SeenMode
  onSeenModeChange: (v: SeenMode) => void
  studentPhase: StudentPhase
  onStudentPhaseChange: (v: StudentPhase) => void
  questionType: 'mcq' | 'saq'
  onQuestionTypeChange: (v: 'mcq' | 'saq') => void
  saqEnabled: boolean
  onSeenReset?: () => void
}

export default function ModeSelector({
  examMode, onExamModeChange, feedbackMode, onFeedbackModeChange,
  seenMode, onSeenModeChange, studentPhase, onStudentPhaseChange,
  questionType, onQuestionTypeChange, saqEnabled, onSeenReset,
}: Props) {
  const [resetState, setResetState] = useState<'idle' | 'confirming' | 'done'>('idle')
  const settings = PHASE_CONFIG[studentPhase].settings
  const stationProgressDeferred = studentPhase === 'phase2b'

  const handleStudentPhaseChange = (phase: StudentPhase) => {
    if (phase === 'phase2b') onSeenModeChange('all')
    onStudentPhaseChange(phase)
  }

  const handleReset = async (type?: 'mcq' | 'saq') => {
    await clearSeen(type)
    setResetState('done')
    onSeenReset?.()
    setTimeout(() => setResetState('idle'), 2000)
  }

  return (
    <div className="mode-selector kawaii-panel">
      <p className="pixel-label">⚙ QUIZ SETTINGS</p>
      <div className="mode-grid">
        <div className="mode-row">
          <div className="mode-info"><span className="mode-name">Exam Mode</span><span className="mode-desc">Global countdown timer</span></div>
          <label className="kawaii-toggle">
            <input type="checkbox" checked={examMode} onChange={e => onExamModeChange(e.target.checked)} />
            <span className="toggle-track"><span className="toggle-thumb" /></span>
          </label>
        </div>
        <div className="mode-row">
          <div className="mode-info"><span className="mode-name">Student Phase</span><span className="mode-desc">Choose your year group</span></div>
          <div className="pill-toggle">
            {(['phase1', 'phase2a', 'phase2b'] as StudentPhase[]).map(phase => (
              <button key={phase} className={`pill ${studentPhase === phase ? 'active' : ''}`} onClick={() => handleStudentPhaseChange(phase)}>{PHASE_CONFIG[phase].label}</button>
            ))}
          </div>
        </div>
        {settings.questionType && <div className="mode-row">
          <div className="mode-info"><span className="mode-name">Question Type</span><span className="mode-desc">SBA or SAQ</span></div>
          <div className="pill-toggle">
            <button className={`pill ${questionType === 'mcq' ? 'active' : ''}`} onClick={() => onQuestionTypeChange('mcq')}>SBA</button>
            <button className={`pill ${questionType === 'saq' ? 'active' : ''}`} onClick={() => onQuestionTypeChange('saq')} disabled={!saqEnabled}>SAQ</button>
          </div>
        </div>}
        {settings.feedbackTiming && <div className="mode-row">
          <div className="mode-info"><span className="mode-name">Feedback Timing</span><span className="mode-desc">When to reveal answers</span></div>
          <div className="pill-toggle">
            {(['immediate', 'end'] as StudyFeedbackMode[]).map(mode => <button key={mode} className={`pill ${feedbackMode === mode ? 'active' : ''}`} onClick={() => onFeedbackModeChange(mode)}>{mode === 'immediate' ? 'Immediate' : 'End only'}</button>)}
          </div>
        </div>}
        {settings.stationPool && <div className="mode-row">
          <div className="mode-info"><span className="mode-name">{studentPhase === 'phase2b' ? 'Station Pool' : 'Question Pool'}</span><span className="mode-desc">Filter by seen status</span></div>
          <div className="pill-toggle">
            {(['all', 'unseen', 'seen'] as SeenMode[]).map(mode => <button key={mode} className={`pill ${seenMode === mode ? 'active' : ''}`} onClick={() => onSeenModeChange(mode)} disabled={stationProgressDeferred && mode !== 'all'}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</button>)}
          </div>
        </div>}
        {settings.resetProgress && <div className="mode-row">
          <div className="mode-info"><span className="mode-name">Reset Progress</span><span className="mode-desc">Clear seen question history</span></div>
          {resetState === 'done' && <span className="reset-done">✓ CLEARED</span>}
          {resetState === 'idle' && <button className="reset-btn" onClick={() => setResetState('confirming')} disabled={stationProgressDeferred}>{stationProgressDeferred ? 'COMING SOON' : 'RESET'}</button>}
          {resetState === 'confirming' && <div className="confirm-row"><span className="confirm-label">RESET:</span><button className="confirm-btn" onClick={() => handleReset('mcq')}>MCQ</button><button className="confirm-btn" onClick={() => handleReset('saq')}>SAQ</button><button className="confirm-btn all" onClick={() => handleReset()}>ALL</button><button className="cancel-btn" onClick={() => setResetState('idle')}>✕</button></div>}
        </div>}
      </div>
      <style>{`
        .mode-selector { margin-bottom: 20px; } .mode-grid { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; } .mode-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; } .mode-info { display: flex; flex-direction: column; gap: 2px; } .mode-name { font-family: var(--font-body); font-weight: 700; font-size: 13px; } .mode-desc { font-family: var(--font-body); font-size: 11px; color: #888; } .kawaii-toggle { position: relative; cursor: pointer; } .kawaii-toggle input { position: absolute; opacity: 0; width: 0; height: 0; } .toggle-track { display: block; width: 44px; height: 22px; background: var(--pink-light); border: 2px solid var(--pink-mid); position: relative; } .kawaii-toggle input:checked + .toggle-track { background: var(--pink-mid); } .toggle-thumb { position: absolute; top: 1px; left: 1px; width: 16px; height: 16px; background: white; border: 1.5px solid var(--pink-mid); } .kawaii-toggle input:checked + .toggle-track .toggle-thumb { transform: translateX(22px); } .pill-toggle { display: flex; border: 2px solid var(--pink-mid); overflow: hidden; } .pill { font-family: var(--font-pixel); font-size: 7px; padding: 6px 10px; background: white; border: none; border-right: 1px solid var(--pink-mid); cursor: pointer; color: #888; } .pill:last-child { border-right: none; } .pill.active { background: var(--pink-mid); color: white; } .pill:hover:not(.active) { background: var(--pink-light); } .pill:disabled { opacity: 0.5; cursor: not-allowed; } .reset-btn { font-family: var(--font-pixel); font-size: 7px; padding: 6px 12px; background: white; border: 2px solid var(--pink-mid); color: var(--pink-dark); cursor: pointer; } .reset-btn:hover { background: var(--pink-light); } .confirm-row { display: flex; align-items: center; gap: 4px; } .confirm-label, .confirm-btn, .cancel-btn, .reset-done { font-family: var(--font-pixel); font-size: 7px; } .confirm-label { color: #c62828; } .confirm-btn { padding: 5px 8px; background: #fce4ec; border: 1.5px solid #f48fb1; color: #c62828; cursor: pointer; } .confirm-btn.all { background: #c62828; color: white; } .cancel-btn { padding: 5px 7px; background: white; border: 1.5px solid #aaa; color: #888; cursor: pointer; } .reset-done { color: #2e7d32; }
      `}</style>
    </div>
  )
}
