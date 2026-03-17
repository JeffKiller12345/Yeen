import { NextRequest, NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import type { Question } from '@/types'
import { z } from 'zod'

const schema = z.object({
  questions: z.array(z.object({
    id: z.string(),
    topic: z.string(),
    subtopic: z.string(),
    question: z.string(),
    options: z.record(z.string(), z.string()),
    correct_answer: z.enum(['A', 'B', 'C', 'D', 'E']),
    feedback: z.string(),
    generated_at: z.string().optional(),
  })).min(1).max(200)
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { questions } = parsed.data
  
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = 210
    const margin = 20
    const maxW = pageW - margin * 2
    let y = 20

    const checkPage = (needed: number) => {
      if (y + needed > 270) { doc.addPage(); y = 20 }
    }

    // Header
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Yeen — Practice Paper', pageW / 2, y, { align: 'center' })
    y += 8
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`${questions.length} Questions · ${Math.ceil(questions.length * 1.2)} Minutes Allowed`, pageW / 2, y, { align: 'center' })
    y += 6
    doc.setDrawColor(0)
    doc.line(margin, y, pageW - margin, y)
    y += 8

    questions.forEach((q, i) => {
      // Topic tag
      checkPage(40)
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(`${q.topic} › ${q.subtopic}`, margin, y)
      y += 5

      // Question number + stem
      doc.setFontSize(10)
      doc.setTextColor(0)
      doc.setFont('helvetica', 'bold')
      doc.text(`Question ${i + 1}`, margin, y)
      y += 5

      doc.setFont('helvetica', 'normal')
      const stemLines = doc.splitTextToSize(q.question, maxW)
      checkPage(stemLines.length * 5 + 30)
      doc.text(stemLines, margin, y)
      y += stemLines.length * 5 + 3

      // Options
      Object.entries(q.options).forEach(([letter, text]) => {
        const optLines = doc.splitTextToSize(`${letter}.  ${text}`, maxW - 8)
        checkPage(optLines.length * 5)
        doc.text(optLines, margin + 4, y)
        y += optLines.length * 5 + 1
      })

      y += 6 // gap between questions
    })
// Answer key section
doc.addPage()
y = 20

doc.setFontSize(16)
doc.setFont('helvetica', 'bold')
doc.setTextColor(0)
doc.text('Answer Key', pageW / 2, y, { align: 'center' })
y += 6
doc.setDrawColor(0)
doc.line(margin, y, pageW - margin, y)
y += 10

questions.forEach((q, i) => {
  checkPage(30)

  // Question number + correct answer
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0)
  doc.text(`Q${i + 1}.  ${q.correct_answer}`, margin, y)
  y += 5

  // Answer text
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  const answerText = q.options[q.correct_answer as keyof typeof q.options]
  const answerLines = doc.splitTextToSize(`${answerText}`, maxW - 12)
  doc.text(answerLines, margin + 8, y)
  y += answerLines.length * 5 + 3

  // Feedback
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  const feedbackLines = doc.splitTextToSize(q.feedback, maxW - 8)
  checkPage(feedbackLines.length * 4 + 4)
  doc.text(feedbackLines, margin + 4, y)
  y += feedbackLines.length * 4 + 6

  // Divider between answers
  doc.setDrawColor(200)
  doc.line(margin, y, pageW - margin, y)
  y += 6
})
    // Page numbers
    const pageCount = doc.getNumberOfPages()
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p)
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(`Page ${p} of ${pageCount}`, pageW - margin, 287, { align: 'right' })
      doc.text('Yeen Practice Paper', margin, 287)
    }

    const buffer = Buffer.from(doc.output('arraybuffer'))
    const uint8 = new Uint8Array(buffer)

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="yeenquiz-paper-${Date.now()}.pdf"`,
      },
    })
  } catch (err) {
    console.error('PDF export error:', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}