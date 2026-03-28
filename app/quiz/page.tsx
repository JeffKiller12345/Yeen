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


  const getCaseId = (id: string) => id.replace(/_Q\d+$/, '')

const saqCases: SAQQuestion[][] = isSAQ
  ? Object.values(
      saqQuestions.reduce((acc, q) => {
        const caseId = getCaseId(q.id)
        if (!acc[caseId]) acc[caseId] = []
        acc[caseId].push(q)
        return acc
      }, {} as Record<string, SAQQuestion[]>)
    ).map(qs => qs.sort((a, b) => a.id.localeCompare(b.id)))
  : []

const total = isSAQ ? saqCases.length : questions.length
const currentCase = isSAQ ? saqCases[current] : null
const q = isSAQ ? saqCases[current]?.[0] : questions[current]
  
  if (total === 0) return null
  
  useEffect(() => {
    if (total === 0) router.replace('/')
  }, [total])


  const q = allQuestions[current]
  const chosen = answers[q.id] ?? null
  const isFlagged = flagged.has(q.id)
  const isExam = mode === 'exam'
  const isLast = current === total - 1

  const chosen = isSAQ
  ? (currentCase?.every(subQ => answers[subQ.id]) ? 'answered' : null)
  : (answers[q?.id] ?? null)

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

        {isSAQ && currentCase ? (
  <div className="saq-case">
    {/* Shared case context once at the top */}
    <div className="case-context kawaii-panel">
      <span className="pixel-label" style={{ fontSize: '7px', marginBottom: '8px', display: 'block' }}>
        ★ CLINICAL SCENARIO
      </span>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
        {currentCase[0].case_context}
      </p>
    </div>

    {/* Sub-questions in order */}
    {currentCase.map((subQ, i) => (
      <div key={subQ.id}>
        {subQ.additional_context && (
          <div className="additional-context">
            <span className="pixel-label" style={{ fontSize: '7px' }}>✦ ADDITIONAL INFO</span>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', margin: '4px 0 0' }}>
              {subQ.additional_context}
            </p>
          </div>
        )}
        <SAQCard
          key={subQ.id}
          question={subQ}
          userAnswer={answers[subQ.id] ?? ''}
          showFeedback={feedbackMode === 'immediate'}
          onAnswer={val => answer(subQ.id, val)}
          timeExpired={timerMode === 'total' && totalTimeSeconds === 0}
          hideContext
        />
      </div>
    ))}
  </div>
) : !isSAQ ? (
  <QuizCard
    key={q.id}
    question={questions[current]}
    chosen={chosen as AnswerOption}
    showFeedback={feedbackMode === 'immediate'}
    onAnswer={val => answer(q.id, val)}
  />
) : null}

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
        .saq-case { display: flex; flex-direction: column; gap: 12px; }
        .additional-context { padding: 8px 12px; background: #fff8e1; border: 2px solid #ffe082; }
        .btn-kawaii:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; transform: none; }
      `}</style>
    </KawaiiLayout>
  )
}
