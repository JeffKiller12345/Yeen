import type { Question, SAQQuestion } from '@/types'

const PRIORITY_TOPICS = ['Microbiology', 'Respiratory', 'Cardiovascular', 'GI/Hepatic', 'Neurology']

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function buildMockPaper(
  bank: Question[]
): Question[] {
  // 1. Group questions by topic ONCE (O(N))
  const byTopic: Record<string, Question[]> = {}
  for (const q of bank) {
    if (!byTopic[q.topic]) byTopic[q.topic] = []
    byTopic[q.topic].push(q)
  }

  const result: Question[] = []
  
  // 2. Iterate through the grouped topics
  for (const topic in byTopic) {
    const count = PRIORITY_TOPICS.includes(topic) ? 10 : 5
    const pool = byTopic[topic]
    // Shuffle the pool and take the required amount
    result.push(...shuffle(pool).slice(0, count))
  }

  return shuffle(result)
}

export function buildSAQMockPaper(
  bank: SAQQuestion[]
): { questions: SAQQuestion[]; totalTimeSeconds: number } {
  const byTopic: Record<string, SAQQuestion[]> = {}
  for (const q of bank) {
    if (!byTopic[q.topic]) byTopic[q.topic] = []
    byTopic[q.topic].push(q)
  }

  const selected: SAQQuestion[] = []
  const allTopics = Object.keys(byTopic)
  const otherTopics = allTopics.filter(t => !PRIORITY_TOPICS.includes(t))

  // 1 question from each high yield topic
  for (const topic of PRIORITY_TOPICS) {
    const topicQs = byTopic[topic]
    if (topicQs && topicQs.length > 0) {
      selected.push(...shuffle(topicQs).slice(0, 1))
    }
  }

  // 7 from random other topics
  const shuffledOthers = shuffle(otherTopics)
  let count = 0
  for (const topic of shuffledOthers) {
    if (count >= 7) break
    const topicQs = byTopic[topic]
    if (topicQs && topicQs.length > 0) {
      selected.push(...shuffle(topicQs).slice(0, 1))
      count++
    }
  }

  const shuffled = shuffle(selected)
  // Safety check on marks
  const totalMarks = shuffled.reduce((a, q) => a + (Number(q.marks) || 0), 0)
  const totalTimeSeconds = totalMarks * 75

  return { questions: shuffled, totalTimeSeconds }
}