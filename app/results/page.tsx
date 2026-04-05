'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizSession } from '@/lib/quizSession'
import ResultsSummary from '@/components/ResultsSummary'
import SAQResultsSummary from '@/components/SAQResultsSummary'
import KawaiiLayout from '@/components/KawaiiLayout'
import type { QuizResult, SAQResult, QuizSession, SAQQuestion } from '@/types'

export default function ResultsPage() {
  const router = useRouter()
  const init = useQuizSession((s: QuizSession) => s.init)
  const initSAQ = useQuizSession((s: QuizSession) => s.initSAQ) // Added this
  const handleScoreOverride = (questionId: string, overrideCorrect: boolean) => {
  setResults(prev =>
    (prev as SAQResult[]).map(r =>
      r.question.id === questionId
        ? { ...r, awarded: overrideCorrect }
        : r
    )
  )
}
  const [results, setResults] = useState<QuizResult[] | SAQResult[] | null>(null)
  const [quizType, setQuizType] = useState<'mcq' | 'saq'>('mcq')
  const [timeTaken, setTimeTaken] = useState(0) // Fixed destructuring

  useEffect(() => {
    const raw = sessionStorage.getItem('quizResults')
    const type = sessionStorage.getItem('quizType') as 'mcq' | 'saq'
    const time = sessionStorage.getItem('quizTimeTaken')

    if (!raw) { 
      router.replace('/')
      return 
    }

    setResults(JSON.parse(raw))
    setQuizType(type ?? 'mcq')
    setTimeTaken(Number(time ?? 0))

    // Optional: Only clear after you're sure you don't need a page refresh
    // sessionStorage.removeItem('quizResults')
    // sessionStorage.removeItem('quizType')
    // sessionStorage.removeItem('quizTimeTaken')
  }, [router])

  if (!results) return null

  const handleReviewFlagged = () => {
    const flagged = (results as any[])
      .filter(r => r.flagged)
      .map(r => r.question);

    if (flagged.length === 0) return;

    if (quizType === 'mcq') {
      // Remove 'mcq' and cast the questions to the correct type
      init(flagged as any[], 'study', 'immediate', 'mcq');
    } else {
      initSAQ(flagged as SAQQuestion[], 'study', 'immediate');
    }
  
    router.push('/quiz');
  }

  return (
    <KawaiiLayout title="✿ RESULTS ✿" subtitle="Here's how you did!">
      <div className="results-container">
        {quizType === 'saq' ? (
          <SAQResultsSummary
            results={results as SAQResult[]}
            timeTakenSeconds={timeTaken}
            onScoreOverride={handleScoreOverride}
          />
        ) : (
          <ResultsSummary
            results={results as QuizResult[]}
            timeTakenSeconds={timeTaken}
            onReviewFlagged={handleReviewFlagged}
          />
        )}
      </div>

      <style jsx>{`
        .results-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
      `}</style>
    </KawaiiLayout>
  )
}
