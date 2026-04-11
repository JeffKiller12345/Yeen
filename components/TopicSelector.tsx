'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getSeenIds } from '@/lib/seenTracker'
import { TOPICS_ORDER, TOPIC_ORDER } from '@/data/topicsOrder'

interface Selection {
  [topic: string]: { [subtopic: string]: number }
}

interface Counts {
  [topic: string]: {
    total: number
    seen: number
    subtopics: { [subtopic: string]: { total: number; seen: number } }
  }
}

interface Props {
  onChange: (selections: Selection) => void
  onTopicsLoaded: (topics: Record<string, string[]>) => void
  questionType: 'mcq' | 'saq'
}

function RingBadge({ seen, total, size = 'topic' }: {
  seen: number; total: number; size?: 'topic' | 'subtopic'
}) {
  const [show, setShow] = useState(false)
  const pct = total === 0 ? 0 : Math.round((seen / total) * 100)
  const unseen = total - seen
  const dim = size === 'topic' ? 36 : 28
  const r = size === 'topic' ? 14 : 10
  const stroke = size === 'topic' ? 4 : 3
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = pct === 100 ? '#4caf50' : pct > 50 ? '#66bb6a' : pct > 20 ? '#ffa726' : '#f06292'

  return (
    <div
      style={{ position: 'relative', width: dim, height: dim, flexShrink: 0, cursor: 'pointer' }}
      onClick={e => { e.stopPropagation(); setShow(s => !s) }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}
        style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx={dim/2} cy={dim/2} r={r} fill="none" stroke="#f8bbd0" strokeWidth={stroke} />
        <circle cx={dim/2} cy={dim/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontFamily: 'var(--font-pixel)',
        fontSize: size === 'topic' ? '7px' : '6px', fontWeight: 700,
        color: '#555', pointerEvents: 'none'
      }}>
        {pct}%
      </div>
      {show && (
        <div style={{
          position: 'absolute', right: dim + 6, top: '50%', transform: 'translateY(-50%)',
          background: '#333', color: 'white', fontFamily: 'var(--font-pixel)', fontSize: '7px',
          padding: '5px 8px', zIndex: 20, whiteSpace: 'nowrap', lineHeight: 1.8, pointerEvents: 'none'
        }}>
          <span style={{ color: '#81c784' }}>✓ {seen} seen</span><br />
          <span style={{ color: '#f48fb1' }}>○ {unseen} unseen</span>
        </div>
      )}
    </div>
  )
}

export default function TopicSelector({ onChange, onTopicsLoaded, questionType }: Props) {
  const [topics, setTopics] = useState<Record<string, string[]>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [selections, setSelections] = useState<Selection>({})
  const [counts, setCounts] = useState<Counts>({})

  useEffect(() => {
    const fetchTopics = async () => {
      const table = questionType === 'saq' ? 'saq_questions' : 'questions'

      const { data, error } = await supabase
        .from(table)
        .select('id, topic, subtopic')

      if (error) { console.error('Error fetching topics:', error); return }

      // Build topic index
      const index: Record<string, string[]> = {}
      for (const q of data ?? []) {
        if (!index[q.topic]) index[q.topic] = []
        if (!index[q.topic].includes(q.subtopic)) index[q.topic].push(q.subtopic)
      }

      // Sort topics
      const sorted: Record<string, string[]> = {}
      const orderedTopics = [
        ...TOPIC_ORDER.filter(t => index[t]),
        ...Object.keys(index).filter(t => !TOPIC_ORDER.includes(t)).sort()
      ]
      for (const topic of orderedTopics) {
        const predefinedOrder = TOPICS_ORDER[topic] ?? []
        sorted[topic] = [
          ...predefinedOrder.filter(s => index[topic].includes(s)),
          ...index[topic].filter(s => !predefinedOrder.includes(s)).sort()
        ]
      }

      setTopics(sorted)
      onTopicsLoaded(sorted)
      setSelections({})

      // Build seen counts
      const seenIds = await getSeenIds(questionType)
      const newCounts: Counts = {}
      for (const q of data ?? []) {
        if (!newCounts[q.topic]) newCounts[q.topic] = { total: 0, seen: 0, subtopics: {} }
        if (!newCounts[q.topic].subtopics[q.subtopic])
          newCounts[q.topic].subtopics[q.subtopic] = { total: 0, seen: 0 }
        newCounts[q.topic].total++
        newCounts[q.topic].subtopics[q.subtopic].total++
        if (seenIds.has(q.id)) {
          newCounts[q.topic].seen++
          newCounts[q.topic].subtopics[q.subtopic].seen++
        }
      }
      setCounts(newCounts)
    }

    fetchTopics()
  }, [questionType, onTopicsLoaded])

  useEffect(() => { onChange(selections) }, [selections, onChange])

  // ── SAQ helpers ───────────────────────────────────────────────────────────

  const setSAQCount = (topic: string, count: number) => {
    const value = Math.max(0, isNaN(count) ? 0 : count)
    setSelections(prev => {
      if (value === 0) { const next = { ...prev }; delete next[topic]; return next }
      return { ...prev, [topic]: { '': value } }
    })
  }

  const getSAQCount = (topic: string): number => selections[topic]?.[''] ?? 0

  const totalSAQCases = Object.values(selections)
    .reduce((a, subtopics) => a + Object.values(subtopics).reduce((x, y) => x + y, 0), 0)

  // ── MCQ helpers ───────────────────────────────────────────────────────────

  const toggleTopic = (topic: string) => {
    const isCurrentlyExpanded = !!expanded[topic]
    setExpanded(e => ({ ...e, [topic]: !e[topic] }))
    setSelections(prev => {
      const next = { ...prev }
      if (isCurrentlyExpanded) {
        delete next[topic]
      } else {
        next[topic] = {}
        topics[topic].forEach(sub => { next[topic][sub] = 0 })
      }
      return next
    })
  }

  const setCount = (topic: string, subtopic: string, count: number) => {
    const value = Math.max(0, isNaN(count) ? 0 : count)
    setSelections(prev => ({ ...prev, [topic]: { ...prev[topic], [subtopic]: value } }))
  }

  const setTopicTotal = (topic: string, total: number) => {
    const value = Math.max(0, isNaN(total) ? 0 : total)
    setSelections(prev => {
      if (value === 0) {
        const next = { ...prev }
        if (next[topic]) { next[topic] = {}; topics[topic].forEach(sub => { next[topic][sub] = 0 }) }
        return next
      }
      return { ...prev, [topic]: { '': value } }
    })
  }

  const getTopicTotal = (topic: string): number => {
    if (!selections[topic]) return 0
    return Object.values(selections[topic]).reduce((a, b) => a + (b || 0), 0)
  }

  const totalSelected = Object.values(selections)
    .flatMap(s => Object.values(s)).reduce((a, b) => a + (b || 0), 0)

  // ── SAQ render ────────────────────────────────────────────────────────────

  if (questionType === 'saq') {
    return (
      <div className="topic-selector">
        <div className="selector-header saq">
          <span className="pixel-label">SELECT TOPICS ♡</span>
          <span className="count-badge">{totalSAQCases} {totalSAQCases === 1 ? 'case' : 'cases'}</span>
        </div>

        {Object.keys(topics).length === 0 && (
          <div style={{ padding: '16px', textAlign: 'center', fontFamily: 'var(--font-pixel)', fontSize: '8px', color: '#aaa' }}>
            LOADING TOPICS...
          </div>
        )}

        {Object.keys(topics).map(topic => {
          const count = getSAQCount(topic)
          return (
            <div key={topic} className="topic-group">
              <div className={`topic-row ${count > 0 ? 'active' : ''}`}>
                <span className="topic-name">{topic}</span>
                {counts[topic] && (
                  <RingBadge seen={counts[topic].seen} total={counts[topic].total} />
                )}
                <div className="count-control" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setSAQCount(topic, count - 1)}>−</button>
                  <input type="number" min="0" className="count-input" value={count}
                    onChange={e => setSAQCount(topic, parseInt(e.target.value) || 0)} />
                  <button onClick={() => setSAQCount(topic, count + 1)}>+</button>
                </div>
              </div>
            </div>
          )
        })}

        <style>{`
          .topic-selector { display: flex; flex-direction: column; gap: 0; margin: 16px 0; }
          .selector-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border: 2px solid var(--pink-dark); margin-bottom: 2px; }
          .selector-header.saq { background: var(--green-mid); border-color: var(--green-mid); }
          .count-badge { font-family: var(--font-pixel); font-size: 7px; color: white; }
          .topic-group { border: 2px solid var(--border-px); border-top: none; }
          .topic-row { display: flex; align-items: center; gap: 10px; padding: 8px 14px; background: var(--cream); transition: background 0.1s; user-select: none; }
          .topic-row:hover { background: var(--green-pale); }
          .topic-row.active { background: var(--green-pale); border-left: 4px solid var(--green-mid); }
          .topic-name { font-family: var(--font-body); font-weight: 700; font-size: 14px; flex: 1; }
          .count-control { display: flex; align-items: center; border: 2px solid var(--green-mid); }
          .count-control button { font-family: var(--font-pixel); font-size: 12px; width: 28px; height: 28px; background: var(--green-pale); border: none; cursor: pointer; color: #2e7d32; transition: background 0.1s; flex-shrink: 0; }
          .count-control button:hover { background: var(--green-mid); color: white; }
          .count-input { font-family: var(--font-pixel); font-size: 9px; width: 48px; height: 28px; text-align: center; border: none; border-left: 1.5px solid var(--green-mid); border-right: 1.5px solid var(--green-mid); color: #2e7d32; background: white; -moz-appearance: textfield; }
          .count-input::-webkit-outer-spin-button, .count-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
          .count-input:focus { outline: none; background: var(--green-pale); }
        `}</style>
      </div>
    )
  }

  // ── MCQ render ────────────────────────────────────────────────────────────

  return (
    <div className="topic-selector">
      <div className="selector-header">
        <span className="pixel-label">SELECT TOPICS ♡</span>
        <span className="count-badge">{totalSelected} questions</span>
      </div>

      {Object.keys(topics).length === 0 && (
        <div style={{ padding: '16px', textAlign: 'center', fontFamily: 'var(--font-pixel)', fontSize: '8px', color: '#aaa' }}>
          LOADING TOPICS...
        </div>
      )}

      {Object.keys(topics).map((topic: string) => (
        <div key={topic} className="topic-group">
          <div className={`topic-row ${selections[topic] ? 'active' : ''}`}>
            <span className="toggle-icon" onClick={() => toggleTopic(topic)}>
              {expanded[topic] ? '▼' : '▶'}
            </span>
            <span className="topic-name" onClick={() => toggleTopic(topic)}>{topic}</span>
            {counts[topic] && (
              <RingBadge seen={counts[topic].seen} total={counts[topic].total} />
            )}
            {selections[topic] && (
              <div className="topic-count-control" onClick={e => e.stopPropagation()}>
                <span className="pixel-label" style={{ fontSize: '7px' }}>TOTAL:</span>
                <input type="number" min="0" className="count-input"
                  value={getTopicTotal(topic)}
                  onChange={e => setTopicTotal(topic, parseInt(e.target.value) || 0)} />
              </div>
            )}
          </div>

          {expanded[topic] && selections[topic] && (
            <div className="subtopic-list">
              {topics[topic].map((subtopic: string) => (
                <div key={subtopic} className="subtopic-row">
                  <span className="subtopic-name">{subtopic}</span>
                  {counts[topic]?.subtopics[subtopic] && (
                    <RingBadge
                      size="subtopic"
                      seen={counts[topic].subtopics[subtopic].seen}
                      total={counts[topic].subtopics[subtopic].total}
                    />
                  )}
                  <div className="count-control">
                    <button onClick={() => setCount(topic, subtopic, (selections[topic]?.[subtopic] ?? 0) - 1)}>−</button>
                    <input type="number" min="0" className="count-input"
                      value={selections[topic]?.[subtopic] ?? 0}
                      onChange={e => setCount(topic, subtopic, parseInt(e.target.value) || 0)} />
                    <button onClick={() => setCount(topic, subtopic, (selections[topic]?.[subtopic] ?? 0) + 1)}>+</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <style>{`
        .topic-selector { display: flex; flex-direction: column; gap: 0; margin: 16px 0; }
        .selector-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--pink-mid); border: 2px solid var(--pink-dark); margin-bottom: 2px; }
        .count-badge { font-family: var(--font-pixel); font-size: 7px; color: white; }
        .topic-group { border: 2px solid var(--border-px); border-top: none; }
        .topic-row { display: flex; align-items: center; gap: 10px; padding: 8px 14px; background: var(--cream); transition: background 0.1s; user-select: none; }
        .topic-row:hover { background: var(--pink-light); }
        .topic-row.active { background: var(--green-pale); border-left: 4px solid var(--green-mid); }
        .toggle-icon { font-size: 8px; color: var(--pink-mid); font-family: var(--font-pixel); width: 12px; cursor: pointer; flex-shrink: 0; }
        .topic-name { font-family: var(--font-body); font-weight: 700; font-size: 14px; flex: 1; cursor: pointer; }
        .topic-count-control { display: flex; align-items: center; gap: 6px; }
        .subtopic-list { background: white; border-top: 1.5px dashed var(--border-px); }
        .subtopic-row { display: flex; align-items: center; padding: 8px 14px 8px 32px; border-bottom: 1px solid var(--border-px); gap: 12px; }
        .subtopic-row:last-child { border-bottom: none; }
        .subtopic-name { flex: 1; font-family: var(--font-body); font-size: 13px; color: #555; }
        .count-control { display: flex; align-items: center; border: 2px solid var(--pink-mid); }
        .count-control button { font-family: var(--font-pixel); font-size: 12px; width: 28px; height: 28px; background: var(--pink-light); border: none; cursor: pointer; color: var(--pink-dark); transition: background 0.1s; flex-shrink: 0; }
        .count-control button:hover { background: var(--pink-mid); color: white; }
        .count-input { font-family: var(--font-pixel); font-size: 9px; width: 48px; height: 28px; text-align: center; border: none; border-left: 1.5px solid var(--pink-mid); border-right: 1.5px solid var(--pink-mid); color: var(--pink-dark); background: white; -moz-appearance: textfield; }
        .count-input::-webkit-outer-spin-button, .count-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .count-input:focus { outline: none; background: var(--pink-light); }
      `}</style>
    </div>
  )
}
