'use client'
import type { QuizResult } from '@/types'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

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
  const wrong = results.filter(r => !r.correct)

  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())

  const toggleTopic = (topic: string) => {
    setExpandedTopics(prev => {
      const next = new Set(prev)
      next.has(topic) ? next.delete(topic) : next.add(topic)
      return next
    })
  }

  // Group by topic
  const byTopic = results.reduce<Record<string, { correct: number; total: number; wrong: QuizResult[] }>>(
    (acc, r) => {
      const t = r.question.topic
      if (!acc[t]) acc[t] = { correct: 0, total: 0, wrong: [] }
      acc[t].total++
      if (r.correct) acc[t].correct++
      else acc[t].wrong.push(r)
      return acc
    }, {}
  )

  const grade =
    pct >= 50 ? { label: 'YAY ★', color: '#2e7d32', bg: '#f1f8e9' } :
    pct >= 40 ? { label: 'AMAN KUMAR', color: '#e65100', bg: '#fff3e0' } :
                { label: 'NEEDS REVIEW', color: '#c62828', bg: '#ffebee' }

  const mins = Math.floor(timeTakenSeconds / 60)
  const secs = timeTakenSeconds % 60

  // Colour palette for distinguishing questions
  const questionPalette = [
    { border: '#f48fb1', bg: '#fce4ec', accent: '#c2185b' },
    { border: '#90caf9', bg: '#e3f2fd', accent: '#1565c0' },
    { border: '#a5d6a7', bg: '#e8f5e9', accent: '#2e7d32' },
    { border: '#ffcc80', bg: '#fff8e1', accent: '#e65100' },
    { border: '#ce93d8', bg: '#f3e5f5', accent: '#6a1b9a' },
    { border: '#80deea', bg: '#e0f7fa', accent: '#00695c' },
  ]

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
        <div className="score-time">⏱ {mins}m {String(secs).padStart(2, '0')}s</div>
      </div>

      {/* Topic breakdown with inline wrong-question toggles */}
      <div className="breakdown kawaii-panel">
        <p className="pixel-label">BREAKDOWN BY TOPIC</p>
        <div className="breakdown-list">
          {Object.entries(byTopic).map(([topic, { correct: c, total: t, wrong: topicWrong }]) => {
            const topicPct = Math.round((c / t) * 100)
            const isOpen = expandedTopics.has(topic)
            const barColor =
              topicPct >= 80 ? 'var(--green-mid)' :
              topicPct >= 60 ? '#ffb74d' : '#ef9a9a'

            return (
              <div key={topic} className="breakdown-group">
                {/* Bar row */}
                <div className="breakdown-row">
                  <span className="breakdown-topic">{topic}</span>
                  <div className="breakdown-bar-wrap">
                    <div
                      className="breakdown-bar-fill"
                      style={{ width: `${topicPct}%`, background: barColor }}
                    />
                  </div>
                  <span className="breakdown-score">{c}/{t}</span>
                  {topicWrong.length > 0 && (
                    <button
                      className={`toggle-btn ${isOpen ? 'open' : ''}`}
                      onClick={() => toggleTopic(topic)}
                      title={isOpen ? 'Hide wrong answers' : 'Show wrong answers'}
                    >
                      <span className="toggle-icon">{isOpen ? '▲' : '▼'}</span>
                      <span className="toggle-count">{topicWrong.length} ✗</span>
                    </button>
                  )}
                </div>

                {/* Expandable wrong questions for this topic */}
                {isOpen && topicWrong.length > 0 && (
                  <div className="topic-wrong-list">
                    {topicWrong.map((r, idx) => {
                      const pal = questionPalette[idx % questionPalette.length]
                      return (
                        <div
                          key={r.question.id}
                          className="inline-review-card"
                          style={{
                            borderColor: pal.border,
                            background: pal.bg,
                            boxShadow: `3px 3px 0 ${pal.border}`,
                          }}
                        >
                          <div className="irc-header">
                            <span className="irc-index" style={{ background: pal.accent }}>
                              Q{idx + 1}
                            </span>
                            <span className="irc-subtopic" style={{ color: pal.accent }}>
                              {r.question.subtopic}
                            </span>
                          </div>
                          <p className="irc-question">{r.question.question}</p>
                          <div className="irc-answers">
                            <span className="irc-wrong-answer">
                              ✗ {r.chosen ?? '—'}
                            </span>
                            <span className="irc-arrow">→</span>
                            <span className="irc-correct-answer" style={{ borderColor: pal.accent, color: pal.accent }}>
                              ✓ {r.question.correct_answer}
                            </span>
                          </div>
                          {r.question.feedback && (
                            <div className="irc-feedback" style={{ borderLeftColor: pal.accent }}>
                              {r.question.feedback}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
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

      {/* Wrong answers review — standalone full list */}
      {wrong.length > 0 && (
        <div className="wrong-panel kawaii-panel">
          <p className="pixel-label">✗ ALL QUESTIONS TO REVIEW ({wrong.length})</p>
          <div className="review-grid">
            {wrong.map((r, idx) => {
              const pal = questionPalette[idx % questionPalette.length]
              return (
                <div
                  key={r.question.id}
                  className="review-card"
                  style={{
                    borderColor: pal.border,
                    background: pal.bg,
                    boxShadow: `4px 4px 0 ${pal.border}`,
                  }}
                >
                  {/* Card header stripe */}
                  <div className="rc-stripe" style={{ background: pal.accent }}>
                    <span className="rc-num">#{idx + 1}</span>
                    <span className="rc-breadcrumb">
                      {r.question.topic} › {r.question.subtopic}
                    </span>
                  </div>

                  <div className="rc-body">
                    <p className="rc-question">{r.question.question}</p>

                    <div className="rc-answer-row">
                      <div className="rc-answer wrong">
                        <span className="rc-answer-label">Your answer</span>
                        <span className="rc-answer-val">✗ {r.chosen ?? '—'}</span>
                      </div>
                      <div className="rc-answer correct" style={{ borderColor: pal.accent }}>
                        <span className="rc-answer-label" style={{ color: pal.accent }}>Correct</span>
                        <span className="rc-answer-val" style={{ color: pal.accent }}>✓ {r.question.correct_answer}</span>
                      </div>
                    </div>

                    {r.question.feedback && (
                      <div className="rc-feedback" style={{ borderLeftColor: pal.accent }}>
                        <span className="rc-feedback-label" style={{ color: pal.accent }}>💡 Explanation</span>
                        <p>{r.question.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="result-actions">
        <button className="btn-kawaii" onClick={() => router.push('/')}>♡ New Quiz</button>
        {flagged.length > 0 && (
          <button className="btn-kawaii" onClick={onReviewFlagged}>🚩 Redo Flagged</button>
        )}
        <button className="btn-kawaii green" onClick={() => router.push('/')}>★ Dashboard</button>
      </div>

      <style jsx>{`
        .results-wrapper { display: flex; flex-direction: column; gap: 20px; }

        /* ── Score hero ── */
        .score-hero {
          text-align: center; padding: 28px;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
        }
        .score-badge { padding: 4px 14px; margin-bottom: 4px; }
        .score-number { display: flex; align-items: baseline; gap: 4px; }
        .score-big  { font-family: var(--font-pixel); font-size: 42px; color: var(--pink-dark); line-height: 1; }
        .score-sep  { font-family: var(--font-pixel); font-size: 24px; color: #aaa; }
        .score-total{ font-family: var(--font-pixel); font-size: 28px; color: #888; }
        .score-pct  { font-size: 14px; }
        .score-time { font-family: var(--font-body); font-size: 12px; color: #888; }

        /* ── Breakdown ── */
        .breakdown { margin-top: 4px; }
        .breakdown-list { margin-top: 12px; display: flex; flex-direction: column; gap: 4px; }

        .breakdown-group { display: flex; flex-direction: column; gap: 0; }

        .breakdown-row {
          display: flex; align-items: center; gap: 10px;
          font-family: var(--font-body); font-size: 13px;
          padding: 4px 0;
        }
        .breakdown-topic { width: 140px; flex-shrink: 0; color: #555; }
        .breakdown-bar-wrap {
          flex: 1; height: 12px;
          background: var(--pink-light);
          border: 1.5px solid var(--pink-mid);
        }
        .breakdown-bar-fill { height: 100%; transition: width 0.6s ease; }
        .breakdown-score { width: 36px; text-align: right; color: #888; font-size: 12px; }

        /* Toggle button on bar */
        .toggle-btn {
          display: flex; align-items: center; gap: 4px;
          padding: 2px 8px;
          border: 1.5px solid #f48fb1;
          background: #fce4ec;
          font-family: var(--font-pixel);
          font-size: 7px;
          color: #c2185b;
          cursor: pointer;
          transition: background 0.15s, transform 0.15s;
          white-space: nowrap;
        }
        .toggle-btn:hover { background: #f8bbd0; transform: translateY(-1px); }
        .toggle-btn.open  { background: #f48fb1; color: #fff; border-color: #c2185b; }
        .toggle-icon { font-size: 6px; }
        .toggle-count { font-size: 7px; }

        /* Inline wrong cards under bar */
        .topic-wrong-list {
          display: flex; flex-direction: column; gap: 8px;
          margin: 6px 0 10px 150px; /* indent to align under bar */
          padding: 0;
          animation: slideDown 0.2s ease;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .inline-review-card {
          border: 2px solid;
          padding: 10px 12px;
          display: flex; flex-direction: column; gap: 6px;
        }
        .irc-header { display: flex; align-items: center; gap: 8px; }
        .irc-index {
          font-family: var(--font-pixel); font-size: 7px;
          color: #fff; padding: 2px 6px;
        }
        .irc-subtopic { font-family: var(--font-pixel); font-size: 7px; }
        .irc-question { font-family: var(--font-body); font-size: 12px; color: #333; margin: 0; line-height: 1.5; }

        .irc-answers {
          display: flex; align-items: center; gap: 8px;
          font-family: var(--font-body); font-size: 11px; flex-wrap: wrap;
        }
        .irc-wrong-answer {
          padding: 2px 8px;
          background: #ffebee; border: 1.5px solid #ef9a9a;
          color: #c62828; font-weight: 600;
        }
        .irc-arrow { color: #aaa; font-size: 12px; }
        .irc-correct-answer {
          padding: 2px 8px;
          background: #fff;
          border: 1.5px solid;
          font-weight: 600;
        }
        .irc-feedback {
          font-family: var(--font-body); font-size: 11px; color: #555;
          border-left: 3px solid; padding-left: 8px; margin-top: 2px;
          line-height: 1.5;
        }

        /* ── Flagged ── */
        .flagged-list { list-style: none; padding: 0; margin: 12px 0 0; display: flex; flex-direction: column; gap: 8px; }
        .flagged-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 8px; border: 1.5px solid var(--border-px); background: #fffde7;
        }
        .flagged-topic { font-size: 10px; color: #888; white-space: nowrap; flex-shrink: 0; }
        .flagged-q    { flex: 1; font-size: 12px; color: #444; font-family: var(--font-body); }
        .flagged-status { font-size: 16px; font-weight: bold; flex-shrink: 0; }
        .flagged-status.correct { color: #2e7d32; }
        .flagged-status.wrong   { color: #c62828; }

        /* ── Full wrong-answer review cards ── */
        .wrong-panel { }
        .review-grid {
          margin-top: 14px;
          display: flex; flex-direction: column; gap: 14px;
        }

        .review-card {
          border: 2px solid;
          overflow: hidden;
        }

        .rc-stripe {
          display: flex; align-items: center; gap: 10px;
          padding: 5px 10px;
        }
        .rc-num {
          font-family: var(--font-pixel); font-size: 8px;
          color: #fff; background: rgba(0,0,0,0.2);
          padding: 2px 6px;
        }
        .rc-breadcrumb {
          font-family: var(--font-pixel); font-size: 7px;
          color: rgba(255,255,255,0.9);
          letter-spacing: 0.5px;
        }

        .rc-body { padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; }

        .rc-question {
          font-family: var(--font-body); font-size: 13px;
          color: #222; margin: 0; line-height: 1.6; font-weight: 500;
        }

        .rc-answer-row {
          display: flex; gap: 10px; flex-wrap: wrap;
        }
        .rc-answer {
          flex: 1; min-width: 120px;
          padding: 8px 10px;
          display: flex; flex-direction: column; gap: 3px;
          border: 1.5px solid;
        }
        .rc-answer.wrong  { background: #ffebee; border-color: #ef9a9a; }
        .rc-answer.correct{ background: #fff; }
        .rc-answer-label  { font-family: var(--font-pixel); font-size: 6px; color: #999; }
        .rc-answer.wrong .rc-answer-label { color: #c62828; }
        .rc-answer-val    { font-family: var(--font-body); font-size: 12px; font-weight: 600; color: #333; }
        .rc-answer.wrong .rc-answer-val { color: #c62828; }

        .rc-feedback {
          border-left: 3px solid;
          padding-left: 10px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .rc-feedback-label {
          font-family: var(--font-pixel); font-size: 7px;
        }
        .rc-feedback p {
          font-family: var(--font-body); font-size: 12px;
          color: #555; margin: 0; line-height: 1.6;
        }

        /* ── Actions ── */
        .result-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 4px; }
      `}</style>
    </div>
  )
}
