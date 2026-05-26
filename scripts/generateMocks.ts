import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

// ─── Types ────────────────────────────────────────────────────────────────────

type PhaseKey = 'phase1' | 'phase2a'

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
  /** Derive a case ID from a question ID (format differs between phases) */
  getCaseId: (questionId: string) => string
  getSBACount: (topic: string) => number
  getSBALimit: (topicCounts: Record<string, number>) => number
  logSBACapacity: (topicCounts: Record<string, number>, maxMocks: number) => void
  selectSAQCases: (casesByTopic: Record<string, CaseGroup[]>, mockNumber: number) => CaseGroup[]
  getSAQLimit: (casesByTopic: Record<string, CaseGroup[]>) => number
  logSAQCapacity: (casesByTopic: Record<string, CaseGroup[]>, maxMocks: number) => void
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

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

async function fetchAll(table: string, columns: string): Promise<Question[]> {
  let allData: Question[] = []
  let from = 0
  const step = 999

  while (true) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + step)
    if (error) throw error
    if (!data || data.length === 0) break
    allData = [...allData, ...(data as unknown as Question[])]
    if (data.length <= step) break
    from += step + 1
  }

  return allData
}

function buildCasesByTopic(
  allSAQs: Question[],
  getCaseId: (id: string) => string,
  excludedTopics: string[] = []
): Record<string, CaseGroup[]> {
  const cases: Record<string, CaseGroup> = {}

  allSAQs.forEach(question => {
    if (excludedTopics.some(ex => question.topic.includes(ex))) return

    const caseId = getCaseId(question.id)
    if (!cases[caseId]) {
      cases[caseId] = { caseId, topic: question.topic, ids: [], totalMarks: 0 }
    }
    cases[caseId].ids.push(question.id)
    cases[caseId].totalMarks += question.marks ?? 0
  })

  const casesByTopic: Record<string, CaseGroup[]> = {}
  Object.values(cases).forEach(caseGroup => {
    caseGroup.ids.sort((a, b) => a.localeCompare(b))
    if (!casesByTopic[caseGroup.topic]) casesByTopic[caseGroup.topic] = []
    casesByTopic[caseGroup.topic].push(caseGroup)
  })

  return casesByTopic
}

// ─── Core generators (shared by both phases) ─────────────────────────────────

async function generateSBAMock(
  allQuestions: Question[],
  mockNumber: number,
  config: PhaseMockConfig
): Promise<void> {
  const byTopic: Record<string, Question[]> = {}
  allQuestions.forEach(q => {
    if (!byTopic[q.topic]) byTopic[q.topic] = []
    byTopic[q.topic].push(q)
  })

  const selected = Object.keys(byTopic).flatMap(topic =>
    selectRotatedItems(byTopic[topic] ?? [], config.getSBACount(topic), mockNumber).map(q => q.id)
  )
  const finalIds = shuffle(selected)

  const mock = {
  id: `${config.phase}_sba_mock_${String(mockNumber).padStart(3, '0')}`,
  name: `${config.label} SBA Mock Paper ${mockNumber}`,
  type: 'sba' as const,
  section: config.phase,
  question_ids: JSON.stringify(finalIds),
    total_questions: finalIds.length,
    time_seconds: 9000,
    is_active: true,
  }

  const { error } = await supabase.from('mocks').upsert(mock)
if (error) throw new Error(`Upsert failed for ${mock.id}: ${JSON.stringify(error)}`)
  console.log(`✅ ${config.label} SBA Mock ${mockNumber} (${finalIds.length} Qs)`)
}

async function generateSAQMock(
  allSAQs: Question[],
  mockNumber: number,
  config: PhaseMockConfig
): Promise<void> {
  const casesByTopic = buildCasesByTopic(allSAQs, config.getCaseId)
  const selectedCases = config.selectSAQCases(casesByTopic, mockNumber)

  const selectedIds = selectedCases.flatMap(c => c.ids)
  const totalMarks = selectedCases.reduce((sum, c) => sum + c.totalMarks, 0)

  const mock = {
    id: `${config.phase}_saq_mock_${String(mockNumber).padStart(3, '0')}`,
    name: `${config.label} SAQ Mock Paper ${mockNumber}`,
    type: 'saq' as const,
    section: config.phase,
    question_ids: JSON.stringify(selectedIds),
    total_marks: totalMarks,
    total_questions: selectedIds.length,
    time_seconds: 7200,
    is_active: true,
  }

  const { error } = await supabase.from('mocks').upsert(mock)
if (error) throw new Error(`Upsert failed for ${mock.id}: ${JSON.stringify(error)}`)
  console.log(`✅ ${config.label} SAQ Mock ${mockNumber} (${totalMarks} marks, ${selectedCases.length} cases)`)
}

async function generatePhaseMocks(config: PhaseMockConfig): Promise<void> {
  const sbaData = shuffle(await fetchAll(config.sbaTable, 'id, topic, subtopic'))
  const saqData = shuffle(await fetchAll(config.saqTable, 'id, topic, subtopic, marks'))

  // SBA capacity
  const sbaTopicCounts: Record<string, number> = {}
  sbaData.forEach(q => {
    sbaTopicCounts[q.topic] = (sbaTopicCounts[q.topic] || 0) + 1
  })
  const maxSBAMocks = config.getSBALimit(sbaTopicCounts)
  config.logSBACapacity(sbaTopicCounts, maxSBAMocks)

  // SAQ capacity
  const casesByTopic = buildCasesByTopic(saqData, config.getCaseId)
  const maxSAQMocks = config.getSAQLimit(casesByTopic)
  config.logSAQCapacity(casesByTopic, maxSAQMocks)

  const total = Math.max(maxSBAMocks, maxSAQMocks)
  console.log(`Generating ${config.label} mocks (${total} iterations)...\n`)

  for (let i = 1; i <= total; i++) {
    if (i <= maxSBAMocks) await generateSBAMock(sbaData, i, config)
    if (i <= maxSAQMocks) await generateSAQMock(saqData, i, config)
  }
}

// ─── Phase 1 config ───────────────────────────────────────────────────────────

const PHASE1_SHORT_SBA_TOPICS = ['prescribing', 'critical numbers'] // Lowercase for safe matching
const PHASE1_SAQ_TARGET_CASES = 12

const PHASE1_CONFIG: PhaseMockConfig = {
  phase: 'phase1',
  label: 'Phase 1',
  sbaTable: 'medical_questions',
  saqTable: 'phase1saq',
  getCaseId: (id: string) => id.replace(/_q\d+$/i, ''),

  getSBACount(topic) {
    // Check if the lowercase topic includes any of our short topics
    const isShortTopic = PHASE1_SHORT_SBA_TOPICS.some(s => topic.toLowerCase().includes(s))
    return isShortTopic ? 5 : 10
  },

  getSBALimit(topicCounts) {
    const capacities = Object.keys(topicCounts).map(topic => {
      const isShortTopic = PHASE1_SHORT_SBA_TOPICS.some(s => topic.toLowerCase().includes(s))
      return Math.floor(topicCounts[topic] / (isShortTopic ? 5 : 10))
    })
    return capacities.length > 0 ? Math.min(...capacities) : 0
  },

  logSBACapacity(topicCounts, maxMocks) {
    console.log('\n📊 Phase 1 SBA Topic Capacity:')
    const rows = Object.keys(topicCounts).map(topic => {
      const isShortTopic = PHASE1_SHORT_SBA_TOPICS.some(s => topic.toLowerCase().includes(s))
      const required = isShortTopic ? 5 : 10
      const capacity = Math.floor(topicCounts[topic] / required)
      return { topic, questions: topicCounts[topic], required, capacity }
    })
    rows
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
    if (remainingNeeded === 0) return selected

    const remaining = shuffle(
      Object.values(casesByTopic).flat().filter(c => !selectedIds.has(c.caseId))
    )
    selected.push(...selectRotatedItems(remaining, remainingNeeded, mockNumber))
    return selected
  },

  getSAQLimit(casesByTopic) {
    const topics = Object.keys(casesByTopic)
    if (topics.length === 0) return 0
    const minPerSection = Math.min(...topics.map(t => casesByTopic[t]?.length ?? 0))
    const totalCases = topics.reduce((sum, t) => sum + (casesByTopic[t]?.length ?? 0), 0)
    return Math.min(minPerSection, Math.floor(totalCases / PHASE1_SAQ_TARGET_CASES))
  },

  logSAQCapacity(casesByTopic, maxMocks) {
    console.log('📊 Phase 1 SAQ Section Capacity:')
    const topics = Object.keys(casesByTopic).sort()
    const minPerSection = Math.min(...topics.map(t => casesByTopic[t]?.length ?? 0))
    topics.forEach(topic => {
      const count = casesByTopic[topic]?.length ?? 0
      console.log(`  ${count === minPerSection ? '🔴' : '  '} ${topic}: ${count} cases`)
    })
    const totalCases = topics.reduce((sum, t) => sum + (casesByTopic[t]?.length ?? 0), 0)
    const totalCapacity = Math.floor(totalCases / PHASE1_SAQ_TARGET_CASES)
    console.log(`  ${totalCapacity === maxMocks ? '🔴' : '  '} [Total] ${totalCases} cases ÷ ${PHASE1_SAQ_TARGET_CASES} per paper = ${totalCapacity} mocks`)
    console.log(`  → Phase 1 SAQ limit: ${maxMocks} mocks\n`)
  },
}

// ─── Phase 2a config ──────────────────────────────────────────────────────────

const PHASE2A_SBA_HIGH_YIELD = ['Microbiology', 'Cardiovascular Medicine', 'Gastrointestinal and Hepatic Medicine', 'Neurology']
const PHASE2A_SAQ_HIGH_YIELD = ['Microbiology', 'Respiratory Medicine', 'Cardiovascular Medicine', 'Gastrointestinal and Hepatic Medicine', 'Neurology']
const PHASE2A_SBA_HIGH_YIELD_COUNT = 10
const PHASE2A_SBA_DEFAULT_COUNT = 5
const PHASE2A_SAQ_OTHER_COUNT = 7

const PHASE2A_CONFIG: PhaseMockConfig = {
  phase: 'phase2a',
  label: 'Phase 2a',
  sbaTable: 'questions',
  saqTable: 'saq_questions',
  // Phase 2a question IDs use the first two underscore-delimited segments as the case ID
  getCaseId: (id: string) => id.split('_').slice(0, 2).join('_'),

  getSBACount(topic) {
    return PHASE2A_SBA_HIGH_YIELD.some(hy => topic.includes(hy))
      ? PHASE2A_SBA_HIGH_YIELD_COUNT
      : PHASE2A_SBA_DEFAULT_COUNT
  },

  getSBALimit(topicCounts) {
    const capacities = Object.keys(topicCounts).map(topic => {
      const required = PHASE2A_SBA_HIGH_YIELD.some(hy => topic.includes(hy))
        ? PHASE2A_SBA_HIGH_YIELD_COUNT
        : PHASE2A_SBA_DEFAULT_COUNT
      return Math.floor(topicCounts[topic] / required)
    })
    return capacities.length > 0 ? Math.min(...capacities) : 0
  },

  logSBACapacity(topicCounts, maxMocks) {
    console.log('\n📊 Phase 2a SBA Topic Capacity:')
    const rows = Object.keys(topicCounts).map(topic => {
      const required = PHASE2A_SBA_HIGH_YIELD.some(hy => topic.includes(hy))
        ? PHASE2A_SBA_HIGH_YIELD_COUNT
        : PHASE2A_SBA_DEFAULT_COUNT
      const capacity = Math.floor(topicCounts[topic] / required)
      return { topic, questions: topicCounts[topic], required, capacity }
    })
    rows
      .sort((a, b) => a.capacity - b.capacity)
      .forEach(({ topic, questions, required, capacity }) =>
        console.log(`  ${capacity === maxMocks ? '🔴' : '  '} ${topic}: ${questions}q ÷ ${required} = ${capacity} mocks`)
      )
    console.log(`  → Phase 2a SBA limit: ${maxMocks} mocks\n`)
  },

  selectSAQCases(casesByTopic, mockNumber) {
    const selected: CaseGroup[] = []
    const selectedIds = new Set<string>()

    // 1. One case per high-yield topic (rotating)
    for (const hy of PHASE2A_SAQ_HIGH_YIELD) {
      const key = Object.keys(casesByTopic).find(t => t.includes(hy))
      if (!key) continue
      const pool = casesByTopic[key]
      const picked = pool[(mockNumber - 1) % pool.length]
      selected.push(picked)
      selectedIds.add(picked.caseId)
    }

    // 2. Rotate through "other" topics for the remaining slots
    const otherTopics = Object.keys(casesByTopic)
      .filter(t => !PHASE2A_SAQ_HIGH_YIELD.some(hy => t.includes(hy)))
      .sort()
    const offset = (mockNumber - 1) * PHASE2A_SAQ_OTHER_COUNT

    for (let i = 0; i < PHASE2A_SAQ_OTHER_COUNT; i++) {
      const topic = otherTopics[(offset + i) % otherTopics.length]
      if (!topic) continue
      const pool = casesByTopic[topic]
      const picked = pool[Math.floor((offset + i) / otherTopics.length) % pool.length]
      if (!selectedIds.has(picked.caseId)) {
        selected.push(picked)
        selectedIds.add(picked.caseId)
      }
    }

    return selected
  },

  getSAQLimit(casesByTopic) {
    const hyLimits = PHASE2A_SAQ_HIGH_YIELD.map(hy => {
      const key = Object.keys(casesByTopic).find(t => t.includes(hy))
      return key ? (casesByTopic[key]?.length ?? 0) : 0
    })
    const otherTotal = Object.keys(casesByTopic)
      .filter(t => !PHASE2A_SAQ_HIGH_YIELD.some(hy => t.includes(hy)))
      .reduce((sum, t) => sum + (casesByTopic[t]?.length ?? 0), 0)
    return Math.min(...hyLimits, Math.floor(otherTotal / PHASE2A_SAQ_OTHER_COUNT))
  },

  logSAQCapacity(casesByTopic, maxMocks) {
    console.log('📊 Phase 2a SAQ Topic Capacity:')

    PHASE2A_SAQ_HIGH_YIELD.forEach(hy => {
      const key = Object.keys(casesByTopic).find(t => t.includes(hy))
      const count = key ? (casesByTopic[key]?.length ?? 0) : 0
      console.log(`  ${count === maxMocks ? '🔴' : '  '} [HY] ${hy}: ${count} cases`)
    })

    const otherTopics = Object.keys(casesByTopic).filter(t => !PHASE2A_SAQ_HIGH_YIELD.some(hy => t.includes(hy)))
    const otherTotal = otherTopics.reduce((sum, t) => sum + (casesByTopic[t]?.length ?? 0), 0)
    const otherCapacity = Math.floor(otherTotal / PHASE2A_SAQ_OTHER_COUNT)
    console.log(`  ${otherCapacity === maxMocks ? '🔴' : '  '} [Other] ${otherTotal} cases ÷ ${PHASE2A_SAQ_OTHER_COUNT} per paper = ${otherCapacity} mocks`)
    console.log(`  → Phase 2a SAQ limit: ${maxMocks} mocks\n`)
  },
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const PHASE_CONFIGS: Record<PhaseKey, PhaseMockConfig> = {
  phase1: PHASE1_CONFIG,
  phase2a: PHASE2A_CONFIG,
}

async function main() {
  // Usage:
  //   npx ts-node generateMocks.ts           → generates both phases
  //   npx ts-node generateMocks.ts phase1    → Phase 1 only
  //   npx ts-node generateMocks.ts phase2a   → Phase 2a only
  const arg = process.argv[2] as PhaseKey | 'all' | undefined

  if (arg && arg !== 'all' && !PHASE_CONFIGS[arg]) {
    console.error(`❌ Unknown phase "${arg}". Valid options: phase1, phase2a, all`)
    process.exit(1)
  }

  const phasesToRun: PhaseKey[] = arg && arg !== 'all'
    ? [arg]
    : ['phase1', 'phase2a']

  try {
    for (const phase of phasesToRun) {
      console.log(`\n${'─'.repeat(50)}`)
      console.log(`🚀 Starting ${PHASE_CONFIGS[phase].label} mock generation`)
      console.log('─'.repeat(50))
      await generatePhaseMocks(PHASE_CONFIGS[phase])
    }
    console.log('\n✅ All done!')
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
