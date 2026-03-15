import type { Question } from '@/types'
import { selectQuestions } from './questionUtils'

const PRIORITY_TOPICS = ['Microbiology', 'Respiratory', 'Cardiovascular', 'GI/Hepatic', 'Neurology']
const PRIORITY_COUNT = 10
const DEFAULT_COUNT = 5

export function buildMockPaper(
  bank: Question[],
  topicsIndex: Record<string, string[]>
): Question[] {
  const selections: Record<string, Record<string, number>> = {}

  for (const topic of Object.keys(topicsIndex)) {
    const subtopics = topicsIndex[topic]
    const totalCount = PRIORITY_TOPICS.includes(topic) ? PRIORITY_COUNT : DEFAULT_COUNT
    // Distribute evenly across subtopics, round-robining any remainder
    const perSubtopic = Math.floor(totalCount / subtopics.length)
    const remainder = totalCount % subtopics.length

    selections[topic] = {}
    subtopics.forEach((sub, i) => {
      selections[topic][sub] = perSubtopic + (i < remainder ? 1 : 0)
    })
  }

  return selectQuestions(bank, { selections, seenMode: 'all' })
}