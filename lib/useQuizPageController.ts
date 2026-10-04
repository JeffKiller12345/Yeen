'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkAnswer } from '@/components/SAQCard'
import { markSeen } from '@/lib/seenTracker'
import { useQuizSession } from '@/lib/quizSession'
import type { AnswerOption, Question, QuizResult, SAQQuestion, SAQResult } from '@/types'

interface QuizCase {
  id: string
  questions: SAQQuestion[]
}

function getCaseId(questionId: string): string {
  return questionId.replace(/_Q\d+$/, '')
}

function toAnswerOption(value: string | undefined): AnswerOption | null {
  if (value === 'A' || value === 'B' || value === 'C' || value === 'D' || value === 'E') {
    return value
  }

  return null
}

function buildSAQCases(saqQuestions: SAQQuestion[]): QuizCase[] {
  const groupedCases = saqQuestions.reduce<Record<string, SAQQuestion[]>>((acc, question) => {
    const caseId = getCaseId(question.id)

    if (!acc[caseId]) {
      acc[caseId] = []
    }

    acc[caseId].push(question)
    return acc
  }, {})

  return Object.entries(groupedCases).map(([id, questions]) => ({
    id,
    questions: [...questions].sort((a, b) => a.id.localeCompare(b.id)),
  }))
}

export function useQuizPageController() {
  const router = useRouter()
  const {
    questions,
    saqQuestions,
    questionType,
    current,
    answers,
    flagged,
    mode,
    feedbackMode,
    timerMode,
    totalTimeSeconds,
    timePerQuestion,
    answer,
    toggleFlag,
    next,
    prev,
    finish,
  } = useQuizSession()

  const [startTime] = useState(() => Date.now())
  const [timerKey, setTimerKey] = useState(0)
  const [timesUp, setTimesUp] = useState(false)
  const [scoreOverrides, setScoreOverrides] = useState<Record<string, number>>({})

  const isSAQ = questionType === 'saq'
  const isExam = mode === 'exam'

  const saqCases = useMemo(() => (isSAQ ? buildSAQCases(saqQuestions) : []), [isSAQ, saqQuestions])
  const total = isSAQ ? saqCases.length : questions.length

  useEffect(() => {
    if (total === 0) {
      router.replace('/')
    }
  }, [router, total])

  const currentCase = isSAQ ? saqCases[current]?.questions ?? null : null
  const currentQuestion: Question | SAQQuestion | undefined = isSAQ
    ? currentCase?.[0]
    : questions[current]

  const isFlagged = currentQuestion ? flagged.has(currentQuestion.id) : false
  const isLast = current === total - 1

  const hasAnsweredCurrent = isSAQ
    ? Boolean(currentCase?.every((subQuestion) => Boolean(answers[subQuestion.id])))
    : Boolean(currentQuestion && answers[currentQuestion.id])

  const chosenOption = !isSAQ && currentQuestion
    ? toAnswerOption(answers[currentQuestion.id])
    : null

  const handleFinish = async () => {
    if (isSAQ) {
      const results: SAQResult[] = saqQuestions.map((question) => {
        const userAnswer = answers[question.id] ?? ''
        const autoAwarded = checkAnswer(userAnswer, question.acceptable_answers)
        const marksAwarded = scoreOverrides[question.id] ?? (autoAwarded ? question.marks : 0)

        return {
          question,
          userAnswer,
          awarded: marksAwarded > 0,
          marksAwarded,
          flagged: flagged.has(question.id),
        }
      })

      sessionStorage.setItem('quizResults', JSON.stringify(results))
      sessionStorage.setItem('quizType', 'saq')

      const answeredIds = saqQuestions.filter((question) => Boolean(answers[question.id])).map((question) => question.id)
      await markSeen(answeredIds, 'saq')
    } else {
      const results: QuizResult[] = questions.map((question) => ({
        question,
        chosen: toAnswerOption(answers[question.id]),
        correct: answers[question.id] === question.correct_answer,
        flagged: flagged.has(question.id),
      }))

      sessionStorage.setItem('quizResults', JSON.stringify(results))
      sessionStorage.setItem('quizType', 'mcq')

      const answeredIds = questions.filter((question) => Boolean(answers[question.id])).map((question) => question.id)
      await markSeen(answeredIds, 'mcq')
    }

    sessionStorage.setItem('quizTimeTaken', String(Math.round((Date.now() - startTime) / 1000)))

    finish()
    router.push('/results')
  }

  const goToNext = () => {
    if (isLast) {
      void handleFinish()
      return
    }

    next()
    setTimerKey((key) => key + 1)
  }

  const handleTotalTimerExpire = () => {
    setTimesUp(true)
  }

  const handleScoreOverride = (questionId: string, marksAwarded: number) => {
    setScoreOverrides((previous) => ({ ...previous, [questionId]: marksAwarded }))
  }

  return {
    answer,
    answers,
    chosenOption,
    current,
    currentCase,
    currentQuestion,
    feedbackMode,
    flaggedCount: flagged.size,
    goToNext,
    handleFinish,
    handleScoreOverride,
    handleTotalTimerExpire,
    hasAnsweredCurrent,
    isExam,
    isFlagged,
    isLast,
    isSAQ,
    prev,
    timePerQuestion,
    timerKey,
    timerMode,
    timesUp,
    toggleFlag,
    total,
    totalTimeSeconds,
  }
}
