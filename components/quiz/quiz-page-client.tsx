'use client'

import KawaiiLayout from '@/components/KawaiiLayout'
import QuizContent from '@/components/quiz/quiz-content'
import QuizNavigation from '@/components/quiz/quiz-navigation'
import QuizTopbar from '@/components/quiz/quiz-topbar'
import TimesUpModal from '@/components/quiz/times-up-modal'
import { useQuizPageController } from '@/lib/useQuizPageController'

export default function QuizPageClient() {
  const {
    answer,
    answers,
    chosenOption,
    current,
    currentCase,
    currentQuestion,
    feedbackMode,
    flaggedCount,
    goToNext,
    handleFinish,
    handleScoreOverride,
    handleTotalTimerExpire,
    hasAnsweredCurrent,
    isExam,
    isFlagged,
    isLast,
    isSAQ,
    prev,
    timePerQuestion,
    timerKey,
    timerMode,
    timesUp,
    toggleFlag,
    total,
    totalTimeSeconds,
  } = useQuizPageController()

  if (total === 0) {
    return null
  }

  return (
    <KawaiiLayout>
      <div className="quiz-layout">
        <QuizTopbar
          current={current}
          total={total}
          flaggedCount={flaggedCount}
          isFlagged={isFlagged}
          isExam={isExam}
          timerMode={timerMode}
          totalTimeSeconds={totalTimeSeconds}
          timePerQuestion={timePerQuestion}
          timerKey={timerKey}
          onToggleFlag={() => {
            if (currentQuestion) {
              toggleFlag(currentQuestion.id)
            }
          }}
          onPerQuestionExpire={goToNext}
          onTotalTimerExpire={handleTotalTimerExpire}
        />

        <QuizContent
          isSAQ={isSAQ}
          currentCase={currentCase}
          currentQuestion={currentQuestion}
          answers={answers}
          feedbackMode={feedbackMode}
          chosenOption={chosenOption}
          timerMode={timerMode}
          totalTimeSeconds={totalTimeSeconds}
          onMCQAnswer={(questionId, value) => answer(questionId, value)}
          onSAQAnswer={(questionId, value) => answer(questionId, value)}
          onScoreOverride={handleScoreOverride}
        />

        <QuizNavigation
          current={current}
          total={total}
          isLast={isLast}
          canProceed={hasAnsweredCurrent}
          onPrev={prev}
          onNext={goToNext}
        />
      </div>

      {timesUp && <TimesUpModal onAutoSubmit={() => void handleFinish()} />}

      <style jsx>{`
        .quiz-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 720px;
          margin: 0 auto;
        }
      `}</style>
    </KawaiiLayout>
  )
}
