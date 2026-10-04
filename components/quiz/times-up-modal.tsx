interface TimesUpModalProps {
  onAutoSubmit: () => void
}

export default function TimesUpModal({ onAutoSubmit }: TimesUpModalProps) {
  return (
    <div className="timesup-overlay">
      <div className="timesup-modal kawaii-panel">
        <div className="timesup-icon">⏰</div>
        <p className="pixel-label timesup-label">TIME&apos;S UP!</p>
        <p className="timesup-body">Your time has expired. Please submit your quiz now.</p>
        <button className="btn-kawaii timesup-submit" onClick={onAutoSubmit}>
          ★ AUTO-SUBMIT
        </button>
      </div>

      <style jsx>{`
        .timesup-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
        }

        .timesup-modal {
          max-width: 380px;
          width: 90%;
          text-align: center;
          padding: 32px 28px;
          animation: pop-in 0.2s ease-out;
        }

        .timesup-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }

        .timesup-label {
          font-size: 10px;
          margin-bottom: 4px;
        }

        .timesup-body {
          font-family: var(--font-body);
          font-size: 13px;
          color: #555;
          margin: 8px 0 20px;
          line-height: 1.6;
        }

        .timesup-submit {
          font-size: 9px;
          padding: 12px 24px;
        }

        @keyframes pop-in {
          from {
            transform: scale(0.85);
            opacity: 0;
          }

          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
