# ✿ YEEN ✿

A medical quiz platform for Phase 2a students, inspired by Quesmed. Built with Next.js 16 and styled with a Y2K pixel aesthetic.

## Features

- **Custom Quiz Builder** — select specific topics and subtopics with per-subtopic question counts
- **Mock Paper Mode** — auto-generates a full paper weighted toward high-yield topics
- **Exam Mode** — 1.2 minute per question countdown timer
- **Study Mode** — immediate answer feedback with detailed explanations
- **Seen/Unseen Tracking** — filters questions you've already attempted via localStorage
- **PDF Export** — generates a formatted exam paper with full answer key
- **Flag Questions** — mark questions for later review
- **Results Dashboard** — score breakdown by topic with flagged question review

## Tech Stack

- Next.js 16 (Turbopack)
- TypeScript
- Zustand (quiz session state)
- jsPDF (PDF generation)
- CSS variables + styled-jsx (kawaii theme)

## Getting Started
```bash
pnpm install
pnpm run build:topics
pnpm run dev
```

## Data Format

Questions are stored in `data/questions.json` as an array:
```json
{
  "id": "card_0001",
  "topic": "Pathology",
  "subtopic": "Describe the nature of disease",
  "question": "...",
  "options": { "A": "...", "B": "...", "C": "...", "D": "...", "E": "..." },
  "correct_answer": "C",
  "feedback": "...",
  "generated_at": "2026-01-01T00:00:00"
}
```

Run `pnpm run build:topics` after adding new questions to regenerate the topic index.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# Yeen
