'use client'

import MockSelector from '@/components/MockSelector'
import ModeSelector from '@/components/ModeSelector'
import TopicSelector from '@/components/TopicSelector'
import KawaiiLayout from '@/components/KawaiiLayout'
import DashboardActions from '@/components/dashboard/dashboard-actions'
import GoodLuckBanner from '@/components/dashboard/good-luck-banner'
import { useDashboardController } from '@/lib/useDashboardController'

export default function DashboardClient() {
  const {
    error,
    examMode,
    feedbackMode,
    handleExport,
    handleSeenReset,
    handleStartCustom,
    handleTopicsLoaded,
    isExporting,
    isLoading,
    phaseConfig,
    questionType,
    seenMode,
    seenResetKey,
    setExamMode,
    setFeedbackMode,
    setQuestionType,
    setSeenMode,
    setSelections,
    setStudentPhase,
    studentPhase,
    totalSelected,
  } = useDashboardController()

  return (
    <KawaiiLayout
      title="✿ YEEN ✿"
      subtitle="welcome! pick your topics and start studying ♡"
      onSeenReset={handleSeenReset}
    >
      <GoodLuckBanner />

      <div className="dashboard">
        <ModeSelector
          examMode={examMode}
          onExamModeChange={setExamMode}
          feedbackMode={feedbackMode}
          onFeedbackModeChange={setFeedbackMode}
          seenMode={seenMode}
          onSeenModeChange={setSeenMode}
          studentPhase={studentPhase}
          onStudentPhaseChange={setStudentPhase}
          questionType={questionType}
          onQuestionTypeChange={setQuestionType}
          saqEnabled={phaseConfig.saqEnabled}
          onSeenReset={handleSeenReset}
        />

        <TopicSelector
          key={seenResetKey}
          questionType={questionType}
          studentPhase={studentPhase}
          onChange={setSelections}
          onTopicsLoaded={handleTopicsLoaded}
        />

        {error && (
          <div className="error-msg">
            <span className="pixel-label dashboard-error-text">✗ {error}</span>
          </div>
        )}

        <DashboardActions
          isLoading={isLoading}
          isExporting={isExporting}
          totalSelected={totalSelected}
          onStartCustom={handleStartCustom}
          onExport={handleExport}
        />

        <MockSelector studentPhase={studentPhase} />
      </div>

      <style jsx>{`
        .dashboard {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 720px;
          margin: 0 auto;
        }

        .error-msg {
          padding: 8px 12px;
          background: #ffebee;
          border: 2px solid #ef9a9a;
        }

        .dashboard-error-text {
          font-size: 7px;
          color: #c62828;
        }

      `}</style>
    </KawaiiLayout>
  )
}
