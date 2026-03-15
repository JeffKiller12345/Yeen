'use client'
import { useEffect } from 'react'
import KawaiiLayout from '@/components/KawaiiLayout'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorBoundary({ error, reset }: Props) {
  useEffect(() => {
    console.error('MedQuiz error:', error)
  }, [error])

  return (
    <KawaiiLayout title="✗ OOPS ✗">
      <div className="error-wrapper kawaii-panel" style={{ textAlign: 'center', padding: '32px' }}>
        <p style={{ fontSize: '32px', margin: '0 0 12px' }}>💔</p>
        <p className="pixel-label" style={{ color: '#c62828', marginBottom: '16px' }}>
          SOMETHING WENT WRONG
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#888', marginBottom: '24px' }}>
          {error.message ?? 'An unexpected error occurred.'}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button className="btn-kawaii" onClick={reset}>
            ↺ TRY AGAIN
          </button>
          <a href="/" className="btn-kawaii green" style={{ textDecoration: 'none' }}>
            ♡ GO HOME
          </a>
        </div>
      </div>
    </KawaiiLayout>
  )
}