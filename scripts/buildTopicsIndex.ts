import fs from 'fs'
import path from 'path'

function parseTopicsFile(raw: string): Record<string, string[]> {
  const index: Record<string, string[]> = {}
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

function main() {
  const inputPath = path.join(process.cwd(), 'data/topics.txt')
  const outputPath = path.join(process.cwd(), 'data/topicsIndex.json')

  if (!fs.existsSync(inputPath)) {
    console.error('❌  src/data/topics.txt not found')
    process.exit(1)
  }

  const raw = fs.readFileSync(inputPath, 'utf-8')
  const index = parseTopicsFile(raw)
  const topicCount = Object.keys(index).length
  const subtopicCount = Object.values(index).flat().length

  fs.writeFileSync(outputPath, JSON.stringify(index, null, 2))
  console.log(`✅  Built topicsIndex.json — ${topicCount} topics, ${subtopicCount} subtopics`)
  console.log(`    Output: ${outputPath}`)
}

main()