export interface Question {
  id: string
  topic: string
  subtopic: string
  question: string
  options: {
    A: string
    B: string
    C: string
    D: string
    E: string
  }
  correct_answer: 'A' | 'B' | 'C' | 'D' | 'E'
  feedback: string
  generated_at: string
}

export type AnswerOption = 'A' | 'B' | 'C' | 'D' | 'E'

export type QuizMode = 'study' | 'exam'

export type StudyFeedbackMode = 'immediate' | 'end'

export type SeenMode = 'all' | 'unseen' | 'seen'

export interface SelectionConfig {
  selections: Record<string, Record<string, number>>
  seenMode: SeenMode
}

export interface QuizResult {
  question: Question
  chosen: AnswerOption | null
  correct: boolean
  flagged: boolean
  timeSpent?: number
}

export type TopicsIndex = Record<string, string[]>

// Add to existing src/types/index.ts
export interface QuizSession {
  questions: Question[]
  current: number
  answers: Record<string, string>
  flagged: Set<string>
  mode: QuizMode
  feedbackMode: StudyFeedbackMode
  timePerQuestion: number
  startTime: number | null
  init: (questions: Question[], mode: QuizMode, feedbackMode: StudyFeedbackMode) => void
  answer: (id: string, option: AnswerOption) => void
  toggleFlag: (id: string) => void
  next: () => void
  prev: () => void
  finish: () => void
}