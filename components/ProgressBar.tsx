'use client'
interface Props {
  current: number   // 0-indexed
  total: number
  flaggedCount?: number
}

export default function ProgressBar({ current, total, flaggedCount = 0 }: Props) {
  const percent = Math.round(((current + 1) / total) * 100)

  return (
    <div className="progress-wrapper">
      <div className="progress-meta">
        <span className="pixel-label">
          QUESTION {current + 1} / {total}
        </span>
        {flaggedCount > 0 && (
          <span className="flag-count">🚩 {flaggedCount} flagged</span>
        )}
        <span className="pixel-label">{percent}%</span>
      </div>

      <div className="progress-track">
        {/* Segment-style bar — one cell per question */}
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`progress-segment ${
              i < current ? 'done' :
              i === current ? 'active' : 'pending'
            }`}
          />
        ))}
      </div>

      <style jsx>{`
        .progress-wrapper { margin-bottom: 20px; }

        .progress-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          font-family: var(--font-pixel);
          font-size: 7px;
          color: var(--pink-dark);
        }

        .flag-count {
          font-family: var(--font-body);
          font-size: 11px;
          color: #e65100;
        }

        .progress-track {
          display: flex;
          gap: 2px;
          height: 14px;
          border: 2px solid var(--pink-mid);
          padding: 2px;
          background: var(--pink-light);
        }

        .progress-segment {
          flex: 1;
          height: 100%;
          transition: background 0.2s;
        }

        .progress-segment.done {
          background: var(--green-mid);
        }

        .progress-segment.active {
          /* Animated pink-stripe for current */
          background: repeating-linear-gradient(
            90deg,
            var(--pink-mid) 0,
            var(--pink-mid) 4px,
            var(--pink-light) 4px,
            var(--pink-light) 8px
          );
          animation: march 0.4s linear infinite;
        }

        .progress-segment.pending {
          background: transparent;
        }

        @keyframes march {
          to { background-position: 8px 0; }
        }
      `}</style>
    </div>
  )
}