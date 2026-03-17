'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import KawaiiLayout from '@/components/KawaiiLayout'
import TopicSelector from '@/components/TopicSelector'
import ModeSelector from '@/components/ModeSelector'
import { selectQuestions } from '@/lib/questionUtils'
import { buildMockPaper } from '@/lib/mockPaper'
import { useQuizSession } from '@/lib/quizSession'
import topicsIndex from '@/data/topicsIndex.json'
import { supabase } from '@/lib/supabase'
import type { Question, QuizSession, StudyFeedbackMode, SeenMode } from '@/types'

export default function Dashboard() {
const [questions, setQuestions] = useState<Question[]>([])

useEffect(() => {
  supabase
    .from('questions')
    .select('*')
    .then(({ data, error }) => {
      if (error) console.error(error)
      else setQuestions(data ?? [])
    })
}, [])
  const router = useRouter()
  const init = useQuizSession((s: QuizSession) => s.init)

  const [selections, setSelections] = useState<Record<string, Record<string, number>>>({})
  const [examMode, setExamMode]         = useState(false)
  const [feedbackMode, setFeedbackMode] = useState<StudyFeedbackMode>('immediate')
  const [seenMode, setSeenMode]         = useState<SeenMode>('all')
  const [error, setError]               = useState('')

  const totalSelected = Object.values(selections)
    .flatMap(s => Object.values(s))
    .reduce((a, b) => a + b, 0)

  const startCustom = () => {
    if (totalSelected === 0) {
      setError('Please select at least one topic and question count.')
      return
    }
    setError('')
    const q = selectQuestions(questions as any, { selections, seenMode })
    if (q.length === 0) {
      setError('No questions match your current filters. Try changing the "Question Pool" setting.')
      return
    }
    init(q, examMode ? 'exam' : 'study', feedbackMode)
    router.push('/quiz')
  }

  const startMock = () => {
    setError('')
    const q = buildMockPaper(questions as any, topicsIndex)
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
      body: JSON.stringify({ questions: q }),
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
        <TopicSelector onChange={setSelections} />

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
              ★ MOCK PAPER
            </button>
            <button className="btn-kawaii" onClick={handleExport}>
              ⬇ EXPORT PDF
            </button>
          </div>
        </div>

        {/* Mock paper info */}
        <div className="mock-info kawaii-panel">
          <p className="pixel-label" style={{ marginBottom: '8px' }}>
            ★ MOCK PAPER FORMAT
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