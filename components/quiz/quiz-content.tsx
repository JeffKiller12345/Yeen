import QuizCard from '@/components/QuizCard'
import SAQCard from '@/components/SAQCard'
import type { AnswerOption, Question, SAQQuestion } from '@/types'

interface QuizContentProps {
  isSAQ: boolean
  currentCase: SAQQuestion[] | null
  currentQuestion: Question | SAQQuestion | undefined
  answers: Record<string, string>
  feedbackMode: 'immediate' | 'end'
  chosenOption: AnswerOption | null
  timerMode: 'per_question' | 'total'
  totalTimeSeconds: number
  onMCQAnswer: (questionId: string, value: AnswerOption) => void
  onSAQAnswer: (questionId: string, value: string) => void
  onScoreOverride: (questionId: string, marksAwarded: number) => void
}

function isMCQQuestion(question: Question | SAQQuestion | undefined): question is Question {
  return Boolean(question && 'options' in question)
}

export default function QuizContent({
  isSAQ,
  currentCase,
  currentQuestion,
  answers,
  feedbackMode,
  chosenOption,
  timerMode,
  totalTimeSeconds,
  onMCQAnswer,
  onSAQAnswer,
  onScoreOverride,
}: QuizContentProps) {
  if (isSAQ && currentCase) {
    return (
      <div className="saq-case">
        <div className="case-context kawaii-panel">
          <span className="pixel-label case-label">★ CLINICAL SCENARIO</span>
          <p className="case-text">{currentCase[0].case_context}</p>
        </div>

        {currentCase.map((subQuestion) => (
          <div key={subQuestion.id}>
            {subQuestion.additional_context && (
              <div className="additional-context">
                <span className="pixel-label additional-label">✦ ADDITIONAL INFO</span>
                <p className="additional-text">{subQuestion.additional_context}</p>
              </div>
            )}
            <SAQCard
              key={subQuestion.id}
              question={subQuestion}
              userAnswer={answers[subQuestion.id] ?? ''}
              showFeedback={feedbackMode === 'immediate'}
              onAnswer={(value) => onSAQAnswer(subQuestion.id, value)}
              onScoreOverride={onScoreOverride}
              timeExpired={timerMode === 'total' && totalTimeSeconds === 0}
              hideContext
            />
          </div>
        ))}

        <style jsx>{`
          .saq-case {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .case-label {
            font-size: 7px;
            margin-bottom: 8px;
            display: block;
          }

          .case-text {
            font-family: var(--font-body);
            font-size: 13px;
            line-height: 1.6;
            margin: 0;
          }

          .additional-context {
            padding: 8px 12px;
            background: #fff8e1;
            border: 2px solid #ffe082;
          }

          .additional-label {
            font-size: 7px;
          }

          .additional-text {
            font-family: var(--font-body);
            font-size: 12px;
            margin: 4px 0 0;
          }
        `}</style>
      </div>
    )
  }

  if (!isSAQ && isMCQQuestion(currentQuestion)) {
    return (
      <QuizCard
        key={currentQuestion.id}
        question={currentQuestion}
        chosen={chosenOption}
        showFeedback={feedbackMode === 'immediate'}
        onAnswer={(value) => onMCQAnswer(currentQuestion.id, value)}
      />
    )
  }

  return null
}
