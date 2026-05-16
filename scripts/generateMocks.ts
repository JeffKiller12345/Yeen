import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

type PhaseKey = 'phase1'

interface Question {
  id: string
  topic: string
  subtopic: string
  marks?: number
}

interface CaseGroup {
  caseId: string
  topic: string
  ids: string[]
  totalMarks: number
}

interface PhaseMockConfig {
  phase: PhaseKey
  label: string
  sbaTable: string
  saqTable: string
  getSBACount: (topic: string) => number
  getSBALimit: (topicCounts: Record<string, number>) => number
  logSBACapacity: (topicCounts: Record<string, number>, maxMocks: number) => void
  selectSAQCases: (casesByTopic: Record<string, CaseGroup[]>, mockNumber: number) => CaseGroup[]
  getSAQLimit: (casesByTopic: Record<string, CaseGroup[]>) => number
  logSAQCapacity: (casesByTopic: Record<string, CaseGroup[]>, maxMocks: number) => void
}

const PHASE1_SHORT_SBA_TOPICS = ['H. Prescribing', 'J. Critical Numbers']
const PHASE1_SAQ_TARGET_CASES = 12

const PHASE_CONFIG: PhaseMockConfig = {
  phase: 'phase1',
  label: 'Phase 1',
  sbaTable: 'medical_questions',
  saqTable: 'phase1saq',
  getSBACount(topic) {
    return PHASE1_SHORT_SBA_TOPICS.some(shortTopic => topic.startsWith(shortTopic)) ? 5 : 10
  },
  getSBALimit(topicCounts) {
    const capacities = Object.keys(topicCounts).map(topic =>
      Math.floor(topicCounts[topic] / (PHASE1_SHORT_SBA_TOPICS.some(shortTopic => topic.startsWith(shortTopic)) ? 5 : 10))
    )
    return capacities.length > 0 ? Math.min(...capacities) : 0
  },
  logSBACapacity(topicCounts, maxMocks) {
    console.log('\n📊 Phase 1 SBA Topic Capacity:')
    const capacities = Object.keys(topicCounts).map(topic => {
      const required = PHASE1_SHORT_SBA_TOPICS.some(shortTopic => topic.startsWith(shortTopic)) ? 5 : 10
      const capacity = Math.floor(topicCounts[topic] / required)
      return { topic, questions: topicCounts[topic], required, capacity }
    })

    capacities
      .sort((a, b) => a.capacity - b.capacity)
      .forEach(({ topic, questions, required, capacity }) =>
        console.log(`  ${capacity === maxMocks ? '🔴' : '  '} ${topic}: ${questions}q ÷ ${required} = ${capacity} mocks`)
      )

    console.log(`  → Phase 1 SBA limit: ${maxMocks} mocks\n`)
  },
  selectSAQCases(casesByTopic, mockNumber) {
    const selected: CaseGroup[] = []
    const selectedIds = new Set<string>()
    const topics = Object.keys(casesByTopic).sort()

    for (const topic of topics) {
      const pool = casesByTopic[topic] ?? []
      if (pool.length === 0) continue

      const picked = pool[(mockNumber - 1) % pool.length]
      selected.push(picked)
      selectedIds.add(picked.caseId)
    }

    const remainingNeeded = Math.max(0, PHASE1_SAQ_TARGET_CASES - selected.length)
    if (remainingNeeded === 0) {
      return selected
    }

    const remainingCases = shuffle(
      Object.values(casesByTopic)
        .flat()
        .filter(caseGroup => !selectedIds.has(caseGroup.caseId))
    )

    selected.push(...selectRotatedItems(remainingCases, remainingNeeded, mockNumber))
    return selected
  },
  getSAQLimit(casesByTopic) {
    const topics = Object.keys(casesByTopic)
    if (topics.length === 0) return 0

    const minPerSection = Math.min(...topics.map(topic => casesByTopic[topic]?.length ?? 0))
    const totalCases = topics.reduce((sum, topic) => sum + (casesByTopic[topic]?.length ?? 0), 0)
    return Math.min(minPerSection, Math.floor(totalCases / PHASE1_SAQ_TARGET_CASES))
  },
  logSAQCapacity(casesByTopic, maxMocks) {
    console.log('📊 Phase 1 SAQ Section Capacity:')
    const topics = Object.keys(casesByTopic).sort()
    const minPerSection = Math.min(...topics.map(topic => casesByTopic[topic]?.length ?? 0))

    topics.forEach(topic => {
      const caseCount = casesByTopic[topic]?.length ?? 0
      console.log(`  ${caseCount === minPerSection ? '🔴' : '  '} ${topic}: ${caseCount} cases`)
    })

    const totalCases = topics.reduce((sum, topic) => sum + (casesByTopic[topic]?.length ?? 0), 0)
    const totalCapacity = Math.floor(totalCases / PHASE1_SAQ_TARGET_CASES)
    console.log(`  ${totalCapacity === maxMocks ? '🔴' : '  '} [Total] ${totalCases} cases ÷ ${PHASE1_SAQ_TARGET_CASES} per paper = ${totalCapacity} mocks`)
    console.log(`  → Phase 1 SAQ limit: ${maxMocks} mocks\n`)
  },
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function selectRotatedItems<T>(pool: T[], count: number, mockNumber: number): T[] {
  if (count <= 0 || pool.length === 0) return []

  const offset = ((mockNumber - 1) * count) % pool.length
  const rotated = [...pool.slice(offset), ...pool.slice(0, offset)]
  return rotated.slice(0, Math.min(count, pool.length))
}

function getCaseId(id: string): string {
  return String(id).replace(/_Q\d+$/, '')
}

async function fetchAll(table: string, columns: string): Promise<Question[]> {
  let allData: Question[] = []
  let from = 0
  const step = 999

  while (true) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + step)
    if (error) throw error
    if (!data || data.length === 0) break

    allData = [...allData, ...data as unknown as Question[]]
    if (data.length <= step) break
    from += step + 1
  }

  return allData
}

function buildCasesByTopic(allSAQs: Question[], excludedTopics: string[] = []): Record<string, CaseGroup[]> {
  const cases: Record<string, CaseGroup> = {}

  allSAQs.forEach(question => {
    if (excludedTopics.some(excludedTopic => question.topic.includes(excludedTopic))) return

    const caseId = getCaseId(question.id)
    if (!cases[caseId]) {
      cases[caseId] = {
        caseId,
        topic: question.topic,
        ids: [],
        totalMarks: 0,
      }
    }

    cases[caseId].ids.push(question.id)
    cases[caseId].totalMarks += question.marks ?? 0
  })

  const casesByTopic: Record<string, CaseGroup[]> = {}

  Object.values(cases).forEach(caseGroup => {
    caseGroup.ids.sort((a, b) => a.localeCompare(b))
    if (!casesByTopic[caseGroup.topic]) {
      casesByTopic[caseGroup.topic] = []
    }
    casesByTopic[caseGroup.topic].push(caseGroup)
  })

  return casesByTopic
}

async function generateSBAMock(
  allQuestions: Question[],
  mockNumber: number,
  config: PhaseMockConfig
): Promise<void> {
  const byTopic: Record<string, Question[]> = {}
  allQuestions.forEach(question => {
    if (!byTopic[question.topic]) byTopic[question.topic] = []
    byTopic[question.topic].push(question)
  })

  const selected = Object.keys(byTopic).flatMap(topic =>
    selectRotatedItems(byTopic[topic] ?? [], config.getSBACount(topic), mockNumber).map(question => question.id)
  )
  const finalIds = shuffle(selected)

  const mock = {
    id: `${config.phase}_sba_mock_${String(mockNumber).padStart(3, '0')}`,
    name: `${config.label} SBA Mock Paper ${mockNumber}`,
    type: 'sba' as const,
    section: config.phase,
    question_ids: finalIds,
    total_questions: finalIds.length,
    time_seconds: finalIds.length * 72,
    is_active: true,
  }

  await supabase.from('mocks').upsert(mock)
  console.log(`✅ ${config.label} SBA Mock ${mockNumber} (${finalIds.length} Qs)`)
}

async function generateSAQMock(
  allSAQs: Question[],
  mockNumber: number,
  config: PhaseMockConfig
): Promise<void> {
  const casesByTopic = buildCasesByTopic(allSAQs)
  const selectedCases = config.selectSAQCases(casesByTopic, mockNumber)

  const selectedIds = selectedCases.flatMap(caseGroup => caseGroup.ids)
  const totalMarks = selectedCases.reduce((sum, caseGroup) => sum + caseGroup.totalMarks, 0)

  const mock = {
    id: `${config.phase}_saq_mock_${String(mockNumber).padStart(3, '0')}`,
    name: `${config.label} SAQ Mock Paper ${mockNumber}`,
    type: 'saq' as const,
    section: config.phase,
    question_ids: selectedIds,
    total_marks: totalMarks,
    total_questions: selectedIds.length,
    time_seconds: totalMarks * 75,
    is_active: true,
  }

  await supabase.from('mocks').upsert(mock)
  console.log(`✅ ${config.label} SAQ Mock ${mockNumber} (${totalMarks} marks, ${selectedCases.length} cases)`)
}

async function generatePhaseMocks(config: PhaseMockConfig): Promise<void> {
  const sbaData = shuffle(await fetchAll(config.sbaTable, 'id, topic, subtopic'))
  const saqData = shuffle(await fetchAll(config.saqTable, 'id, topic, subtopic, marks'))

  const sbaTopicCounts: Record<string, number> = {}
  sbaData.forEach(question => {
    sbaTopicCounts[question.topic] = (sbaTopicCounts[question.topic] || 0) + 1
  })

  const maxSBAMocks = config.getSBALimit(sbaTopicCounts)
  config.logSBACapacity(sbaTopicCounts, maxSBAMocks)

  const casesByTopic = buildCasesByTopic(saqData)
  const maxSAQMocks = config.getSAQLimit(casesByTopic)
  config.logSAQCapacity(casesByTopic, maxSAQMocks)

  const finalCount = Math.max(maxSBAMocks, maxSAQMocks)
  console.log(`Generating ${config.label} mocks (${finalCount} iterations)...`)

  for (let index = 1; index <= finalCount; index++) {
    if (index <= maxSBAMocks) await generateSBAMock(sbaData, index, config)
    if (index <= maxSAQMocks) await generateSAQMock(saqData, index, config)
  }
}

async function main() {
  try {
    await generatePhaseMocks(PHASE_CONFIG)
  } catch (error) {
    console.error(error)
  }
}

main()
