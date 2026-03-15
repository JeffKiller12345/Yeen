'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizSession } from '@/lib/quizSession'
import QuizCard from '@/components/QuizCard'
import ProgressBar from '@/components/ProgressBar'
import FlagButton from '@/components/FlagButton'
import Timer from '@/components/Timer'
import KawaiiLayout from '@/components/KawaiiLayout'
import type { AnswerOption, QuizResult, QuizSession } from '@/types'

export default function QuizPage() {
  const router = useRouter()
  const {
  questions, current, answers, flagged, mode, feedbackMode,
  timePerQuestion, answer, toggleFlag, next, prev, finish
  } = useQuizSession()
  const [startTime] = useState(Date.now())
  const [timerKey, setTimerKey] = useState(0) // reset timer on new question

  // Guard: if no questions loaded (e.g. direct navigation), go home
  useEffect(() => {
    if (questions.length === 0) router.replace('/')
  }, [questions])

  if (questions.length === 0) return null

  const q = questions[current]
  const chosen = (answers[q.id] as AnswerOption) ?? null
  const isFlagged = flagged.has(q.id)
  const isExam = mode === 'exam'
  const isLast = current === questions.length - 1

  const handleAnswer = (option: AnswerOption) => {
    answer(q.id, option)
  }

  const handleNext = () => {
    if (isLast) {
      handleFinish()
    } else {
      next()
      setTimerKey(k => k + 1) // reset timer for next question
    }
  }

  const handleFinish = () => {
    finish()
    // Build results array and pass via sessionStorage
    const results: QuizResult[] = questions.map(question => ({
      question,
      chosen: (answers[question.id] as AnswerOption) ?? null,
      correct: answers[question.id] === question.correct_answer,
      flagged: flagged.has(question.id),
    }))
    const timeTaken = Math.round((Date.now() - startTime) / 1000)
    sessionStorage.setItem('quizResults', JSON.stringify(results))
    sessionStorage.setItem('quizTimeTaken', String(timeTaken))
    router.push('/results')
  }

  const handleTimerExpire = () => {
    // Auto-advance with no answer on timer expiry
    if (isLast) {
      handleFinish()
    } else {
      next()
      setTimerKey(k => k + 1)
    }
  }

  return (
    <KawaiiLayout>
      <div className="quiz-layout">
        {/* Top bar */}
        <div className="quiz-topbar">
          <ProgressBar
            current={current}
            total={questions.length}
            flaggedCount={flagged.size}
          />
          <div className="quiz-controls">
            <FlagButton flagged={isFlagged} onToggle={() => toggleFlag(q.id)} />
            {isExam && (
              <Timer
                key={timerKey}
                totalSeconds={timePerQuestion}
                onExpire={handleTimerExpire}
              />
            )}
          </div>
        </div>

        {/* Question card */}
        <QuizCard
          question={q}
          chosen={chosen}
          showFeedback={feedbackMode === 'immediate'}
          onAnswer={handleAnswer}
        />

        {/* Navigation */}
        <div className="quiz-nav">
          <button
            className="btn-kawaii"
            onClick={prev}
            disabled={current === 0}
          >
            ◀ PREV
          </button>

          <span className="question-counter pixel-label">
            {current + 1} / {questions.length}
          </span>

          <button
            className="btn-kawaii"
            onClick={handleNext}
            disabled={!chosen && isExam}
            style={{ background: isLast ? 'var(--green-pale)' : undefined }}
          >
            {isLast ? '★ FINISH' : 'NEXT ▶'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .quiz-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 720px;
          margin: 0 auto;
        }

        .quiz-topbar {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .quiz-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .quiz-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 8px;
          padding-top: 16px;
          border-top: 2px dashed var(--pink-mid);
        }

        .question-counter {
          font-size: 8px;
          color: #aaa;
        }

        .btn-kawaii:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }
      `}</style>
    </KawaiiLayout>
  )
}