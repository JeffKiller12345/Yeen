export type StudentPhase = 'phase1' | 'phase2a' | 'phase2b';

export interface PhaseConfig {
  label: string
  mcqTable: 'questions' | 'medical_questions'
  saqTable: 'saq_questions' | 'phase1saq'
  mockSection: string
  saqEnabled: boolean
  settings: {
    questionType: boolean
    stationPool: boolean
    resetProgress: boolean
    feedbackTiming: boolean
  }
  stationTopics?: string[]
}

export const PHASE_CONFIG: Record<StudentPhase, PhaseConfig> = {
  phase1: {
    label: 'Phase 1',
    mcqTable: 'medical_questions',
    saqTable: 'phase1saq',
    mockSection: 'phase1',
    saqEnabled: true,
    settings: { questionType: true, stationPool: true, resetProgress: true, feedbackTiming: true },
  },
  phase2a: {
    label: 'Phase 2a',
    mcqTable: 'questions',
    saqTable: 'saq_questions',
    mockSection: 'phase2a',
    saqEnabled: true,
    settings: { questionType: true, stationPool: true, resetProgress: true, feedbackTiming: true },
  },
  phase2b: {
    label: 'Phase 2b',
    mcqTable: 'questions', // adjust to your Phase 2b MCQ database table
    saqTable: 'saq_questions', // adjust to your Phase 2b SAQ database table
    mockSection: 'phase2b',
    saqEnabled: false,
    settings: { questionType: false, stationPool: true, resetProgress: true, feedbackTiming: true },
    stationTopics: [
      'Histories',
      'Examinations',
      'Assessment of Risk Factors',
      'Assessment of Chronic Diseases',
    ],
  },
};
