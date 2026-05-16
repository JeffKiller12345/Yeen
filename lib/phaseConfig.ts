export type StudentPhase = 'phase2a' | 'phase1'

export interface PhaseConfig {
  label: string
  mcqTable: 'questions' | 'medical_questions'
  saqTable: 'saq_questions' | 'phase1saq'
  mockSection: string
  saqEnabled: boolean
}

export const PHASE_CONFIG: Record<StudentPhase, PhaseConfig> = {
  phase2a: {
    label: 'Phase 2a',
    mcqTable: 'questions',
    saqTable: 'saq_questions',
    mockSection: 'phase2a',
    saqEnabled: true,
  },
  phase1: {
    label: 'Phase 1',
    mcqTable: 'medical_questions',
    saqTable: 'phase1saq',
    mockSection: 'phase1',
    saqEnabled: true,
  },
}
