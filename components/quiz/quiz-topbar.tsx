import FlagButton from '@/components/FlagButton'
import ProgressBar from '@/components/ProgressBar'
import Timer from '@/components/Timer'
import TotalTimer from '@/components/TotalTimer'

interface QuizTopbarProps {
  current: number
  total: number
  flaggedCount: number
  isFlagged: boolean
  isExam: boolean
  timerMode: 'per_question' | 'total'
  totalTimeSeconds: number
  timePerQuestion: number
  timerKey: number
  onToggleFlag: () => void
  onPerQuestionExpire: () => void
  onTotalTimerExpire: () => void
}

export default function QuizTopbar({
  current,
  total,
  flaggedCount,
  isFlagged,
  isExam,
  timerMode,
  totalTimeSeconds,
  timePerQuestion,
  timerKey,
  onToggleFlag,
  onPerQuestionExpire,
  onTotalTimerExpire,
}: QuizTopbarProps) {
  return (
    <div className="quiz-topbar">
      <ProgressBar current={current} total={total} flaggedCount={flaggedCount} />
      <div className="quiz-controls">
        <FlagButton flagged={isFlagged} onToggle={onToggleFlag} />
        {isExam && timerMode === 'total' && (
          <TotalTimer totalSeconds={totalTimeSeconds} onExpire={onTotalTimerExpire} />
        )}
        {isExam && timerMode === 'per_question' && (
          <Timer
            key={timerKey}
            totalSeconds={timePerQuestion}
            onExpire={onPerQuestionExpire}
          />
        )}
      </div>

      <style jsx>{`
        .quiz-topbar {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .quiz-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
      `}</style>
    </div>
  )
}
