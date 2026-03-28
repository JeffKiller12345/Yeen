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

  // 1. Fixed useEffect and Fetch Logic
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

      // Build the index
      const index: Record<string, string[]> = {}
      for (const q of data ?? []) {
        if (!index[q.topic]) index[q.topic] = []
        if (!index[q.topic].includes(q.subtopic)) {
          index[q.topic].push(q.subtopic)
        }
      }

      // Sort logic
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
      
      // Reset selections when switching between MCQ and SAQ to prevent state bugs
      setSelections({}) 
    }

    fetchTopics()
  }, [questionType]) // Re-run when switching question types

  // 2. Sync changes to parent
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
    <div className="topic-selector">
        {/* ... Rest of your JSX remains the same ... */}
    </div>
  )
}