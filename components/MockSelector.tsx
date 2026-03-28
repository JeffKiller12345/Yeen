'use client'
import { useState } from 'react'
import { useEffect } from 'react'
import { fetchMocks, loadSBAMock, loadSAQMock } from '@/lib/mockLoader'
import { useQuizSession } from '@/lib/quizSession'
import { useRouter } from 'next/navigation'
import type { Mock, QuizSession } from '@/types'

export default function MockSelector() {
  const router = useRouter()
  const init = useQuizSession((s: QuizSession) => s.init)
  const initSAQ = useQuizSession((s: QuizSession) => s.initSAQ)

  const [mocks, setMocks] = useState<Mock[]>([])
  const [filter, setFilter] = useState<'all' | 'sba' | 'saq'>('all')
  const [loading, setLoading] = useState(true)
  const [launching, setLaunching] = useState<string | null>(null)
  const [exporting, setExporting] = useState<string | null>(null)
  const [loadingProgress, setLoadingProgress] = useState('')

  useEffect(() => {
    fetchMocks().then(m => {
      setMocks(m)
      setLoading(false)
    })
  }, [])

  const sbaMocks = mocks.filter(m => m.type === 'sba')
  const saqMocks = mocks.filter(m => m.type === 'saq')
  const displayed = filter === 'all' ? mocks : filter === 'sba' ? sbaMocks : saqMocks

  const launchMock = async (mock: Mock) => {
    setLaunching(mock.id)
    setLoadingProgress('Fetching questions...')
    try {
      if (mock.type === 'sba') {
        const questions = await loadSBAMock(mock)
        setLoadingProgress(`Loaded ${questions.length} questions`)
        init(questions, 'exam', 'end', 'mcq')
      } else {
        const questions = await loadSAQMock(mock)
        setLoadingProgress(`Loaded ${questions.length} questions`)
        initSAQ(questions, 'exam', 'end')
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
        ? await loadSBAMock(mock)
        : await loadSAQMock(mock)

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

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m} mins`
  }

  return (
    <div className="mock-selector kawaii-panel">
      <p className="pixel-label" style={{ marginBottom: '12px' }}>★ MOCK PAPERS</p>

      {/* Filter tabs */}
      <div className="mock-filter">
        {(['all', 'sba', 'saq'] as const).map(f => (
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

              <div className="mock-stats">
                <div className="mock-stat">
                  <span className="stat-value">{mock.total_questions}</span>
                  <span className="stat-label">questions</span>
                </div>
                {mock.total_marks && (
                  <div className="mock-stat">
                    <span className="stat-value">{mock.total_marks}</span>
                    <span className="stat-label">marks</span>
                  </div>
                )}
                <div className="mock-stat">
                  <span className="stat-value">{formatTime(mock.time_seconds)}</span>
                  <span className="stat-label">allowed</span>
                </div>
              </div>

              <div className="mock-actions">
                <button
                  className={`btn-kawaii ${mock.type === 'saq' ? 'green' : ''}`}
                  style={{ flex: 1, fontSize: '7px', marginTop: '8px' }}
                  onClick={() => launchMock(mock)}
                  disabled={launching === mock.id || exporting === mock.id}
                >
                  {launching === mock.id ? 'LOADING...' : '▶ START'}
                </button>

                <button
                  className="btn-kawaii"
                  style={{ fontSize: '7px', marginTop: '8px', padding: '10px' }}
                  onClick={() => exportMock(mock)}
                  disabled={launching === mock.id || exporting === mock.id}
                  title="Export as PDF"
                >
                  {exporting === mock.id ? '...' : '⬇'}
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

        .mock-stats {
          display: flex;
          gap: 8px;
          margin-bottom: 4px;
        }

        .mock-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          padding: 6px 4px;
          background: var(--cream);
          border: 1px solid var(--border-px);
        }

        .stat-value {
          font-family: var(--font-pixel);
          font-size: 10px;
          color: var(--pink-dark);
        }

        .stat-label {
          font-family: var(--font-body);
          font-size: 10px;
          color: #aaa;
        }

        .mock-actions {
          display: flex;
          gap: 6px;
          align-items: flex-end;
        }
      `}</style>
    </div>
  )
}
