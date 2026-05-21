'use client'
import { useState, useEffect } from 'react'
import { fetchMocks, loadSBAMock, loadSAQMock } from '@/lib/mockLoader'
import { useQuizSession } from '@/lib/quizSession'
import { useRouter } from 'next/navigation'
import type { Mock, QuizSession } from '@/types'
import { PHASE_CONFIG, type StudentPhase } from '@/lib/phaseConfig'

interface Props {
  studentPhase: StudentPhase
}

export default function MockSelector({ studentPhase }: Props) {
  const router = useRouter()
  const init = useQuizSession((s: QuizSession) => s.init)
  const initSAQ = useQuizSession((s: QuizSession) => s.initSAQ)

  const [mocks, setMocks] = useState<Mock[]>([])
  const [filter, setFilter] = useState<'all' | 'sba' | 'saq'>('all')
  const [loading, setLoading] = useState(true)
  const [launching, setLaunching] = useState<string | null>(null)
  const [exporting, setExporting] = useState<string | null>(null)
  const [loadingProgress, setLoadingProgress] = useState('')

  const saqEnabled = PHASE_CONFIG[studentPhase].saqEnabled

  useEffect(() => {
    setLoading(true)
    fetchMocks(studentPhase).then(m => {
      setMocks(m)
      setLoading(false)
    })
  }, [studentPhase])

  useEffect(() => {
    if (!saqEnabled && filter === 'saq') {
      setFilter('sba')
    }
  }, [saqEnabled, filter])

  const sbaMocks = mocks.filter(m => m.type === 'sba')
  const saqMocks = saqEnabled ? mocks.filter(m => m.type === 'saq') : []
  const availableMocks = saqEnabled ? mocks : sbaMocks
  const displayed = filter === 'all' ? availableMocks : filter === 'sba' ? sbaMocks : saqMocks

  const launchMock = async (mock: Mock) => {
    setLaunching(mock.id)
    setLoadingProgress('Fetching questions...')
    try {
      if (mock.type === 'sba') {
        const questions = await loadSBAMock(mock, studentPhase)
        setLoadingProgress(`Loaded ${questions.length} questions`)
        // Use mock's time_seconds if set; fall back to 150 minutes for SBA
        const sbaTimer = (mock.time_seconds ?? 0) > 0 ? mock.time_seconds : 9000
        init(questions, 'exam', 'end', 'mcq', sbaTimer)
      } else {
        const questions = await loadSAQMock(mock, studentPhase)
        setLoadingProgress(`Loaded ${questions.length} questions`)
        // Use mock's time_seconds if set; fall back to 120 minutes for SAQ
        const saqTimer = (mock.time_seconds ?? 0) > 0 ? mock.time_seconds : 7200
        initSAQ(questions, 'exam', 'end', saqTimer)
      }
      router.push('/quiz')
    } catch (err) {
      setLoadingProgress('Failed to load — please try again')
      setLaunching(null)
    }
  }

  const exportMock = async (mock: Mock) => {
    setExporting(mock.id)
    try {
        const questions = mock.type === 'sba'
        ? await loadSBAMock(mock, studentPhase)
        : await loadSAQMock(mock, studentPhase)

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions,
          questionType: mock.type === 'sba' ? 'mcq' : 'saq',
        }),
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${mock.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="mock-selector kawaii-panel">
      <p className="pixel-label" style={{ marginBottom: '12px' }}>★ MOCK PAPERS</p>

      <div className="mock-filter">
        {(['all', 'sba', 'saq'] as const).filter(f => saqEnabled || f !== 'saq').map(f => (
          <button
            key={f}
            className={`pill ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? `ALL (${mocks.length})` :
             f === 'sba' ? `SBA (${sbaMocks.length})` :
             `SAQ (${saqMocks.length})`}
          </button>
        ))}
      </div>

      {launching && (
        <p className="pixel-label" style={{ fontSize: '7px', color: '#888', marginTop: '4px' }}>
          {loadingProgress}
        </p>
      )}

      {loading ? (
        <div className="mock-loading">
          <span className="pixel-label" style={{ fontSize: '7px', color: '#aaa' }}>
            LOADING MOCKS...
          </span>
        </div>
      ) : (
        <div className="mock-grid">
          {displayed.map(mock => (
            <div key={mock.id} className={`mock-card ${mock.type}`}>
              <div className="mock-card-header">
                <span className={`mock-type-badge ${mock.type}`}>
                  {mock.type.toUpperCase()}
                </span>
                <span className="mock-name pixel-label" style={{ fontSize: '7px' }}>
                  {mock.name}
                </span>
              </div>

              <div className="mock-actions">
                <button
                  className={`btn-kawaii ${mock.type === 'saq' ? 'green' : ''}`}
                  style={{ flex: 1, fontSize: '7px' }}
                  onClick={() => launchMock(mock)}
                  disabled={launching === mock.id || exporting === mock.id}
                >
                  {launching === mock.id ? 'LOADING...' : '▶ START'}
                </button>

                <button
  className="btn-kawaii"
  style={{ fontSize: '7px', padding: '10px 12px', lineHeight: 0 }}  // add lineHeight: 0
  onClick={() => exportMock(mock)}
  disabled={launching === mock.id || exporting === mock.id}
  title="Export as PDF"
>
                  {exporting === mock.id ? '...' : (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v13M5 13l7 7 7-7"/>
    <line x1="3" y1="21" x2="21" y2="21"/>
  </svg>
)}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .mock-selector { margin-bottom: 20px; }

        .mock-filter {
          display: flex;
          border: 2px solid var(--pink-mid);
          overflow: hidden;
          margin-bottom: 16px;
        }

        .pill {
          font-family: var(--font-pixel);
          font-size: 7px;
          padding: 8px 12px;
          background: white;
          border: none;
          border-right: 1px solid var(--pink-mid);
          cursor: pointer;
          color: #888;
          flex: 1;
          transition: all 0.15s;
        }

        .pill:last-child { border-right: none; }
        .pill.active { background: var(--pink-mid); color: white; }
        .pill:hover:not(.active) { background: var(--pink-light); }

        .mock-loading {
          padding: 24px;
          text-align: center;
        }

        .mock-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }

        .mock-card {
          border: 2px solid var(--border-px);
          padding: 12px;
          background: white;
          transition: all 0.1s;
        }

        .mock-card:hover {
          border-color: var(--pink-mid);
          box-shadow: 3px 3px 0 var(--pink-mid);
          transform: translate(-1px, -1px);
        }

        .mock-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .mock-type-badge {
          font-family: var(--font-pixel);
          font-size: 6px;
          padding: 2px 6px;
          flex-shrink: 0;
        }

        .mock-type-badge.sba {
          background: var(--pink-light);
          color: var(--pink-dark);
          border: 1.5px solid var(--pink-mid);
        }

        .mock-type-badge.saq {
          background: var(--green-pale);
          color: #2e7d32;
          border: 1.5px solid var(--green-mid);
        }

        .mock-name {
          color: #555;
          line-height: 1.4;
        }

        .mock-actions {
          display: flex;
          gap: 6px;
          align-items: center;
        }
      `}</style>
    </div>
  )
}
