'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PHASE_CONFIG, type StudentPhase } from '@/lib/phaseConfig'
import { selectQuestions, selectSAQCases } from '@/lib/questionUtils'
import { useQuizSession } from '@/lib/quizSession'
import { supabase } from '@/lib/supabase'
import { getCachedTopicMeta } from '@/lib/topicCache'
import type { Question, QuestionType, QuizSession, SAQQuestion, SeenMode, StudyFeedbackMode } from '@/types'

type Selections = Record<string, Record<string, number>>

type TopicMeta = {
  id: string
  topic: string
  subtopic: string
}

type SAQRow = Omit<SAQQuestion, 'acceptable_answers'> & {
  acceptable_answers: SAQQuestion['acceptable_answers'] | string
}

type ExportQuestionRow = Question | SAQRow

const MIN_SAQ_EXAM_TIME_SECONDS = 1800
const MAX_MCQ_EXPORT_LIMIT = 100
const MAX_SAQ_EXPORT_LIMIT = 20

function parseAcceptableAnswers(value: SAQRow['acceptable_answers']): string[] {
  if (typeof value === 'string') {
    const parsedValue: unknown = JSON.parse(value)
    return Array.isArray(parsedValue) ? parsedValue.map(String) : []
  }

  return value
}

function getSelectedTopics(selections: Selections): string[] {
  return Object.keys(selections).filter((topic) =>
    Object.values(selections[topic] ?? {}).some((count) => count > 0),
  )
}

export function useDashboardController() {
  const router = useRouter()
  const init = useQuizSession((session: QuizSession) => session.init)
  const initSAQ = useQuizSession((session: QuizSession) => session.initSAQ)

  const [questionType, setQuestionType] = useState<QuestionType>('mcq')
  const [studentPhase, setStudentPhase] = useState<StudentPhase>('phase2a')
  const [selections, setSelections] = useState<Selections>({})
  const [examMode, setExamMode] = useState(false)
  const [feedbackMode, setFeedbackMode] = useState<StudyFeedbackMode>('immediate')
  const [seenMode, setSeenMode] = useState<SeenMode>('all')
  const [error, setError] = useState('')
  const [seenResetKey, setSeenResetKey] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [topics, setTopics] = useState<Record<string, string[]>>({})

  const phaseConfig = PHASE_CONFIG[studentPhase]

  useEffect(() => {
    if (!phaseConfig.saqEnabled && questionType === 'saq') {
      setQuestionType('mcq')
    }
  }, [phaseConfig.saqEnabled, questionType])

  const totalSelected = useMemo(
    () =>
      Object.values(selections)
        .flatMap((selection) => Object.values(selection))
        .reduce((acc, count) => acc + count, 0),
    [selections],
  )

  const handleSeenReset = () => {
    setSeenResetKey((currentKey) => currentKey + 1)
  }

  const handleTopicsLoaded = (loadedTopics: Record<string, string[]>) => {
    setTopics(loadedTopics)
  }

  const startCustomSAQ = async () => {
    setError('')
    setIsLoading(true)

    try {
      const selectedTopics = getSelectedTopics(selections)
      const allMeta = await getCachedTopicMeta(phaseConfig.saqTable)
      const meta = allMeta.filter((question) => selectedTopics.includes(question.topic))

      if (meta.length === 0) {
        setError('Failed to fetch SAQs')
        return
      }

      const selectedIds = selectSAQCases(meta, selections).map((question) => question.id)

      if (selectedIds.length === 0) {
        setError('No SAQ questions match your selection.')
        return
      }

      const { data: fullSAQs, error: fullError } = await supabase
        .from(phaseConfig.saqTable)
        .select(
          'id, topic, subtopic, case_context, additional_context, question, marks, acceptable_answers, feedback, generated_at',
        )
        .in('id', selectedIds)
        .returns<SAQRow[]>()

      if (fullError || !fullSAQs) {
        setError('Failed to load SAQ content')
        return
      }

      const result: SAQQuestion[] = fullSAQs
        .map((question) => ({
          ...question,
          acceptable_answers: parseAcceptableAnswers(question.acceptable_answers),
        }))
        .sort((a, b) => a.id.localeCompare(b.id))

      const totalMarks = result.reduce((sum, question) => sum + (question.marks || 0), 0)
      const timerOverride = examMode
        ? Math.max(totalMarks * 60, MIN_SAQ_EXAM_TIME_SECONDS)
        : undefined

      initSAQ(result, examMode ? 'exam' : 'study', feedbackMode, timerOverride)
      router.push('/quiz')
    } finally {
      setIsLoading(false)
    }
  }

  const startCustomMCQ = async () => {
    setError('')
    setIsLoading(true)

    try {
      const selectedTopics = getSelectedTopics(selections)
      const allMeta = await getCachedTopicMeta(phaseConfig.mcqTable)
      const meta = allMeta.filter((question) => selectedTopics.includes(question.topic))

      if (meta.length === 0) {
        setError('Failed to fetch questions')
        return
      }

      const selectedMeta = await selectQuestions<TopicMeta>(meta, { selections, seenMode })

      if (selectedMeta.length === 0) {
        setError('No MCQ questions match.')
        return
      }

      const selectedIds = selectedMeta.map((question) => question.id)

      const { data: fullQuestions, error: fullError } = await supabase
        .from(phaseConfig.mcqTable)
        .select('id, topic, subtopic, question, options, correct_answer, feedback, generated_at')
        .in('id', selectedIds)
        .returns<Question[]>()

      if (fullError || !fullQuestions) {
        setError('Failed to load question content')
        return
      }

      const timerOverride = examMode ? fullQuestions.length * 90 : undefined
      init(fullQuestions, examMode ? 'exam' : 'study', feedbackMode, 'mcq', timerOverride)
      router.push('/quiz')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartCustom = async () => {
    if (questionType === 'saq') {
      await startCustomSAQ()
      return
    }

    await startCustomMCQ()
  }

  const handleExport = async () => {
    if (totalSelected === 0) {
      setError('Select topics before exporting.')
      return
    }

    const maxLimit = questionType === 'saq' ? MAX_SAQ_EXPORT_LIMIT : MAX_MCQ_EXPORT_LIMIT

    if (totalSelected > maxLimit) {
      setError(
        `Export limit exceeded. Please select a maximum of ${maxLimit} ${questionType === 'saq' ? 'cases' : 'questions'}.`,
      )
      return
    }

    setError('')
    setIsExporting(true)

    try {
      const selectedTopics = getSelectedTopics(selections)
      const sourceTable = questionType === 'saq' ? phaseConfig.saqTable : phaseConfig.mcqTable

      const { data: meta, error: metaError } = await supabase
        .from(sourceTable)
        .select('id, topic, subtopic')
        .in('topic', selectedTopics)
        .returns<TopicMeta[]>()

      if (metaError || !meta) {
        setError('Failed to fetch questions for export.')
        return
      }

      const selectedIds =
        questionType === 'saq'
          ? selectSAQCases(meta, selections).map((question) => question.id)
          : (await selectQuestions<TopicMeta>(meta, { selections, seenMode })).map((question) => question.id)

      const exportColumns =
        questionType === 'saq'
          ? 'id, topic, subtopic, case_context, additional_context, question, marks, acceptable_answers, feedback, generated_at'
          : 'id, topic, subtopic, question, options, correct_answer, feedback, generated_at'

      const { data: exportQuestions, error: exportError } = await supabase
        .from(sourceTable)
        .select(exportColumns)
        .in('id', selectedIds)
        .returns<ExportQuestionRow[]>()

      if (exportError || !exportQuestions) {
        setError('Failed to load question content for export.')
        return
      }

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: exportQuestions, questionType }),
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const linkElement = document.createElement('a')
      linkElement.href = url
      linkElement.download = `yeen-mock-${Date.now()}.pdf`
      document.body.appendChild(linkElement)
      linkElement.click()

      setTimeout(() => {
        document.body.removeChild(linkElement)
        URL.revokeObjectURL(url)
      }, 100)
    } catch {
      setError('PDF export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return {
    error,
    examMode,
    feedbackMode,
    handleExport,
    handleSeenReset,
    handleStartCustom,
    isExporting,
    isLoading,
    phaseConfig,
    questionType,
    seenMode,
    seenResetKey,
    selections,
    setExamMode,
    setFeedbackMode,
    setQuestionType,
    setSeenMode,
    setSelections,
    setStudentPhase,
    studentPhase,
    totalSelected,
    topics,
    handleTopicsLoaded,
  }
}
