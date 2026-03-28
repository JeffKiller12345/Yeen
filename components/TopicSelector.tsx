'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { TOPICS_ORDER, TOPIC_ORDER } from '@/data/topicsOrder'

interface Selection {
  [topic: string]: {
    [subtopic: string]: number
  }
}

interface Props {
  onChange: (selections: Selection) => void
  onTopicsLoaded: (topics: Record<string, string[]>) => void
  questionType: 'mcq' | 'saq' 
}

export default function TopicSelector({ onChange, onTopicsLoaded, questionType }: Props) {
  const [topics, setTopics] = useState<Record<string, string[]>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [selections, setSelections] = useState<Selection>({})

  useEffect(() => {
    const fetchTopics = async () => {
      const table = questionType === 'saq' ? 'saq_questions' : 'questions'
      
      const { data, error } = await supabase
        .from(table)
        .select('topic, subtopic')

      if (error) {
        console.error("Error fetching topics:", error)
        return
      }

      const index: Record<string, string[]> = {}
      for (const q of data ?? []) {
        if (!index[q.topic]) index[q.topic] = []
        if (!index[q.topic].includes(q.subtopic)) {
          index[q.topic].push(q.subtopic)
        }
      }

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
    }

    fetchTopics()
  }, [questionType, onTopicsLoaded])

  useEffect(() => {
    onChange(selections)
  }, [selections, onChange])

  const distributeAcrossSubtopics = (topic: string, total: number): Record<string, number> => {
    const subs = topics[topic]
    if (!subs || subs.length === 0) return {}
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
    setSelections(prev => ({
      ...prev,
      [topic]: { ...prev[topic], [subtopic]: value }
    }))
  }

  const setTopicTotal = (topic: string, total: number) => {
    const value = Math.max(0, isNaN(total) ? 0 : total)
    setSelections(prev => ({
      ...prev,
      [topic]: distributeAcrossSubtopics(topic, value)
    }))
  }

  const getTopicTotal = (topic: string): number => {
    if (!selections[topic]) return 0
    return Object.values(selections[topic]).reduce((a, b) => a + b, 0)
  }

  const totalSelected = Object.values(selections)
    .flatMap(s => Object.values(s))
    .reduce((a, b) => a + b, 0)

  return (
    <div className="topic-selector-container">
      <div className="selector-header">
        <span className="pixel-label">
          {questionType.toUpperCase()} TOPICS 
          <span className="total-badge">{totalSelected} selected</span>
        </span>
      </div>

      <div className="topics-grid">
        {Object.entries(topics).map(([topic, subtopics]) => (
          <div key={topic} className={`topic-group ${expanded[topic] ? 'is-expanded' : ''}`}>
            <div className="topic-row">
              <button className="expand-btn" onClick={() => setExpanded(e => ({...e, [topic]: !e[topic]}))}>
                {expanded[topic] ? '▼' : '▶'}
              </button>
              
              <label className="topic-main-label">
                <input 
                  type="checkbox" 
                  checked={!!selections[topic]} 
                  onChange={() => toggleTopic(topic)} 
                />
                <span className="topic-name">{topic}</span>
              </label>

              <div className="topic-input-wrapper">
                <input
                  type="number"
                  className="count-input main"
                  value={getTopicTotal(topic)}
                  onChange={(e) => setTopicTotal(topic, parseInt(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>

            {expanded[topic] && (
              <div className="subtopic-list">
                {subtopics.map(sub => (
                  <div key={sub} className="subtopic-row">
                    <span className="subtopic-name">{sub}</span>
                    <input
                      type="number"
                      className="count-input sub"
                      value={selections[topic]?.[sub] || 0}
                      onChange={(e) => setCount(topic, sub, parseInt(e.target.value))}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .topic-selector-container {
          background: white;
          border: 3px solid #ffc1e3; /* Pink Light */
          padding: 15px;
        }
        .selector-header { margin-bottom: 15px; border-bottom: 2px dashed #ffc1e3; padding-bottom: 10px; }
        .total-badge { margin-left: 10px; background: #ff4081; color: white; padding: 2px 6px; font-size: 10px; }
        .topics-grid { display: flex; flex-direction: column; gap: 8px; max-height: 400px; overflow-y: auto; }
        .topic-group { border: 1px solid #eee; border-radius: 4px; }
        .topic-row { display: flex; align-items: center; padding: 10px; gap: 10px; background: #fafafa; }
        .expand-btn { background: none; border: none; cursor: pointer; font-size: 12px; width: 20px; }
        .topic-main-label { flex: 1; display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .topic-name { font-weight: bold; font-size: 14px; }
        .subtopic-list { padding: 10px 10px 10px 40px; background: white; border-top: 1px solid #eee; display: flex; flex-direction: column; gap: 5px; }
        .subtopic-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #666; }
        .count-input { 
          width: 50px; 
          border: 2px solid #ffc1e3; 
          padding: 4px; 
          font-family: 'Courier New', monospace; 
          text-align: center;
        }
        .count-input.main { background: #fffde7; border-color: #fdd835; }
      `}</style>
    </div>
  )
}