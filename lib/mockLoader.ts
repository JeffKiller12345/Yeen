import { supabase } from '@/lib/supabase'
import type { Mock, Question, SAQQuestion } from '@/types'
import { PHASE_CONFIG, type StudentPhase } from '@/lib/phaseConfig'

/**
 * Helper to restore the original order of questions based on the ID array
 */
function sortByIdOrder<T extends { id: string }>(items: T[], ids: string[]): T[] {
  const idOrder = ids.reduce<Record<string, number>>((acc, id, i) => {
    acc[id] = i; return acc
  }, {})
  return [...items].sort((a, b) => idOrder[a.id] - idOrder[b.id])
}

function normalizeId<T extends { id: unknown }>(row: T): T & { id: string } {
  return { ...row, id: String(row.id) }
}

function isMissingSectionColumnError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  if (error.code === 'PGRST204') return true
  return typeof error.message === 'string' && /section/i.test(error.message)
}

function inferMockPhase(mock: Partial<Mock>): StudentPhase | null {
  if (mock.section === 'phase1' || mock.section === 'phase2a') {
    return mock.section
  }

  if (typeof mock.id === 'string') {
    if (mock.id.startsWith('phase1_')) return 'phase1'
    if (mock.id.startsWith('phase2a_')) return 'phase2a'
  }

  if (typeof mock.name === 'string') {
    if (/^phase 1\b/i.test(mock.name)) return 'phase1'
    if (/^phase 2a\b/i.test(mock.name)) return 'phase2a'
  }

  return null
}

export async function fetchMocks(phase: StudentPhase, type?: 'sba' | 'saq'): Promise<Mock[]> {
  const section = PHASE_CONFIG[phase].mockSection
  // Build query dynamically
  let request = supabase
    .from('mocks')
    .select('*')
    .eq('is_active', true)
    .eq('section', section)

  if (type) {
    request = request.eq('type', type)
  }

  let { data, error } = await request.order('name')
  const shouldFallbackToLegacyMocks = isMissingSectionColumnError(error)

  if (shouldFallbackToLegacyMocks) {
    let fallback = supabase
      .from('mocks')
      .select('*')
      .eq('is_active', true)
    if (type) {
      fallback = fallback.eq('type', type)
    }
    const fallbackResult = await fallback.order('name')
    data = fallbackResult.data
    error = fallbackResult.error
  }
  
  if (error) {
    console.error('Error fetching mocks:', error)
    return []
  }

  return (data ?? [])
    .filter(m => {
      const inferredPhase = inferMockPhase(m)
      return inferredPhase === null || inferredPhase === phase
    })
    .map(m => ({
    ...m,
    // JSON columns in Supabase usually return as objects/arrays automatically, 
    // but this check keeps it robust against stringified storage.
    question_ids: Array.isArray(m.question_ids) 
      ? m.question_ids 
      : JSON.parse(m.question_ids || '[]')
    }))
}

export async function loadSBAMock(mock: Mock, phase: StudentPhase): Promise<Question[]> {
  const ids = mock.question_ids as string[]
  if (!ids.length) return []

  const mcqTable = PHASE_CONFIG[phase].mcqTable
  const { data, error } = await supabase
    .from(mcqTable)
    .select('*')
    .in('id', ids)

  if (error) {
    console.error('Error loading SBA items:', error)
    throw error // Better to throw so the UI can show an error state
  }

  const parsed = (data ?? []).map(q => ({
    ...normalizeId(q),
    options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
  }))

  if (parsed.length !== ids.length) {
    console.warn(`Mock ${mock.id}: Missing ${ids.length - parsed.length} questions.`)
  }

  return sortByIdOrder(parsed, ids)
}

export async function loadSAQMock(mock: Mock, phase: StudentPhase): Promise<SAQQuestion[]> {
  const ids = mock.question_ids as string[]
  if (!ids.length) return []

  const saqTable = PHASE_CONFIG[phase].saqTable
  const { data, error } = await supabase
    .from(saqTable)
    .select('*')
    .in('id', ids)

  if (error) {
    console.error('Error loading SAQ items:', error)
    throw error
  }

  const parsed = (data ?? []).map(q => ({
    ...normalizeId(q),
    marks: Number(q.marks) || 0,
    acceptable_answers: Array.isArray(q.acceptable_answers)
      ? q.acceptable_answers
      : JSON.parse(q.acceptable_answers || '[]')
  }))

  return sortByIdOrder(parsed, ids)
}
