'use client'
import { useState, useEffect } from 'react'

const [topics, setTopics] = useState<Record<string, string[]>>({})

useEffect(() => {
  supabase
    .from('questions')
    .select('topic, subtopic')
    .then(({ data }) => {
      const index: Record<string, string[]> = {}
      for (const q of data ?? []) {
        if (!index[q.topic]) index[q.topic] = []
        if (!index[q.topic].includes(q.subtopic)) {
          index[q.topic].push(q.subtopic)
        }
      }
      // Sort alphabetically
      const sorted: Record<string, string[]> = {}
      for (const topic of Object.keys(index).sort()) {
        sorted[topic] = index[topic].sort()
      }
      setTopics(sorted)
    })
}, [])

interface Selection {
  [topic: string]: {
    [subtopic: string]: number
  }
}

interface Props {
  onChange: (selections: Selection) => void
}

export default function TopicSelector({ onChange }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [selections, setSelections] = useState<Selection>({})

  useEffect(() => {
    onChange(selections)
  }, [selections])

  // Distribute N questions randomly across subtopics
  const distributeAcrossSubtopics = (topic: string, total: number): Record<string, number> => {
    const subs = topics[topic]
    const result: Record<string, number> = {}
    subs.forEach(s => result[s] = 0)
    for (let i = 0; i < total; i++) {
      const sub = subs[i % subs.length]
      result[sub]++
    }
    return result
  }

  const toggleTopic = (topic: string) => {
    setExpanded(e => ({ ...e, [topic]: !e[topic] }))
    setSelections(prev => {
      const next = { ...prev }
      if (next[topic]) {
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
    setSelections(prev => {
      const next: Selection = {
        ...prev,
        [topic]: { ...prev[topic], [subtopic]: value }
      }
      return next
    })
  }

  // Set all subtopics in a topic at once from the topic-level input
  const setTopicTotal = (topic: string, total: number) => {
    const value = Math.max(0, isNaN(total) ? 0 : total)
    setSelections(prev => {
      const next = { ...prev }
      if (value === 0) {
        // Zero out all subtopics
        next[topic] = {}
        topics[topic].forEach(sub => { next[topic][sub] = 0 })
      } else {
        next[topic] = distributeAcrossSubtopics(topic, value)
      }
      return next
    })
  }

  const getTopicTotal = (topic: string): number => {
    if (!selections[topic]) return 0
    return Object.values(selections[topic]).reduce((a, b) => a + b, 0)
  }

  const totalSelected = Object.values(selections)
    .flatMap(s => Object.values(s))
    .reduce((a, b) => a + b, 0)

  return (
    <div className="topic-selector">
      <div className="selector-header">
        <span className="pixel-label">SELECT TOPICS ♡</span>
        <span className="count-badge">{totalSelected} questions</span>
      </div>

      {Object.keys(topics).map((topic: string) => (
        <div key={topic} className="topic-group">

          {/* Topic row */}
          <div className={`topic-row ${selections[topic] ? 'active' : ''}`}>
            {/* Expand/collapse toggle */}
            <span
              className="toggle-icon"
              onClick={() => toggleTopic(topic)}
            >
              {expanded[topic] ? '▼' : '▶'}
            </span>

            {/* Topic name — clicking selects the whole topic */}
            <span
              className="topic-name"
              onClick={() => toggleTopic(topic)}
            >
              {topic}
            </span>

            {/* Topic-level question count input */}
            {selections[topic] && (
              <div className="topic-count-control" onClick={e => e.stopPropagation()}>
                <span className="pixel-label" style={{ fontSize: '7px' }}>TOTAL:</span>
                <input
                  type="number"
                  min="0"
                  className="count-input"
                  value={getTopicTotal(topic)}
                  onChange={e => setTopicTotal(topic, parseInt(e.target.value))}
                  title="Set total questions — distributed evenly across subtopics"
                />
              </div>
            )}
          </div>

          {/* Subtopic rows */}
          {expanded[topic] && selections[topic] && (
            <div className="subtopic-list">
              {topics[topic].map((subtopic: string) => (
                <div key={subtopic} className="subtopic-row">
                  <span className="subtopic-name">{subtopic}</span>
                  <div className="count-control">
                    <button onClick={() => setCount(topic, subtopic,
                      (selections[topic]?.[subtopic] ?? 0) - 1)}>−</button>
                    <input
                      type="number"
                      min="0"
                      className="count-input"
                      value={selections[topic]?.[subtopic] ?? 0}
                      onChange={e => setCount(topic, subtopic, parseInt(e.target.value))}
                    />
                    <button onClick={() => setCount(topic, subtopic,
                      (selections[topic]?.[subtopic] ?? 0) + 1)}>+</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <style jsx>{`
        .topic-selector {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin: 16px 0;
        }

        .selector-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--pink-mid);
          border: 2px solid var(--pink-dark);
          margin-bottom: 2px;
        }

        .count-badge {
          font-family: var(--font-pixel);
          font-size: 7px;
          color: white;
        }

        .topic-group {
          border: 2px solid var(--border-px);
          border-top: none;
        }

        .topic-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          background: var(--cream);
          transition: background 0.1s;
          user-select: none;
        }

        .topic-row:hover { background: var(--pink-light); }

        .topic-row.active {
          background: var(--green-pale);
          border-left: 4px solid var(--green-mid);
        }

        .toggle-icon {
          font-size: 8px;
          color: var(--pink-mid);
          font-family: var(--font-pixel);
          width: 12px;
          cursor: pointer;
          flex-shrink: 0;
        }

        .topic-name {
          font-family: var(--font-body);
          font-weight: 700;
          font-size: 14px;
          flex: 1;
          cursor: pointer;
        }

        .topic-count-control {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .subtopic-list {
          background: white;
          border-top: 1.5px dashed var(--border-px);
        }

        .subtopic-row {
          display: flex;
          align-items: center;
          padding: 8px 14px 8px 32px;
          border-bottom: 1px solid var(--border-px);
          gap: 12px;
        }

        .subtopic-row:last-child { border-bottom: none; }

        .subtopic-name {
          flex: 1;
          font-family: var(--font-body);
          font-size: 13px;
          color: #555;
        }

        .count-control {
          display: flex;
          align-items: center;
          border: 2px solid var(--pink-mid);
        }

        .count-control button {
          font-family: var(--font-pixel);
          font-size: 12px;
          width: 28px;
          height: 28px;
          background: var(--pink-light);
          border: none;
          cursor: pointer;
          color: var(--pink-dark);
          transition: background 0.1s;
          flex-shrink: 0;
        }

        .count-control button:hover { background: var(--pink-mid); color: white; }

        /* Shared number input style */
        .count-input {
          font-family: var(--font-pixel);
          font-size: 9px;
          width: 48px;
          height: 28px;
          text-align: center;
          border: none;
          border-left: 1.5px solid var(--pink-mid);
          border-right: 1.5px solid var(--pink-mid);
          color: var(--pink-dark);
          background: white;
          -moz-appearance: textfield;
        }

        /* Hide number input arrows */
        .count-input::-webkit-outer-spin-button,
        .count-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .count-input:focus {
          outline: none;
          background: var(--pink-light);
        }
      `}</style>
    </div>
  )
}