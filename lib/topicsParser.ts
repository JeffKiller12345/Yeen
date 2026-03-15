import fs from 'fs'
import path from 'path'

export type TopicsIndex = Record<string, string[]>

export function parseTopicsFile(raw: string): TopicsIndex {
  const index: TopicsIndex = {}
  let currentTopic = ''
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('- ')) {
      currentTopic = trimmed.slice(2).trim()
      index[currentTopic] = []
    } else if (currentTopic) {
      index[currentTopic].push(trimmed)
    }
  }
  return index
}

// Call this in a build script: npx ts-node scripts/buildTopicsIndex.ts
export function buildIndex() {
  const raw = fs.readFileSync(path.join(process.cwd(), 'src/data/topics.txt'), 'utf-8')
  const index = parseTopicsFile(raw)
  fs.writeFileSync(
    path.join(process.cwd(), 'src/data/topicsIndex.json'),
    JSON.stringify(index, null, 2)
  )
  console.log('Topics index built:', Object.keys(index).length, 'topics')
}