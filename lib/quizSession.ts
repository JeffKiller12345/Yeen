import { create } from 'zustand'
import type { Question, AnswerOption, QuizMode, StudyFeedbackMode, SAQQuestion, QuestionType } from '@/types'

interface QuizSession {
  questions: Question[]
  saqQuestions: SAQQuestion[]
  questionType: QuestionType
  current: number
  answers: Record<string, string>
  flagged: Set<string>
  mode: QuizMode
  feedbackMode: StudyFeedbackMode
  timePerQuestion: number
  startTime: number | null
  timerMode: 'per_question' | 'total'
  totalTimeSeconds: number 
  expiryTimestamp: number | null // Included in interface

  init: (
    questions: Question[], 
    mode: QuizMode, 
    feedbackMode: StudyFeedbackMode,
    questionType?: QuestionType,
    timerOverride?: number  
  ) => void
  initSAQ: (
    questions: SAQQuestion[],
    mode: QuizMode,
    feedbackMode: StudyFeedbackMode,
    totalTimeSeconds?: number // Added to interface to match implementation
  ) => void
  answer: (id: string, value: string) => void
  toggleFlag: (id: string) => void
  next: () => void
  prev: () => void
  finish: () => void
}

export const useQuizSession = create<QuizSession>()(
  (set, get) => ({
    questions: [],
    saqQuestions: [],
    questionType: 'mcq',
    current: 0,
    answers: {},
    flagged: new Set(),
    mode: 'study',
    feedbackMode: 'immediate',
    timePerQuestion: 72,
    startTime: null,
    timerMode: 'per_question',
    totalTimeSeconds: 0,
    expiryTimestamp: null, // Corrected: this must be a value (null), not a type

    init: (questions, mode, feedbackMode, questionType = 'mcq', timerOverride) => {
      const duration = timerOverride ?? 0;
      set({
        questions,
        saqQuestions: [],
        questionType,
        current: 0,
        answers: {},
        flagged: new Set(),
        mode,
        feedbackMode,
        timerMode: duration > 0 ? 'total' : 'per_question',
        totalTimeSeconds: duration,
        // Calculate the exact moment the quiz expires
        expiryTimestamp: duration > 0 ? Date.now() + duration * 1000 : null,
        startTime: Date.now()
      });
    },

    initSAQ: (questions, mode, feedbackMode, totalTimeSeconds) => {
      const duration = totalTimeSeconds ?? 0;
      set({
        saqQuestions: questions,
        questions: [],
        questionType: 'saq',
        current: 0,
        answers: {},
        flagged: new Set(),
        mode,
        feedbackMode,
        timerMode: duration > 0 ? 'total' : 'per_question',
        totalTimeSeconds: duration,
        // Calculate the exact moment the quiz expires
        expiryTimestamp: duration > 0 ? Date.now() + duration * 1000 : null,
        startTime: Date.now()
      });
    },

    answer: (id, value) =>
      set((s) => ({ answers: { ...s.answers, [id]: value } })),

    toggleFlag: (id) =>
      set((s) => {
        const flagged = new Set(s.flagged)
        flagged.has(id) ? flagged.delete(id) : flagged.add(id)
        return { flagged }
      }),

    next: () =>
      set((s) => {
        const total = s.questionType === 'saq' ? s.saqQuestions.length : s.questions.length
        return { current: Math.min(s.current + 1, total - 1) }
      }),

    prev: () =>
      set((s) => ({ current: Math.max(s.current - 1, 0) })),

    finish: () => {
      const { questions, saqQuestions, answers, questionType } = get()
      const ids = questionType === 'saq'
        ? saqQuestions.map((q) => q.id)
        : questions.map((q) => q.id)
      
      // Dynamic import for the tracker
      import('@/lib/seenTracker').then(({ markSeen }) => markSeen(ids, questionType));
    },
  })
)