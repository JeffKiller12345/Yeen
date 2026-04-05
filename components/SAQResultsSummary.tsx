'use client'
import type { SAQResult } from '@/types'
import { useRouter } from 'next/navigation'

interface Props {
  results: SAQResult[]
  timeTakenSeconds: number
  onScoreOverride?: (questionId: string, overrideCorrect: boolean) => void
}

export default function SAQResultsSummary({ results, timeTakenSeconds, onScoreOverride }: Props) {
  const router = useRouter()
  const totalMarks = results.reduce((a, r) => a + r.question.marks, 0)
  const awardedMarks = results.filter(r => r.awarded).reduce((a, r) => a + r.question.marks, 0)
  const pct = totalMarks > 0 ? Math.round((awardedMarks / totalMarks) * 100) : 0
  const mins = Math.floor(timeTakenSeconds / 60)
  const secs = timeTakenSeconds % 60

  const grade =
    pct >= 80 ? { label: 'YAY ★ EXCELLENT', color: '#2e7d32', bg: '#f1f8e9' } :
    pct >= 50 ? { label: 'KEEP GOING ♡', color: '#e65100', bg: '#fff3e0' } :
    { label: 'NEEDS REVIEW ✿', color: '#c62828', bg: '#ffebee' }

  const byTopic = results.reduce<Record<string, { awarded: number; total: number }>>((acc, r) => {
    const t = r.question.topic
    if (!acc[t]) acc[t] = { awarded: 0, total: 0 }
    acc[t].total += r.question.marks
    if (r.awarded) acc[t].awarded += r.question.marks
    return acc
  }, {})

  return (
    <div className="results-wrapper">
      {/* 1. Score Hero */}
      <div className="score-hero kawaii-panel" style={{ borderColor: grade.color, boxShadow: `6px 6px 0 ${grade.color}` }}>
        <div className="score-badge" style={{ background: grade.bg, border: `2px solid ${grade.color}` }}>
          <span className="pixel-label" style={{ color: grade.color, fontSize: '10px' }}>{grade.label}</span>
        </div>
        <div className="score-number">
          <span className="score-big">{awardedMarks}</span>
          <span className="score-sep">/</span>
          <span className="score-total">{totalMarks}</span>
        </div>
        <div className="score-pct pixel-label" style={{ color: grade.color }}>{pct}% overall proficiency</div>
        <div className="score-time">⏱ Completion Time: {mins}m {String(secs).padStart(2, '0')}s</div>
      </div>

      {/* 2. Topic Breakdown */}
      <div className="breakdown kawaii-panel">
        <p className="pixel-label">✦ PERFORMANCE BY SYSTEM ✦</p>
        <div className="breakdown-list">
          {Object.entries(byTopic).map(([topic, { awarded, total }]) => {
            const topicPct = Math.round((awarded / total) * 100)
            return (
              <div key={topic} className="breakdown-row">
                <span className="breakdown-topic">{topic}</span>
                <div className="breakdown-bar-wrap">
                  <div className="breakdown-bar-fill" style={{
                    width: `${topicPct}%`,
                    background: topicPct >= 80 ? '#81c784' : topicPct >= 50 ? '#ffb74d' : '#ef9a9a'
                  }} />
                </div>
                <span className="breakdown-score">{awarded}/{total}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. Detailed Question Review */}
      <div className="question-review">
        <p className="pixel-label" style={{ marginBottom: '16px', textAlign: 'center' }}>★ DETAILED FEEDBACK ★</p>
        {results.map((r, i) => (
          <div key={r.question.id} className={`review-card kawaii-panel ${r.awarded ? 'pass' : 'fail'}`}>
            <div className="review-header">
              <div className="q-indicator">
                <span className="q-num">Q{i + 1}</span>
                <span className={`status-icon ${r.awarded ? 'correct' : 'incorrect'}`}>
                  {r.awarded ? '✔' : '✘'}
                </span>
              </div>
              <div className="q-text-content">
                <p className="review-q">{r.question.question}</p>
                <div className="marks-override-row">
                  <span className="review-marks-pill">
                    {r.awarded ? r.question.marks : 0} / {r.question.marks} pts
                  </span>
                  {onScoreOverride && (
                    <button
                      className={`override-btn ${r.awarded ? 'override-wrong' : 'override-correct'}`}
                      onClick={() => onScoreOverride(r.question.id, !r.awarded)}
                    >
                      {r.awarded ? '✗ Mark wrong' : '✓ Mark correct'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="answer-comparison">
              <div className="user-ans-box">
                <span className="mini-label">YOUR ANSWER:</span>
                <p className={!r.userAnswer ? 'empty' : ''}>{r.userAnswer || 'No answer provided'}</p>
              </div>
              <div className="correct-ans-box">
                <span className="mini-label">ACCEPTED ANSWERS:</span>
                <div className="ans-chips">
                  {r.question.acceptable_answers.map((ans, idx) => (
                    <span key={idx} className="ans-chip">{ans}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Action Buttons */}
      <div className="result-actions">
        <button className="btn-kawaii" onClick={() => router.push('/dashboard')}>⬅ BACK TO DASHBOARD</button>
        <button className="btn-kawaii green" onClick={() => window.location.reload()}>↺ RETRY SAME TOPICS</button>
      </div>

      <style jsx>{`
        .results-wrapper { display: flex; flex-direction: column; gap: 24px; max-width: 720px; margin: 0 auto; padding-bottom: 40px; }
        .score-hero { text-align: center; padding: 32px; display: flex; flex-direction: column; align-items: center; gap: 8px; background: white; }
        .score-number { display: flex; align-items: baseline; gap: 6px; margin: 8px 0; }
        .score-big { font-family: var(--font-pixel); font-size: 48px; color: var(--pink-dark); }
        .score-total { font-family: var(--font-pixel); font-size: 24px; color: #888; }
        .score-time { font-size: 11px; color: #999; margin-top: 4px; }

        .breakdown-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
        .breakdown-topic { width: 120px; font-size: 11px; font-weight: bold; color: #444; }
        .breakdown-bar-wrap { flex: 1; height: 14px; background: #eee; border: 2px solid #ddd; position: relative; }
        .breakdown-bar-fill { height: 100%; border-right: 2px solid rgba(0,0,0,0.1); }
        .breakdown-score { width: 40px; font-family: var(--font-pixel); font-size: 8px; text-align: right; }

        .review-card { padding: 16px; margin-bottom: 16px; background: white; transition: border-color 0.2s, box-shadow 0.2s; }
        .review-card.fail { border-color: #ef9a9a; box-shadow: 4px 4px 0 #ef9a9a; }
        .review-card.pass { border-color: #81c784; box-shadow: 4px 4px 0 #81c784; }

        .review-header { display: flex; gap: 16px; margin-bottom: 16px; }
        .q-indicator { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .q-num { font-family: var(--font-pixel); font-size: 10px; color: #888; }
        .status-icon { font-size: 20px; }
        .status-icon.correct { color: #4caf50; }
        .status-icon.incorrect { color: #f44336; }

        .review-q { font-size: 14px; font-weight: 600; color: #333; margin: 0 0 6px 0; }

        .marks-override-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .review-marks-pill { font-size: 9px; background: #f5f5f5; padding: 2px 8px; border-radius: 4px; color: #666; }

        .override-btn {
          font-family: var(--font-pixel);
          font-size: 7px;
          padding: 3px 8px;
          border: 1.5px solid #bbb;
          background: white;
          cursor: pointer;
          letter-spacing: 0.05em;
          color: #666;
        }
        .override-btn:hover { border-color: #888; color: #222; }
        .override-btn.override-correct:hover { border-color: #66bb6a; color: #2e7d32; }
        .override-btn.override-wrong:hover { border-color: #ef9a9a; color: #c62828; }

        .answer-comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; border-top: 1px dashed #eee; padding-top: 12px; }
        .mini-label { display: block; font-family: var(--font-pixel); font-size: 6px; color: #999; margin-bottom: 6px; }
        .user-ans-box p { font-size: 13px; color: #555; margin: 0; }
        .user-ans-box p.empty { font-style: italic; color: #bbb; }

        .ans-chips { display: flex; flex-wrap: wrap; gap: 4px; }
        .ans-chip { background: #e8f5e9; color: #2e7d32; font-size: 11px; padding: 2px 8px; border: 1px solid #c8e6c9; border-radius: 2px; }

        .result-actions { display: flex; gap: 12px; justify-content: center; margin-top: 20px; }

        @media (max-width: 600px) {
          .answer-comparison { grid-template-columns: 1fr; }
          .marks-override-row { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  )
}
