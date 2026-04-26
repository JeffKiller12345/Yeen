'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import KawaiiLayout from '@/components/KawaiiLayout'
import TopicSelector from '@/components/TopicSelector'
import ModeSelector from '@/components/ModeSelector'
import { selectQuestions } from '@/lib/questionUtils'
import MockSelector from '@/components/MockSelector'
import { useQuizSession } from '@/lib/quizSession'
import { supabase } from '@/lib/supabase'
import type { Question, QuizSession, StudyFeedbackMode, SeenMode, SAQQuestion } from '@/types'

export default function Dashboard() {
  const router = useRouter()
  const init    = useQuizSession((s: QuizSession) => s.init)
  const initSAQ = useQuizSession((s: QuizSession) => s.initSAQ)

  const [questionType,  setQuestionType]  = useState<'mcq' | 'saq'>('mcq')
  const [selections,    setSelections]    = useState<Record<string, Record<string, number>>>({})
  const [examMode,      setExamMode]      = useState(false)
  const [feedbackMode,  setFeedbackMode]  = useState<StudyFeedbackMode>('immediate')
  const [seenMode,      setSeenMode]      = useState<SeenMode>('all')
  const [error,         setError]         = useState('')
  const [topics,        setTopics]        = useState<Record<string, string[]>>({})
  const [seenResetKey,  setSeenResetKey]  = useState(0)
  const [isExporting,   setIsExporting]   = useState(false)
  // FIX 2: Declare the missing isLoading state
  const [isLoading,     setIsLoading]     = useState(false)

  const totalSelected = Object.values(selections)
    .flatMap(s => Object.values(s))
    .reduce((a, b) => a + b, 0)

  const shuffle = (arr: any[]) => [...arr].sort(() => Math.random() - 0.5)

  // FIX 5: getCaseId moved up so both SAQ functions can use it
  const getCaseId = (id: string) => id.replace(/_Q\d+$/, '')

  // ── Shared helper: get selected topic keys ─────────────────────────────────
  const getSelectedTopics = () =>
    Object.keys(selections).filter(t =>
      Object.values(selections[t]).some(count => count > 0)
    )

  // ── MCQ custom quiz ────────────────────────────────────────────────────────
  const startCustom = async () => {
    if (questionType === 'saq') {
      startCustomSAQ()
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const selectedTopics = getSelectedTopics()

      // Phase 1: fetch only the lightweight columns needed for selection logic.
      // This avoids downloading large 'text' and 'options' fields for the entire
      // topic pool when only a small subset will be picked.
      const allMeta = await getCachedTopicMeta('questions')
      const meta = allMeta.filter(q => selectedTopics.includes(q.topic))

      if (meta.length === 0) { setError('Failed to fetch questions'); return }

      const selectedMeta = await selectQuestions(meta as any, { selections, seenMode })

      if (selectedMeta.length === 0) { setError('No MCQ questions match.'); return }

      // Phase 2: fetch full content only for the selected IDs.
      const selectedIds = selectedMeta.map((q: any) => q.id)
      const { data: fullQuestions, error: fullError } = await supabase
        .from('questions')
        .select('id, topic, subtopic, question, options, correct_answer, feedback, generated_at')
        .in('id', selectedIds)

      if (fullError || !fullQuestions) { setError('Failed to load question content'); return }

      const timerOverride = examMode ? fullQuestions.length * 90 : undefined
      init(fullQuestions as any, examMode ? 'exam' : 'study', feedbackMode, 'mcq', timerOverride)
      router.push('/quiz')
    } finally {
      setIsLoading(false)
    }
  }

  // ── SAQ custom quiz ────────────────────────────────────────────────────────
  const startCustomSAQ = async () => {
    setError('')
    setIsLoading(true)

    try {
      const selectedTopics = getSelectedTopics()

      // Phase 1: fetch only the metadata needed to build the case map and
      // shuffle/select cases. 'marks' is included because it's tiny and needed
      // for the timer calculation even before the full fetch.
      const allMeta = await getCachedTopicMeta('saq_questions')
      const meta = allMeta.filter(q => selectedTopics.includes(q.topic))

      if (meta.length === 0) { setError('Failed to fetch SAQs'); return }

      // Build case map and select cases using lightweight metadata.
      const caseMap: Record<string, typeof meta> = {}
      for (const q of meta) {
        const caseId = getCaseId(q.id)
        if (!caseMap[caseId]) caseMap[caseId] = []
        caseMap[caseId].push(q)
      }

      const caseCount = totalSelected
      const selectedCases = shuffle(Object.values(caseMap)).slice(0, caseCount)
      const selectedIds = selectedCases
        .flat()
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(q => q.id)

      if (selectedIds.length === 0) { setError('No SAQ questions match your selection.'); return }

      // Phase 2: fetch full content (including large 'acceptable_answers' JSON)
      // only for the questions that were actually selected.
      const { data: fullSAQs, error: fullError } = await supabase
  .from('saq_questions')
  .select('id, topic, subtopic, case_context, additional_context, question, marks, acceptable_answers, feedback, generated_at')
  .in('id', selectedIds)

      if (fullError || !fullSAQs) { setError('Failed to load SAQ content'); return }

      const result: SAQQuestion[] = fullSAQs
        .map(q => ({
          ...q,
          acceptable_answers: typeof q.acceptable_answers === 'string'
            ? JSON.parse(q.acceptable_answers)
            : q.acceptable_answers,
        }))
        .sort((a, b) => a.id.localeCompare(b.id)) as SAQQuestion[]

      const MIN_SAQ_EXAM_TIME_SECONDS = 1800
      const totalMarks = result.reduce((sum, q) => sum + (q.marks || 0), 0)
      const timerOverride = examMode
        ? Math.max(totalMarks * 60, MIN_SAQ_EXAM_TIME_SECONDS)
        : undefined

      initSAQ(result, examMode ? 'exam' : 'study', feedbackMode, timerOverride)
      router.push('/quiz')
    } finally {
      setIsLoading(false)
    }
  }

  // ── PDF export ─────────────────────────────────────────────────────────────
  const handleExport = async () => {
    if (totalSelected === 0) {
      setError('Select topics before exporting.')
      return
    }

    const MAX_MCQ_LIMIT = 100
    const MAX_SAQ_LIMIT = 20
    const maxLimit = questionType === 'saq' ? MAX_SAQ_LIMIT : MAX_MCQ_LIMIT

    if (totalSelected > maxLimit) {
      setError(
        `Export limit exceeded. Please select a maximum of ${maxLimit} ` +
        `${questionType === 'saq' ? 'cases' : 'questions'}.`
      )
      return
    }

    setError('')
    setIsExporting(true)

    try {
      const selectedTopics = getSelectedTopics()

      // Phase 1: lightweight metadata fetch for selection.
      const { data: meta, error: metaError } = await supabase
        .from(questionType === 'saq' ? 'saq_questions' : 'questions')
        .select('id, topic, subtopic')
        .in('topic', selectedTopics)

      if (metaError || !meta) { setError('Failed to fetch questions for export.'); return }

      const selectedMeta = await selectQuestions(meta as any, { selections, seenMode })
      const selectedIds  = selectedMeta.map((q: any) => q.id)

      // Phase 2: fetch only the columns the PDF renderer actually needs,
      // and only for the selected IDs. No select('*') pulling unused fields.
      const exportColumns = questionType === 'saq'
  ? 'id, topic, subtopic, case_context, additional_context, question, marks, acceptable_answers, feedback, generated_at'
  : 'id, topic, subtopic, question, options, correct_answer, feedback, generated_at'

      const { data: exportQuestions, error: exportError } = await supabase
        .from(questionType === 'saq' ? 'saq_questions' : 'questions')
        .select(exportColumns)
        .in('id', selectedIds)

      if (exportError || !exportQuestions) {
        setError('Failed to load question content for export.')
        return
      }

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: exportQuestions, questionType }),
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `medquiz-paper-${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()

      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
    } catch {
      setError('PDF export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <KawaiiLayout
      title="✿ YEEN ✿"
      subtitle="welcome! pick your topics and start studying ♡"
      onSeenReset={() => setSeenResetKey(k => k + 1)}
    >
      <div className="dashboard">
        <ModeSelector
          examMode={examMode}
          onExamModeChange={setExamMode}
          feedbackMode={feedbackMode}
          onFeedbackModeChange={setFeedbackMode}
          seenMode={seenMode}
          onSeenModeChange={setSeenMode}
          questionType={questionType}
          onQuestionTypeChange={setQuestionType}
          onSeenReset={() => setSeenResetKey(k => k + 1)}
        />

        <TopicSelector
          key={seenResetKey}
          questionType={questionType}
          onChange={setSelections}
          onTopicsLoaded={setTopics}
        />

        {error && (
          <div className="error-msg">
            <span className="pixel-label" style={{ fontSize: '7px', color: '#c62828' }}>
              ✗ {error}
            </span>
          </div>
        )}

        <div className="dashboard-actions">
          <div className="action-primary">
            <button
              className="btn-kawaii"
              onClick={startCustom}
              disabled={isLoading}
              style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
              {isLoading ? '⏳ LOADING...' : '▶ START CUSTOM QUIZ'}
              {!isLoading && totalSelected > 0 && (
                <span className="q-count-pill">{totalSelected}q</span>
              )}
            </button>
          </div>
          <div className="action-secondary">
            <button
              className="btn-kawaii"
              onClick={handleExport}
              disabled={isExporting}
              style={{ opacity: isExporting ? 0.7 : 1, cursor: isExporting ? 'not-allowed' : 'pointer' }}
            >
              {isExporting ? '⏳ EXPORTING...' : '⬇ EXPORT PDF'}
            </button>
          </div>
        </div>

        <MockSelector />
      </div>

      <style jsx>{`
        .dashboard { display: flex; flex-direction: column; gap: 16px; max-width: 720px; margin: 0 auto; }
        .error-msg { padding: 8px 12px; background: #ffebee; border: 2px solid #ef9a9a; }
        .dashboard-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
        .action-primary .btn-kawaii { width: 100%; font-size: 10px; padding: 14px; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .q-count-pill { background: var(--pink-dark); color: white; font-size: 7px; padding: 2px 8px; border-radius: 0; }
        .action-secondary { display: flex; gap: 10px; }
        .action-secondary .btn-kawaii { flex: 1; }
        .mock-info { background: var(--cream); border-color: var(--green-mid); box-shadow: 3px 3px 0 var(--green-mid); }
        .mock-info::before { content: '✦ INFO ✦'; background: var(--cream); }
        .info-text { font-family: var(--font-body); font-size: 12px; color: #555; line-height: 1.6; margin: 0; }
      `}</style>
    </KawaiiLayout>
  )
}
