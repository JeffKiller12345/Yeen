export type StudentPhase = 'phase1' | 'phase2a' | 'phase2b';

export interface PhaseConfig {
  label: string
  mcqTable: 'questions' | 'medical_questions'
  saqTable: 'saq_questions' | 'phase1saq'
  mockSection: string
  saqEnabled: boolean
}

export const PHASE_CONFIG: Record<StudentPhase, PhaseConfig> = {
  phase1: {
    label: 'Phase 1',
    mcqTable: 'medical_questions',
    saqTable: 'phase1saq',
    mockSection: 'phase1',
    saqEnabled: true,
  },
  phase2a: {
    label: 'Phase 2a',
    mcqTable: 'questions',
    saqTable: 'saq_questions',
    mockSection: 'phase2a',
    saqEnabled: true,
  },
  phase2b: {
    label: 'Phase 2b',
    mcqTable: 'questions', // adjust to your Phase 2b MCQ database table
    saqTable: 'saq_questions', // adjust to your Phase 2b SAQ database table
    mockSection: 'phase2b',
    saqEnabled: true,
  },
};
