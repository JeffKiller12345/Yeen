'use client'
interface Props {
  flagged: boolean
  onToggle: () => void
}

export default function FlagButton({ flagged, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className={`flag-btn ${flagged ? 'flagged' : ''}`}
      title={flagged ? 'Remove flag' : 'Flag for review'}
      aria-label={flagged ? 'Remove flag' : 'Flag this question for review'}
    >
      <span className="flag-icon">{flagged ? '🚩' : '⚑'}</span>
      <span className="flag-label pixel-text-sm">
        {flagged ? 'FLAGGED' : 'FLAG'}
      </span>

      <style jsx>{`
        .flag-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: white;
          border: 2px solid #bdbdbd;
          padding: 6px 12px;
          cursor: pointer;
          box-shadow: 2px 2px 0 #bdbdbd;
          transition: all 0.1s;
          font-family: var(--font-pixel);
        }

        .flag-btn:hover {
          border-color: #e65100;
          box-shadow: 2px 2px 0 #e65100;
        }

        .flag-btn.flagged {
          background: #fff3e0;
          border-color: #e65100;
          box-shadow: 2px 2px 0 #e65100;
        }

        .flag-btn:active {
          transform: translate(2px, 2px);
          box-shadow: none;
        }

        .flag-icon { font-size: 14px; line-height: 1; }

        .flag-label {
          font-size: 7px;
          color: ${flagged ? '#e65100' : '#888'};
        }
      `}</style>
    </button>
  )
}