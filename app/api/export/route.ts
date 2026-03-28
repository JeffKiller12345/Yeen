import { NextRequest, NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import { z } from 'zod'

const schema = z.object({
  questions: z.array(z.any()).min(1).max(500),
  questionType: z.enum(['mcq', 'saq']).default('mcq'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // ✅ Destructure both fields from parsed data
    const { questions, questionType } = parsed.data

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
    doc.text(
      `${questions.length} Questions · ${Math.ceil(questions.length * 1.2)} Minutes Allowed`,
      pageW / 2, y, { align: 'center' }
    )
    y += 6
    doc.setDrawColor(0)
    doc.line(margin, y, pageW - margin, y)
    y += 8

    // ✅ Branch is now correctly inside POST, after questionType is available
    if (questionType === 'saq') {
      // --- SAQ format ---
      questions.forEach((q: any, i: number) => {
        checkPage(50)

        // Topic tag
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(`${q.topic} › ${q.subtopic}`, margin, y)
        y += 5

        // Case context
        if (q.case_context) {
          const caseLines = doc.splitTextToSize(`Context: ${q.case_context}`, maxW)
          checkPage(caseLines.length * 5)
          doc.setFontSize(9)
          doc.setTextColor(80)
          doc.setFont('helvetica', 'italic')
          doc.text(caseLines, margin, y)
          y += caseLines.length * 5 + 3
        }

        // Question stem + marks
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(0)
        doc.text(`Q${i + 1}. [${q.marks} mark${q.marks > 1 ? 's' : ''}]`, margin, y)
        y += 5

        doc.setFont('helvetica', 'normal')
        const stemLines = doc.splitTextToSize(q.question, maxW)
        checkPage(stemLines.length * 5)
        doc.text(stemLines, margin, y)
        y += stemLines.length * 5 + 3

        // Answer lines (one per mark)
        for (let l = 0; l < q.marks; l++) {
          checkPage(10)
          doc.setDrawColor(180)
          doc.line(margin, y + 6, pageW - margin, y + 6)
          y += 10
        }
        y += 4
      })

      // SAQ answer key
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

      questions.forEach((q: any, i: number) => {
        checkPage(30)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0)
        doc.text(`Q${i + 1}.`, margin, y)
        y += 5

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(60, 60, 60)
        const answers: string[] = Array.isArray(q.acceptable_answers)
          ? q.acceptable_answers
          : [q.acceptable_answers]
        const answerLines = doc.splitTextToSize(answers.join(' / '), maxW - 8)
        doc.text(answerLines, margin + 4, y)
        y += answerLines.length * 5 + 6

        doc.setDrawColor(200)
        doc.line(margin, y, pageW - margin, y)
        y += 6
      })

    } else {
      // --- MCQ format ---
      questions.forEach((q: any, i: number) => {
        checkPage(40)

        // Topic tag
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(`${q.topic} › ${q.subtopic}`, margin, y)
        y += 5

        // Question stem
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

        y += 6
      })

      // MCQ answer key
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

      questions.forEach((q: any, i: number) => {
        checkPage(30)

        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0)
        doc.text(`Q${i + 1}.  ${q.correct_answer}`, margin, y)
        y += 5

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(60, 60, 60)
        const answerText = q.options[q.correct_answer as string] ?? ''
        const answerLines = doc.splitTextToSize(answerText, maxW - 12)
        doc.text(answerLines, margin + 8, y)
        y += answerLines.length * 5 + 3

        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        const feedbackLines = doc.splitTextToSize(q.feedback, maxW - 8)
        checkPage(feedbackLines.length * 4 + 4)
        doc.text(feedbackLines, margin + 4, y)
        y += feedbackLines.length * 4 + 6

        doc.setDrawColor(200)
        doc.line(margin, y, pageW - margin, y)
        y += 6
      })
    }

    // Page numbers (applies to both modes)
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