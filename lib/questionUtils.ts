import type { Question } from '@/types'
import { getSeenIds } from '@/lib/seenTracker'
import { getSAQCaseId } from '@/lib/saqCases'

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

export function selectSAQCases<T extends Pick<Question, 'id' | 'topic' | 'subtopic'>>(
  bank: T[],
  selections: Record<string, Record<string, number>>
): T[] {
  const casesByTopic: Record<string, T[][]> = {}
  const caseMap = new Map<string, T[]>()

  for (const question of bank) {
    const caseId = getSAQCaseId(question.id)
    const existing = caseMap.get(caseId)

    if (existing) {
      existing.push(question)
      continue
    }

    caseMap.set(caseId, [question])
  }

  for (const questions of caseMap.values()) {
    const topic = questions[0]?.topic
    if (!topic) continue

    if (!casesByTopic[topic]) {
      casesByTopic[topic] = []
    }

    questions.sort((a, b) => a.id.localeCompare(b.id))
    casesByTopic[topic].push(questions)
  }

  const result: T[] = []

  for (const [topic, subtopics] of Object.entries(selections)) {
    const count = Object.values(subtopics).reduce((sum, value) => sum + (value || 0), 0)
    if (count <= 0) continue

    const selectedCases = shuffle(casesByTopic[topic] ?? []).slice(0, count)
    result.push(...selectedCases.flat())
  }

  return result
}

export async function selectQuestions<T extends Pick<Question, 'id' | 'topic' | 'subtopic'>>(
  bank: T[],
  config: LocalSelectionConfig
): Promise<T[]> {
  const { selections, seenMode } = config
  const seen = await getSeenIds('mcq')
  const result: T[] = []

  for (const [topic, subtopics] of Object.entries(selections)) {
    for (const [subtopic, count] of Object.entries(subtopics)) {
      if (count <= 0) continue

      let pool = bank.filter(q =>
        q.topic === topic && (subtopic === '' || q.subtopic === subtopic)
      )

      if (seenMode === 'unseen') {
        pool = pool.filter(q => !seen.has(String(q.id)))
      } else if (seenMode === 'seen') {
        pool = pool.filter(q => seen.has(String(q.id)))
      }

      result.push(...shuffle(pool).slice(0, count))
    }
  }

  return shuffle(result)
}
