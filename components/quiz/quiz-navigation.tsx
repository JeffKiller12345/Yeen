interface QuizNavigationProps {
  current: number
  total: number
  isLast: boolean
  canProceed: boolean
  onPrev: () => void
  onNext: () => void
}

export default function QuizNavigation({
  current,
  total,
  isLast,
  canProceed,
  onPrev,
  onNext,
}: QuizNavigationProps) {
  return (
    <div className="quiz-nav">
      <button className="btn-kawaii" onClick={onPrev} disabled={current === 0}>
        ◀ PREV
      </button>
      <span className="question-counter pixel-label">
        {current + 1} / {total}
      </span>
      <button
        className={`btn-kawaii nav-next ${isLast ? 'nav-next-last' : ''} ${!canProceed ? 'nav-next-dim' : ''}`}
        onClick={onNext}
      >
        {isLast ? '★ FINISH' : 'NEXT ▶'}
      </button>

      <style jsx>{`
        .quiz-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 8px;
          padding-top: 16px;
          border-top: 2px dashed var(--pink-mid);
        }

        .question-counter {
          font-size: 8px;
          color: #aaa;
        }

        .nav-next-last {
          background: var(--green-pale);
        }

        .nav-next-dim {
          opacity: 0.7;
        }

        .btn-kawaii:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }
      `}</style>
    </div>
  )
}
