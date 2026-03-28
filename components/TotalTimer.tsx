'use client'
import { useEffect, useState, useCallback } from 'react'
import { useQuizSession } from '@/lib/quizSession'

interface Props {
  onExpire: () => void
}

export default function TotalTimer({ onExpire }: Props) {
  // 1. Grab ONLY the timestamp. This component only re-renders if 
  // the timestamp itself changes (which only happens at quiz start).
  const expiryTimestamp = useQuizSession(s => s.expiryTimestamp)
  
  // 2. Local state for the "tick"
  const [remaining, setRemaining] = useState(0)

  const calculateRemaining = useCallback(() => {
    if (!expiryTimestamp) return 0
    const diff = Math.floor((expiryTimestamp - Date.now()) / 1000)
    return Math.max(0, diff)
  }, [expiryTimestamp])

  useEffect(() => {
    // Sync initial state
    setRemaining(calculateRemaining())

    const id = setInterval(() => {
      const timeLeft = calculateRemaining()
      setRemaining(timeLeft)

      if (timeLeft <= 0) {
        clearInterval(id)
        onExpire()
      }
    }, 1000)

    return () => clearInterval(id)
  }, [calculateRemaining, onExpire])

  const h = Math.floor(remaining / 3600)
  const m = Math.floor((remaining % 3600) / 60)
  const s = remaining % 60
  const urgent = remaining < 300 // under 5 mins

  const display = h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`

  return (
    <div className={`total-timer ${urgent ? 'urgent' : ''}`}>
      <span className="pixel-label" style={{ fontSize: '6px' }}>TIME REMAINING</span>
      <span className="timer-value">{display}</span>

      <style jsx>{`
        .total-timer {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          padding: 6px 10px;
          border: 2px solid var(--pink-mid);
          background: var(--pink-light);
        }

        .timer-value {
          font-family: var(--font-pixel);
          font-size: 16px;
          color: var(--pink-dark);
          letter-spacing: 0.1em;
        }

        .total-timer.urgent {
          border-color: #c62828;
          background: #ffebee;
          animation: blink 0.5s step-end infinite;
        }

        .total-timer.urgent .timer-value { color: #c62828; }

        @keyframes blink { 50% { opacity: 0.4; } }
      `}</style>
    </div>
  )
}