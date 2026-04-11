import { supabase } from '@/lib/supabase'

export async function getSeenIds(type: 'mcq' | 'saq' = 'mcq'): Promise<Set<string>> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Set()

  const { data, error } = await supabase
    .from('user_seen_questions')
    .select('question_id')
    .eq('user_id', user.id)
    .eq('question_type', type)

  if (error) { console.error(error); return new Set() }
  return new Set(data.map(r => r.question_id))
}

export async function markSeen(ids: string[], type: 'mcq' | 'saq' = 'mcq') {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const rows = ids.map(id => ({
    user_id: user.id,
    question_id: id,
    question_type: type,
  }))

  const { error } = await supabase
    .from('user_seen_questions')
    .upsert(rows, { onConflict: 'user_id,question_id,question_type' })

  if (error) console.error(error)
}

export async function clearSeen(type?: 'mcq' | 'saq') {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  let query = supabase
    .from('user_seen_questions')
    .delete()
    .eq('user_id', user.id)

  if (type) query = query.eq('question_type', type)

  const { error } = await query
  if (error) console.error(error)
}

export async function filterBySeenStatus<T extends { id: string }>(
  questions: T[],
  mode: 'all' | 'unseen' | 'seen',
  type: 'mcq' | 'saq' = 'mcq'
): Promise<T[]> {
  if (mode === 'all') return questions
  const seen = await getSeenIds(type)
  return questions.filter(q => mode === 'unseen' ? !seen.has(q.id) : seen.has(q.id))
}
