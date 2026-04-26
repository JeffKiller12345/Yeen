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

export async function selectQuestions<T extends Pick<Question, 'id' | 'topic' | 'subtopic'>>(
  bank: T[],
  config: LocalSelectionConfig
): Promise<T[]>
  const { selections, seenMode } = config
  const seen = await getSeenIds('mcq')  // now properly awaited
  const result: Question[] = []

  for (const [topic, subtopics] of Object.entries(selections)) {
    for (const [subtopic, count] of Object.entries(subtopics)) {
      if (count <= 0) continue

      let pool = bank.filter(q =>
        q.topic === topic && (subtopic === '' || q.subtopic === subtopic)
      )

      if (seenMode === 'unseen') {
        pool = pool.filter(q => !seen.has(q.id))
      } else if (seenMode === 'seen') {
        pool = pool.filter(q => seen.has(q.id))
      }

      result.push(...shuffle(pool).slice(0, count))
    }
  }

  return shuffle(result)
}
