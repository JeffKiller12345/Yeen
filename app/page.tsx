'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import KawaiiLayout from '@/components/KawaiiLayout'
import TopicSelector from '@/components/TopicSelector'
import ModeSelector from '@/components/ModeSelector'
import { selectQuestions } from '@/lib/questionUtils'
import MockSelector from '@/components/MockSelector'
import { useQuizSession } from '@/lib/quizSession'
import topicsIndex from '@/data/topicsIndex.json'
import { supabase } from '@/lib/supabase'
import type { Question, QuizSession, StudyFeedbackMode, SeenMode, SAQQuestion } from '@/types'

export default function Dashboard() {
const [questions, setQuestions] = useState<Question[]>([])


useEffect(() => {
  async function fetchAllQuestions() {
    const batchSize = 1000
    let page = 0
    let allQuestions: Question[] = []
    let keepFetching = true

    while (keepFetching) {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .range(page * batchSize, (page + 1) * batchSize - 1)

      if (error) {
        console.error('Supabase error:', error)
        break
      }

      const parsed = (data ?? []).map(q => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
      }))

      allQuestions = [...allQuestions, ...parsed]

      if (!data || data.length < batchSize) {
        keepFetching = false
      } else {
        page++
      }
    }

    console.log('Questions loaded:', allQuestions.length)
    setQuestions(allQuestions)
  }

  fetchAllQuestions()
}, [])

useEffect(() => {
  async function fetchSAQs() {
    const batchSize = 1000
    let page = 0
    let all: SAQQuestion[] = []
    let keepFetching = true
    while (keepFetching) {
      const { data, error } = await supabase
        .from('saq_questions')
        .select('*')
        .range(page * batchSize, (page + 1) * batchSize - 1)
      if (error) { console.error(error); break }
      const parsed = (data ?? []).map(q => ({
        ...q,
        acceptable_answers: typeof q.acceptable_answers === 'string'
          ? JSON.parse(q.acceptable_answers)
          : q.acceptable_answers
      }))
      all = [...all, ...parsed]
      if (!data || data.length < batchSize) keepFetching = false
      else page++
    }
    setSaqQuestions(all)
  }
  fetchSAQs()
}, [])

  const router = useRouter()
  const init = useQuizSession((s: QuizSession) => s.init)
  const [questionType, setQuestionType] = useState<'mcq' | 'saq'>('mcq')
  const [saqQuestions, setSaqQuestions] = useState<SAQQuestion[]>([])
  const initSAQ = useQuizSession((s: QuizSession) => s.initSAQ)
  const [selections, setSelections] = useState<Record<string, Record<string, number>>>({})
  const [examMode, setExamMode]         = useState(false)
  const [feedbackMode, setFeedbackMode] = useState<StudyFeedbackMode>('immediate')
  const [seenMode, setSeenMode]         = useState<SeenMode>('all')
  const [error, setError]               = useState('')
  const [topics, setTopics] = useState<Record<string, string[]>>({})

  const totalSelected = Object.values(selections)
    .flatMap(s => Object.values(s))
    .reduce((a, b) => a + b, 0)

  const shuffle = (arr: any[]) => [...arr].sort(() => Math.random() - 0.5);

  const startCustom = () => {
    if (questionType === 'saq') {
      const filtered = saqQuestions.filter(q =>
        Object.entries(selections).some(([topic, subs]) =>
          q.topic === topic && Object.keys(subs).includes(q.subtopic)
        )
      )
      if (filtered.length === 0) { setError('No SAQ questions match your selection.'); return }
      initSAQ(filtered, examMode ? 'exam' : 'study', feedbackMode)
      router.push('/quiz')
      return 
    }
    
    // Logic for MCQ (standard questions)
    const selectedMcqs = selectQuestions(questions as any, { selections, seenMode })
    if (selectedMcqs.length === 0) { setError('No MCQ questions match.'); return }
    init(selectedMcqs, examMode ? 'exam' : 'study', feedbackMode)
    router.push('/quiz')
  } // <--- Added missing brace

  const startCustomSAQ = () => {
    const result: SAQQuestion[] = []
    for (const [topic, subtopics] of Object.entries(selections)) {
      for (const [subtopic, count] of Object.entries(subtopics)) {
        const pool = saqQuestions.filter(
          q => q.topic === topic && q.subtopic === subtopic
        )
        result.push(...shuffle(pool).slice(0, count))
      }
    }
    if (result.length === 0) { setError('No SAQ questions match your selection.'); return }
    const shuffled = shuffle(result)
    const totalMarks = shuffled.reduce((a, q) => a + (q.marks || 0), 0)
    const totalTimeSeconds = examMode ? totalMarks * 75 : 0
    initSAQ(shuffled, examMode ? 'exam' : 'study', feedbackMode, totalTimeSeconds)
    router.push('/quiz')
  }

const startCustomSAQ = () => {
  const result: SAQQuestion[] = []
  for (const [topic, subtopics] of Object.entries(selections)) {
    for (const [subtopic, count] of Object.entries(subtopics)) {
      const pool = saqQuestions.filter(
        q => q.topic === topic && q.subtopic === subtopic
      )
      result.push(...shuffle(pool).slice(0, count))
    }
  }
  if (result.length === 0) { setError('No SAQ questions match your selection.'); return }
  const shuffled = shuffle(result)
  const totalMarks = shuffled.reduce((a, q) => a + q.marks, 0)
  const totalTimeSeconds = examMode ? totalMarks * 75 : 0
  initSAQ(shuffled, examMode ? 'exam' : 'study', feedbackMode, totalTimeSeconds)
  router.push('/quiz')
}

  const startMock = () => {
    if (questions.length === 0) {
    setError('Questions are still loading, please wait.')
    return
  }
  console.log('Total questions available for mock:', questions.length)
  const q = MockSelector(questions as any, topics)
  console.log('Mock paper size:', q.length)
  init(q, examMode ? 'exam' : 'study', feedbackMode)
  router.push('/quiz')

  }

  const handleExport = async () => {
  if (totalSelected === 0) {
    setError('Select topics before exporting.')
    return
  }
  const q = selectQuestions(questions as any, { selections, seenMode })
  
  try {
    const response = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        questions: q,
        questionType
      }),
    })
    
    if (!response.ok) throw new Error('Export failed')
    
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `medquiz-paper-${Date.now()}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    setError('PDF export failed. Please try again.')
  }
}

  return (
    <KawaiiLayout
      title="✿ YEEN ✿"
      subtitle="welcome! pick your topics and start studying ♡"
    >
      <div className="dashboard">
        {/* Settings */}
        <ModeSelector
          examMode={examMode}
          onExamModeChange={setExamMode}
          feedbackMode={feedbackMode}
          onFeedbackModeChange={setFeedbackMode}
          seenMode={seenMode}
          onSeenModeChange={setSeenMode}
        />

        {/* Topic selection */}
        <TopicSelector onChange={setSelections} onTopicsLoaded={setTopics} />

        {/* Error */}
        {error && (
          <div className="error-msg">
            <span className="pixel-label" style={{ fontSize: '7px', color: '#c62828' }}>
              ✗ {error}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="dashboard-actions">
          <div className="action-primary">
            <button className="btn-kawaii" onClick={startCustom}>
              ▶ START CUSTOM QUIZ
              {totalSelected > 0 && (
                <span className="q-count-pill">{totalSelected}q</span>
              )}
            </button>
          </div>

          <div className="action-secondary">
            <button className="btn-kawaii green" onClick={startMock}>
              START MOCK EXAM
            </button>
            <button className="btn-kawaii" onClick={handleExport}>
              ⬇ EXPORT PDF
            </button>
          </div>
        </div>

        {/* Mock paper info */}
        <div className="mock-info kawaii-panel">
          <p className="pixel-label" style={{ marginBottom: '8px' }}>
            ★ SBA MOCK PAPER FORMAT
          </p>
          <p className="info-text">
            Automatically pulls <strong>10 questions</strong> each from
            Microbiology, Respiratory, Cardiovascular, GI/Hepatic, and
            Neurology — and <strong>5 questions</strong> from every other
            topic in the bank.
          </p>
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 720px;
          margin: 0 auto;
        }

        .error-msg {
          padding: 8px 12px;
          background: #ffebee;
          border: 2px solid #ef9a9a;
        }

        .dashboard-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 4px;
        }

        .action-primary .btn-kawaii {
          width: 100%;
          font-size: 10px;
          padding: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .q-count-pill {
          background: var(--pink-dark);
          color: white;
          font-size: 7px;
          padding: 2px 8px;
          border-radius: 0;
        }

        .action-secondary {
          display: flex;
          gap: 10px;
        }

        .action-secondary .btn-kawaii {
          flex: 1;
        }

        .mock-info {
          background: var(--cream);
          border-color: var(--green-mid);
          box-shadow: 3px 3px 0 var(--green-mid);
        }

        .mock-info::before {
          content: '✦ INFO ✦';
          background: var(--cream);
        }

        .info-text {
          font-family: var(--font-body);
          font-size: 12px;
          color: #555;
          line-height: 1.6;
          margin: 0;
        }
      `}</style>
    </KawaiiLayout>
  )
}