interface DashboardActionsProps {
  isLoading: boolean
  isExporting: boolean
  totalSelected: number
  onStartCustom: () => void
  onExport: () => void
}

export default function DashboardActions({
  isLoading,
  isExporting,
  totalSelected,
  onStartCustom,
  onExport,
}: DashboardActionsProps) {
  return (
    <>
      <div className="dashboard-actions">
        <div className="action-primary">
          <button
            className={`btn-kawaii dashboard-button ${isLoading ? 'dashboard-button-disabled' : ''}`}
            onClick={onStartCustom}
            disabled={isLoading}
          >
            {isLoading ? '⏳ LOADING...' : '▶ START CUSTOM QUIZ'}
            {!isLoading && totalSelected > 0 && (
              <span className="q-count-pill">{totalSelected}q</span>
            )}
          </button>
        </div>
        <div className="action-secondary">
          <button
            className={`btn-kawaii ${isExporting ? 'dashboard-button-disabled' : ''}`}
            onClick={onExport}
            disabled={isExporting}
          >
            {isExporting ? '⏳ EXPORTING...' : '⬇ EXPORT PDF'}
          </button>
        </div>
      </div>
      <style jsx>{`
        .dashboard-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 4px;
        }

        .action-primary .dashboard-button {
          width: 100%;
          font-size: 10px;
          padding: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .q-count-pill {
          background: var(--pink-dark);
          color: white;
          font-size: 7px;
          padding: 2px 8px;
          border-radius: 0;
        }

        .action-secondary {
          display: flex;
          gap: 10px;
        }

        .action-secondary .btn-kawaii {
          flex: 1;
        }

        .dashboard-button-disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </>
  )
}
