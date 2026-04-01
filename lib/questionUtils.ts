import type { Question } from '@/types'
import { getSeenIds } from '@/lib/seenTracker'

// Matches the SelectionConfig in types/index.ts but explicit here
interface LocalSelectionConfig {
  selections: Record<string, Record<string, number>>
  seenMode: 'all' | 'unseen' | 'seen'
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function selectQuestions(
  bank: Question[],
  config: LocalSelectionConfig
): Question[] {
  const { selections, seenMode } = config
  const seen = getSeenIds()
  const result: Question[] = []

  for (const [topic, subtopics] of Object.entries(selections)) {
    // Sum the requested count across all subtopics for this topic
    const totalCount = Object.values(subtopics).reduce((sum, count) => sum + count, 0)
    if (totalCount === 0) continue

    // Pool ALL questions for the topic regardless of subtopic, then sample randomly
    let pool = bank.filter(q => q.topic === topic)

    if (seenMode === 'unseen') {
      pool = pool.filter(q => !seen.has(q.id))
    } else if (seenMode === 'seen') {
      pool = pool.filter(q => seen.has(q.id))
    }

    result.push(...shuffle(pool).slice(0, totalCount))
  }

  return shuffle(result)
}