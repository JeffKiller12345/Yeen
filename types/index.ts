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

export interface SAQResult {
  question: SAQQuestion
  userAnswer: string
  awarded: boolean
  flagged: boolean
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

export interface QuizSession {
  questions: Question[]
  saqQuestions: SAQQuestion[]
  questionType: QuestionType
  current: number
  answers: Record<string, string>
  flagged: Set<string>
  mode: QuizMode
  feedbackMode: StudyFeedbackMode
  timePerQuestion: number
  timerMode: 'per_question' | 'total'  
  totalTimeSeconds: number               
  startTime: number | null
  init: (questions: Question[], mode: QuizMode, feedbackMode: StudyFeedbackMode, questionType?: QuestionType) => void
  initSAQ: (questions: SAQQuestion[], mode: QuizMode, feedbackMode: StudyFeedbackMode) => void
  answer: (id: string, value: string) => void
  toggleFlag: (id: string) => void
  next: () => void
  prev: () => void
  finish: () => void
}

export interface SAQQuestion {
  id: string
  topic: string
  subtopic: string
  case_context: string
  additional_context: string
  question: string
  marks: number
  acceptable_answers: string[]
  feedback: string
  generated_at: string
}

export type QuestionType = 'mcq' | 'saq'

export interface SAQResult {
  question: SAQQuestion
  userAnswer: string
  awarded: boolean
  flagged: boolean
}

export interface Mock {
  id: string;
  name: string;
  type: 'sba' | 'saq';
  question_ids: string[];
  total_questions: number;
  time_seconds: number;
  total_marks?: number; // Optional because SBAs don't usually use "marks" the same way
  is_active: boolean;
}