'use client'
import { useState, useEffect } from 'react'
import topicsIndex from '@/data/topicsIndex.json'

type TopicsIndex = Record<string, string[]>
const topics = topicsIndex as TopicsIndex

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

  const toggleTopic = (topic: string) => {
    setExpanded(e => ({ ...e, [topic]: !e[topic] }))
    setSelections(prev => {
      const next = { ...prev }
      if (next[topic]) {
        delete next[topic]
      } else {
        next[topic] = {}
        for (const sub of topics[topic]) {
          next[topic][sub] = 0
        }
      }
      return next
    })
  }

  const setCount = (topic: string, subtopic: string, count: number) => {
    setSelections(prev => {
      const next: Selection = {
        ...prev,
        [topic]: { ...prev[topic], [subtopic]: count }
      }
      if (count === 0) delete next[topic][subtopic]
      if (Object.keys(next[topic] ?? {}).length === 0) delete next[topic]
      return next
    })
  }

  const totalSelected = Object.values(selections)
    .flatMap(s => Object.values(s))
    .reduce((a, b) => a + b, 0)

  return (
    <div className="topic-selector">
      <div className="selector-header">
        <span className="count-badge pixel-label">SELECT TOPICS ♡</span>
        <span className="count-badge">{totalSelected} questions</span>
      </div>

      {Object.keys(topics).map((topic: string) => (
        <div key={topic} className="topic-group">
          <div
            className={`topic-row ${selections[topic] ? 'active' : ''}`}
            onClick={() => toggleTopic(topic)}
          >
            <span className="toggle-icon">{expanded[topic] ? '▼' : '▶'}</span>
            <span className="topic-name">{topic}</span>
            {selections[topic] && (
              <span className="topic-count">
                {Object.values(selections[topic]).reduce((a, b) => a + b, 0)} q
              </span>
            )}
          </div>

          {expanded[topic] && (
            <div className="subtopic-list">
              {topics[topic].map((subtopic: string) => (
                <div key={subtopic} className="subtopic-row">
                  <span className="subtopic-name">{subtopic}</span>
                  <div className="count-control">
                    <button onClick={() => setCount(topic, subtopic,
                      Math.max(0, (selections[topic]?.[subtopic] ?? 0) - 1))}>−</button>
                    <span>{selections[topic]?.[subtopic] ?? 0}</span>
                    <button onClick={() => setCount(topic, subtopic,
                      (selections[topic]?.[subtopic] ?? 0) + 1)}>+</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}