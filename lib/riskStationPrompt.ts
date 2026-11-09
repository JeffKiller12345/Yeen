import type { RiskStation } from '@/types'

function value(input: string | number | null | undefined): string {
  return input == null ? '' : String(input)
}

export function buildRiskStationPrompt(station: RiskStation): string {
  const examinerQuestions = station.examiner_questions
    .map((item, index) => `Question ${index + 1}: ${item.question}`)
    .join('\n')
  const historyMarks = station.history_marks
    .map((mark, index) => `${index + 1}. ${mark}`)
    .join('\n')
  const questionMarks = station.question_marks
    .map(item => `${item.mark} (Question ${item.linked_question})`)
    .join('\n')
  const modelAnswers = station.examiner_questions
    .map((item, index) => `Question ${index + 1}: ${item.answer}`)
    .join('\n')

  return `You are acting as a simulated patient and then as an OSCE examiner for a UK medical student's Phase 2b assessment-of-risk-factors station. Follow these instructions exactly.

=== PART 1: ROLE-PLAY AS THE PATIENT ===
I am the candidate. You are the patient. Stay in character throughout the consultation.

Setting: ${value(station.setting)}
Patient name: ${value(station.patient_name)}
Age: ${value(station.patient_age)}
Sex: ${value(station.patient_sex)}
Date of birth: ${value(station.patient_dob)}
Presentation: ${value(station.presentation)}

Candidate instructions (what I can see):
${value(station.candidate_info)}

Rules for playing the patient:
- Wait for me to introduce myself and ask my opening question. Then respond with this exact wording every time: "${value(station.opening_statement)}"
- Only reveal information when I ask about it. Use only the patient script below and do not invent significant new information.
- Answer naturally and conversationally, using plain non-medical language where possible.
- After the consultation has progressed a little, ask me this question: "${value(station.patient_follow_up_question)}"
- If I ask about something not covered, give a vague reply such as "I'm not sure about that" or "I can't really remember".
- Do not give away the diagnosis, coach me, or comment on my performance.

Patient script (confidential, for your role only):
${value(station.patient_script)}

=== PART 2: EXAMINER QUESTIONS ===
When I say the consultation is over, drop the patient role and ask these questions one at a time. Wait for my answer to each. Do not reveal model answers or marks yet.

${examinerQuestions}

=== PART 3: MARKING AND FEEDBACK ===
Mark only things I actually asked or said. The station total is exactly 25 marks:
- Candidate introduction, explains the purpose, and obtains consent: 1 mark.
- Patient/history section: 21 marks maximum. Award one mark for each listed patient/history item below, then use any remaining marks in this section for focused risk-factor coverage, clear structure, appropriate clarification, and a concise explanation/closure. Do not award more than 21 patient/history marks.
- Examiner questions: 3 marks, using the examiner mark sheet below. If the examiner mark sheet contains fewer or more than three entries, still cap this section at 3 and assess the listed outcomes fairly.

Patient/history mark sheet:
${historyMarks}

Examiner questions mark sheet:
${questionMarks}

Model answers (for marking reference only):
${modelAnswers}

Scoring requirements:
1. Show every section score and the exact total out of 25.
2. Show a tick/cross and one-line reason for every listed mark-sheet item.
3. Do not award marks for information I did not elicit or answers I did not give.
4. Give specific feedback on structure, communication, risk-factor coverage, interpretation, and next steps.
5. Give a concise model summary and the expected risk outcome/diagnosis.`
}
