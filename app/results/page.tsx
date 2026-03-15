'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizSession } from '@/lib/quizSession'
import ResultsSummary from '@/components/ResultsSummary'
import KawaiiLayout from '@/components/KawaiiLayout'
import type { QuizSession, QuizResult } from '@/types'

export default function ResultsPage() {
  const router = useRouter()
  const init = useQuizSession((s: QuizSession) => s.init)
  const [results, setResults] = useState<QuizResult[] | null>(null)
  const [timeTaken, setTimeTaken] = useState(0)

  useEffect(() => {
    const raw = sessionStorage.getItem('quizResults')
    const time = sessionStorage.getItem('quizTimeTaken')
    if (!raw) { router.replace('/'); return }
    setResults(JSON.parse(raw))
    setTimeTaken(Number(time ?? 0))
    // Clean up sessionStorage
    sessionStorage.removeItem('quizResults')
    sessionStorage.removeItem('quizTimeTaken')
  }, [])

  if (!results) return null

  const handleReviewFlagged = () => {
    const flaggedQuestions = results
      .filter(r => r.flagged)
      .map(r => r.question)
    init(flaggedQuestions, 'study', 'immediate')
    router.push('/quiz')
  }

  return (
    <KawaiiLayout
      title="✿ RESULTS ✿"
      subtitle="Here's how you did — keep going!"
    >
      <ResultsSummary
        results={results}
        timeTakenSeconds={timeTaken}
        onReviewFlagged={handleReviewFlagged}
      />
    </KawaiiLayout>
  )
}