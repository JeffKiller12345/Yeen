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
