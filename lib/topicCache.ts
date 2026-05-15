import { supabase } from '@/lib/supabase'
type CacheEntry = {
  data: { id: string; topic: string; subtopic: string }[]
  fetchedAt: number
}

const cache: Record<string, CacheEntry> = {}
const TTL = Infinity

export async function getCachedTopicMeta(
  table: 'questions' | 'medical_questions' | 'saq_questions'
): Promise<{ id: string; topic: string; subtopic: string }[]> {
  const now = Date.now()
  if (cache[table] && now - cache[table].fetchedAt < TTL) {
    return cache[table].data
  }
  
  let allData: { id: string; topic: string; subtopic: string }[] = []
  let from = 0
  const step = 1000
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from(table)
      .select('id, topic, subtopic')
      .range(from, from + step - 1)

    if (error || !data) break
    allData.push(...data.map((row: any) => ({ ...row, id: String(row.id) })))
    hasMore = data.length === step
    from += step
  }

  cache[table] = { data: allData, fetchedAt: now }
  return allData
}
