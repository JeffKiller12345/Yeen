import { supabase } from '@/lib/supabase'
import { getSession } from 'next-auth/react'

async function getUserId(): Promise<string | null> {
  const session = await getSession()
  return session?.user?.email ?? null  // email as unique identifier
}

export async function getSeenIds(type: 'mcq' | 'saq' = 'mcq'): Promise<Set<string>> {
  const userId = await getUserId()
  if (!userId) return new Set()

  let allIds: string[] = []
  let from = 0
  const step = 1000
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('user_seen_questions')
      .select('question_id')
      .eq('user_id', userId)
      .eq('question_type', type)
      .range(from, from + step - 1) // Fetch in increments of 1000

    if (error) {
      console.error('Error fetching seen IDs:', error)
      break
    }

    if (data && data.length > 0) {
      // Extract the IDs and add to our master list
      const batch = data.map(r => r.question_id)
      allIds = [...allIds, ...batch]

      // If we got fewer than 1000, we've hit the end
      if (data.length < step) {
        hasMore = false
      } else {
        from += step
      }
    } else {
      hasMore = false
    }
  }

  return new Set(allIds)
}

export async function markSeen(ids: string[], type: 'mcq' | 'saq' = 'mcq') {
  const userId = await getUserId()
  if (!userId) { console.warn('markSeen: no user session'); return }

  const rows = ids.map(id => ({
    user_id: userId,
    question_id: id,
    question_type: type,
  }))

  const { error } = await supabase
    .from('user_seen_questions')
    .upsert(rows, { onConflict: 'user_id,question_id,question_type' })

  if (error) console.error(error)
}

export async function clearSeen(type?: 'mcq' | 'saq') {
  const userId = await getUserId()
  if (!userId) return

  let query = supabase
    .from('user_seen_questions')
    .delete()
    .eq('user_id', userId)

  if (type) query = query.eq('question_type', type)

  const { error } = await query
  if (error) console.error(error)
}
