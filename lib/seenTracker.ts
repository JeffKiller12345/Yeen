const STORAGE_KEY = 'medquiz_seen_ids'

export function getSeenIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}

export function markSeen(ids: string[]) {
  const current = getSeenIds()
  ids.forEach(id => current.add(id))
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...current]))
}

export function clearSeen() {
  localStorage.removeItem(STORAGE_KEY)
}

export function filterBySeenStatus<T extends { id: string }>(
  questions: T[],
  mode: 'all' | 'unseen' | 'seen'
): T[] {
  if (mode === 'all') return questions
  const seen = getSeenIds()
  return questions.filter(q => mode === 'unseen' ? !seen.has(q.id) : seen.has(q.id))
}