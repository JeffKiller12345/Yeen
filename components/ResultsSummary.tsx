'use client'
import type { QuizResult } from '@/types'
import { useRouter } from 'next/navigation'

interface Props {
  results: QuizResult[]
  timeTakenSeconds: number
  onReviewFlagged: () => void
}

export default function ResultsSummary({ results, timeTakenSeconds, onReviewFlagged }: Props) {
  const router = useRouter()
  const correct = results.filter(r => r.correct).length
  const total = results.length
  const pct = Math.round((correct / total) * 100)
  const flagged = results.filter(r => r.flagged)

  // Group by topic for breakdown
  const byTopic = results.reduce<Record<string, { correct: number; total: number }>>((acc, r) => {
    const t = r.question.topic
    if (!acc[t]) acc[t] = { correct: 0, total: 0 }
    acc[t].total++
    if (r.correct) acc[t].correct++
    return acc
  }, {})

  const grade =
    pct >= 50 ? { label: 'YAY ★', color: '#2e7d32', bg: '#f1f8e9' } :
    pct >= 40 ? { label: 'AMAN KUMAR', color: '#e65100', bg: '#fff3e0' } :
                { label: 'NEEDS REVIEW', color: '#c62828', bg: '#ffebee' }

  const mins = Math.floor(timeTakenSeconds / 60)
  const secs = timeTakenSeconds % 60

  return (
    <div className="results-wrapper">
      {/* Score hero */}
      <div className="score-hero kawaii-panel" style={{ borderColor: grade.color, boxShadow: `6px 6px 0 ${grade.color}` }}>
        <div className="score-badge" style={{ background: grade.bg, border: `2px solid ${grade.color}` }}>
          <span className="pixel-label" style={{ color: grade.color, fontSize: '8px' }}>{grade.label}</span>
        </div>
        <div className="score-number">
          <span className="score-big">{correct}</span>
          <span className="score-sep">/</span>
          <span className="score-total">{total}</span>
        </div>
        <div className="score-pct pixel-label" style={{ color: grade.color }}>{pct}%</div>
        <div className="score-time">
          ⏱ {mins}m {String(secs).padStart(2, '0')}s
        </div>
      </div>

      {/* Topic breakdown */}
      <div className="breakdown kawaii-panel">
        <p className="pixel-label">BREAKDOWN BY TOPIC</p>
        <div className="breakdown-list">
          {Object.entries(byTopic).map(([topic, { correct: c, total: t }]) => {
            const topicPct = Math.round((c / t) * 100)
            return (
              <div key={topic} className="breakdown-row">
                <span className="breakdown-topic">{topic}</span>
                <div className="breakdown-bar-wrap">
                  <div
                    className="breakdown-bar-fill"
                    style={{
                      width: `${topicPct}%`,
                      background: topicPct >= 80 ? 'var(--green-mid)' :
                                  topicPct >= 60 ? '#ffb74d' : '#ef9a9a'
                    }}
                  />
                </div>
                <span className="breakdown-score">{c}/{t}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Flagged questions list */}
      {flagged.length > 0 && (
        <div className="flagged-panel kawaii-panel">
          <p className="pixel-label">🚩 FLAGGED FOR REVIEW ({flagged.length})</p>
          <ul className="flagged-list">
            {flagged.map(r => (
              <li key={r.question.id} className="flagged-item">
                <span className="flagged-topic">{r.question.topic} · {r.question.subtopic}</span>
                <span className="flagged-q">{r.question.question.slice(0, 80)}…</span>
                <span className={`flagged-status ${r.correct ? 'correct' : 'wrong'}`}>
                  {r.correct ? '✓' : '✗'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action buttons */}
      <div className="result-actions">
        <button className="btn-kawaii" onClick={() => router.push('/')}>
          ♡ New Quiz
        </button>
        {flagged.length > 0 && (
          <button className="btn-kawaii" onClick={onReviewFlagged}>
            🚩 Redo Flagged
          </button>
        )}
        <button className="btn-kawaii green" onClick={() => router.push('/')}>
          ★ Dashboard
        </button>
      </div>

      <style jsx>{`
        .results-wrapper { display: flex; flex-direction: column; gap: 20px; }

        .score-hero {
          text-align: center;
          padding: 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .score-badge {
          padding: 4px 14px;
          margin-bottom: 4px;
        }

        .score-number {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .score-big {
          font-family: var(--font-pixel);
          font-size: 42px;
          color: var(--pink-dark);
          line-height: 1;
        }

        .score-sep  { font-family: var(--font-pixel); font-size: 24px; color: #aaa; }
        .score-total { font-family: var(--font-pixel); font-size: 28px; color: #888; }

        .score-pct  { font-size: 14px; }
        .score-time { font-family: var(--font-body); font-size: 12px; color: #888; }

        /* Breakdown */
        .breakdown { margin-top: 4px; }
        .breakdown-list { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }

        .breakdown-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-body);
          font-size: 13px;
        }

        .breakdown-topic { width: 140px; flex-shrink: 0; color: #555; }

        .breakdown-bar-wrap {
          flex: 1;
          height: 12px;
          background: var(--pink-light);
          border: 1.5px solid var(--pink-mid);
        }

        .breakdown-bar-fill {
          height: 100%;
          transition: width 0.6s ease;
        }

        .breakdown-score { width: 36px; text-align: right; color: #888; }

        /* Flagged */
        .flagged-list { list-style: none; padding: 0; margin: 12px 0 0; display: flex; flex-direction: column; gap: 8px; }

        .flagged-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 8px;
          border: 1.5px solid var(--border-px);
          background: #fffde7;
        }

        .flagged-topic { font-size: 10px; color: #888; white-space: nowrap; flex-shrink: 0; }
        .flagged-q { flex: 1; font-size: 12px; color: #444; font-family: var(--font-body); }

        .flagged-status { font-size: 16px; font-weight: bold; flex-shrink: 0; }
        .flagged-status.correct { color: #2e7d32; }
        .flagged-status.wrong   { color: #c62828; }

        /* Actions */
        .result-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 4px;
        }
      `}</style>
    </div>
  )
}
