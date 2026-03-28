const MCQ_KEY = 'medquiz_seen_ids'
const SAQ_KEY = 'medquiz_seen_saq_ids'

export function getSeenIds(type: 'mcq' | 'saq' = 'mcq'): Set<string> {
  const key = type === 'saq' ? SAQ_KEY : MCQ_KEY
  try {
    const raw = localStorage.getItem(key)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}

export function markSeen(ids: string[], type: 'mcq' | 'saq' = 'mcq') {
  const key = type === 'saq' ? SAQ_KEY : MCQ_KEY
  const current = getSeenIds(type)
  ids.forEach(id => current.add(id))
  localStorage.setItem(key, JSON.stringify([...current]))
}

export function clearSeen() {
  localStorage.removeItem(MCQ_KEY)
  localStorage.removeItem(SAQ_KEY)
}

export function filterBySeenStatus<T extends { id: string }>(
  questions: T[],
  mode: 'all' | 'unseen' | 'seen'
): T[] {
  if (mode === 'all') return questions
  const seen = getSeenIds()
  return questions.filter(q => mode === 'unseen' ? !seen.has(q.id) : seen.has(q.id))
}