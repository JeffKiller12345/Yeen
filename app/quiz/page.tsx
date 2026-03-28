'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizSession } from '@/lib/quizSession'
import QuizCard from '@/components/QuizCard'
import SAQCard from '@/components/SAQCard'
import { checkAnswer } from '@/components/SAQCard'
import ProgressBar from '@/components/ProgressBar'
import FlagButton from '@/components/FlagButton'
import Timer from '@/components/Timer'
import KawaiiLayout from '@/components/KawaiiLayout'
import TotalTimer from '@/components/TotalTimer'
import type { AnswerOption, QuizResult, SAQResult, QuizSession } from '@/types'

export default function QuizPage() {
  const router = useRouter()
  const {
    questions, saqQuestions, questionType,
    current, answers, flagged, mode, feedbackMode, timerMode, totalTimeSeconds,
    timePerQuestion, answer, toggleFlag, next, prev, finish
  } = useQuizSession()

  const [startTime] = useState(Date.now())
  const [timerKey, setTimerKey] = useState(0)

  const isSAQ = questionType === 'saq'
  const allQuestions = isSAQ ? saqQuestions : questions
  const total = allQuestions.length
  
  if (total === 0) return null
  
  useEffect(() => {
    if (total === 0) router.replace('/')
  }, [total])


  const q = allQuestions[current]
  const chosen = answers[q.id] ?? null
  const isFlagged = flagged.has(q.id)
  const isExam = mode === 'exam'
  const isLast = current === total - 1

  const handleNext = () => {
    if (isLast) handleFinish()
    else { next(); setTimerKey(k => k + 1) }
  }

  const handleFinish = () => {
    finish()

    if (isSAQ) {
      const results: SAQResult[] = saqQuestions.map(question => ({
        question,
        userAnswer: answers[question.id] ?? '',
        awarded: checkAnswer(answers[question.id] ?? '', question.acceptable_answers),
        flagged: flagged.has(question.id),
      }))
      sessionStorage.setItem('quizResults', JSON.stringify(results))
      sessionStorage.setItem('quizType', 'saq')
    } else {
      const results: QuizResult[] = questions.map(question => ({
        question,
        chosen: (answers[question.id] as AnswerOption) ?? null,
        correct: answers[question.id] === question.correct_answer,
        flagged: flagged.has(question.id),
      }))
      sessionStorage.setItem('quizResults', JSON.stringify(results))
      sessionStorage.setItem('quizType', 'mcq')
    }

    sessionStorage.setItem('quizTimeTaken', String(Math.round((Date.now() - startTime) / 1000)))
    router.push('/results')
  }

  const handleTimerExpire = () => {
    if (isLast) handleFinish()
    else { next(); setTimerKey(k => k + 1) }
  }

  return (
    <KawaiiLayout>
      <div className="quiz-layout">
        <div className="quiz-topbar">
          <ProgressBar current={current} total={total} flaggedCount={flagged.size} />
          <div className="quiz-controls">
            <FlagButton flagged={isFlagged} onToggle={() => toggleFlag(q.id)} />
            {isExam && timerMode === 'total' && (
              <TotalTimer
                  totalSeconds={totalTimeSeconds}
                  onExpire={handleFinish}
              />
            )}
            {isExam && timerMode === 'per_question' && (
              <Timer
                key={timerKey}
                totalSeconds={timePerQuestion}
                onExpire={handleTimerExpire}
              />
            )}
          </div>
        </div>

        {isSAQ ? (
          <SAQCard
            key={q.id}
            question={saqQuestions[current]}
            userAnswer={chosen ?? ''}
            showFeedback={feedbackMode === 'immediate'}
            onAnswer={val => answer(q.id, val)}
            timeExpired={timerMode === 'total' && totalTimeSeconds === 0}
          />
        ) : (
          <QuizCard
            key={q.id}
            question={questions[current]}
            chosen={chosen as AnswerOption}
            showFeedback={feedbackMode === 'immediate'}
            onAnswer={val => answer(q.id, val)}
          />
        )}

        <div className="quiz-nav">
          <button className="btn-kawaii" onClick={prev} disabled={current === 0}>
            ◀ PREV
          </button>
          <span className="question-counter pixel-label">{current + 1} / {total}</span>
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
        .quiz-layout { display: flex; flex-direction: column; gap: 20px; max-width: 720px; margin: 0 auto; }
        .quiz-topbar { display: flex; flex-direction: column; gap: 10px; }
        .quiz-controls { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .quiz-nav { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; padding-top: 16px; border-top: 2px dashed var(--pink-mid); }
        .question-counter { font-size: 8px; color: #aaa; }
        .btn-kawaii:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; transform: none; }
      `}</style>
    </KawaiiLayout>
  )
}