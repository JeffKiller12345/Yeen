import { supabase } from '@/lib/supabase'
import type { Mock, Question, SAQQuestion } from '@/types'

/**
 * Helper to restore the original order of questions based on the ID array
 */
function sortByIdOrder<T extends { id: string }>(items: T[], ids: string[]): T[] {
  const idOrder = ids.reduce<Record<string, number>>((acc, id, i) => {
    acc[id] = i; return acc
  }, {})
  return [...items].sort((a, b) => idOrder[a.id] - idOrder[b.id])
}

export async function fetchMocks(type?: 'sba' | 'saq'): Promise<Mock[]> {
  // Build query dynamically
  let request = supabase
    .from('mocks')
    .select('*')
    .eq('is_active', true)

  if (type) {
    request = request.eq('type', type)
  }

  const { data, error } = await request.order('name')
  
  if (error) {
    console.error('Error fetching mocks:', error)
    return []
  }

  return (data ?? []).map(m => ({
    ...m,
    // JSON columns in Supabase usually return as objects/arrays automatically, 
    // but this check keeps it robust against stringified storage.
    question_ids: Array.isArray(m.question_ids) 
      ? m.question_ids 
      : JSON.parse(m.question_ids || '[]')
  }))
}

export async function loadSBAMock(mock: Mock): Promise<Question[]> {
  const ids = mock.question_ids as string[]
  if (!ids.length) return []

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .in('id', ids)

  if (error) {
    console.error('Error loading SBA items:', error)
    throw error // Better to throw so the UI can show an error state
  }

  const parsed = (data ?? []).map(q => ({
    ...q,
    options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
  }))

  if (parsed.length !== ids.length) {
    console.warn(`Mock ${mock.id}: Missing ${ids.length - parsed.length} questions.`)
  }

  return sortByIdOrder(parsed, ids)
}

export async function loadSAQMock(mock: Mock): Promise<SAQQuestion[]> {
  const ids = mock.question_ids as string[]
  if (!ids.length) return []

  const { data, error } = await supabase
    .from('saq_questions')
    .select('*')
    .in('id', ids)

  if (error) {
    console.error('Error loading SAQ items:', error)
    throw error
  }

  const parsed = (data ?? []).map(q => ({
    ...q,
    marks: Number(q.marks) || 0,
    acceptable_answers: Array.isArray(q.acceptable_answers)
      ? q.acceptable_answers
      : JSON.parse(q.acceptable_answers || '[]')
  }))

  return sortByIdOrder(parsed, ids)
}