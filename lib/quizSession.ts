import { create } from 'zustand'
import type { Question, AnswerOption, QuizMode, StudyFeedbackMode } from '@/types'

interface QuizSession {
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

export const useQuizSession = create<QuizSession>()(
  (set, get) => ({
    questions: [],
    current: 0,
    answers: {},
    flagged: new Set(),
    mode: 'study' as QuizMode,
    feedbackMode: 'immediate' as StudyFeedbackMode,
    timePerQuestion: 72,
    startTime: null,

    init: (questions: Question[], mode: QuizMode, feedbackMode: StudyFeedbackMode) =>
      set({ questions, current: 0, answers: {}, flagged: new Set(), mode, feedbackMode, startTime: Date.now() }),

    answer: (id: string, option: AnswerOption) =>
      set((s: QuizSession) => ({ answers: { ...s.answers, [id]: option } })),

    toggleFlag: (id: string) =>
      set((s: QuizSession) => {
        const flagged = new Set(s.flagged)
        flagged.has(id) ? flagged.delete(id) : flagged.add(id)
        return { flagged }
      }),

    next: () =>
      set((s: QuizSession) => ({
        current: Math.min(s.current + 1, s.questions.length - 1)
      })),

    prev: () =>
      set((s: QuizSession) => ({
        current: Math.max(s.current - 1, 0)
      })),

    finish: () => {
      const { questions, answers } = get()
      import('@/lib/seenTracker').then(({ markSeen }) => {
        markSeen(questions.map((q: Question) => q.id))
      })
    },
  })
)