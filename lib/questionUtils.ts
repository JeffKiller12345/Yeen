import type { Question } from '@/types'
import { getSeenIds } from '@/lib/seenTracker'

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

  // 1. Loop through each selected topic
  for (const [topic, subtopics] of Object.entries(selections)) {
    
    // 2. Loop through each specific subtopic inside that topic
    for (const [subtopic, count] of Object.entries(subtopics)) {
      if (count <= 0) continue

      // 3. THE FIX: If subtopic is '', just filter by topic. Otherwise, filter by both.
      let pool = bank.filter(q => 
        q.topic === topic && (subtopic === '' || q.subtopic === subtopic)
      )

      // 4. Apply your seenMode filters
      if (seenMode === 'unseen') {
        pool = pool.filter(q => !seen.has(q.id))
      } else if (seenMode === 'seen') {
        pool = pool.filter(q => seen.has(q.id))
      }

      // 5. Randomly sample 'count' questions from this specific pool
      result.push(...shuffle(pool).slice(0, count))
    }
  }

  // 6. Give the final array one last shuffle
  return shuffle(result)
}
