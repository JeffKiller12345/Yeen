'use client'
import { useEffect, useState } from 'react'

interface Props {
  totalSeconds: number
  onExpire: () => void
}

export default function Timer({ totalSeconds, onExpire }: Props) {
  const [remaining, setRemaining] = useState(totalSeconds)

  useEffect(() => {
    setRemaining(totalSeconds)
    const id = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(id); onExpire(); return 0 }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [totalSeconds])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const urgent = remaining < 30

  return (
    <div className={`timer-display ${urgent ? 'urgent' : ''}`}>
      <span className="pixel-label">TIME</span>
      <span className="timer-value">
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </span>
    </div>
  )
}