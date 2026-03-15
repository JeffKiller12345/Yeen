import {
  Document, Page, Text, View,
  StyleSheet, pdf, Font
} from '@react-pdf/renderer'
import type { Question } from '@/types'

const styles = StyleSheet.create({
  page: {
    paddingTop: 54,
    paddingBottom: 54,
    paddingHorizontal: 54,
    fontFamily: 'Times-Roman',
    fontSize: 11,
  },
  header: {
    marginBottom: 28,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Times-Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    textAlign: 'center',
    color: '#555',
  },
  instructions: {
    fontSize: 9,
    color: '#444',
    marginTop: 10,
    lineHeight: 1.5,
    borderTopWidth: 0.5,
    borderTopColor: '#ccc',
    borderTopStyle: 'solid',
    paddingTop: 8,
  },
  questionBlock: {
    marginBottom: 22,
  },
  topicTag: {
    fontSize: 8,
    color: '#999',
    marginBottom: 3,
  },
  stem: {
    fontSize: 11,
    lineHeight: 1.6,
    marginBottom: 8,
    fontFamily: 'Times-Roman',
  },
  questionLabel: {
    fontSize: 10,
    fontFamily: 'Times-Bold',
    marginBottom: 4,
  },
  option: {
    fontSize: 10.5,
    marginLeft: 18,
    marginBottom: 4,
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 54,
    right: 54,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
    color: '#aaa',
    borderTopWidth: 0.5,
    borderTopColor: '#ccc',
    borderTopStyle: 'solid',
    paddingTop: 6,
  },
})

const PageNumber = () => (
  <Text
    render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
      `Page ${pageNumber} of ${totalPages}`
    }
  />
)

// Named export used by the API route
export const ExamPDFDocument = ({
  questions,
  title = 'Medical Sciences — Practice Paper',
}: {
  questions: Question[]
  title?: string
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header} fixed>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {questions.length} Questions ·{' '}
          {Math.ceil(questions.length * 1.2)} Minutes Allowed
        </Text>
        <Text style={styles.instructions}>
          Instructions: For each question, select ONE best answer from the
          options provided (A–E). All questions carry equal marks. There is no
          negative marking.
        </Text>
      </View>

      {/* Questions */}
      {questions.map((q, i) => (
        <View key={q.id} style={styles.questionBlock} wrap={false}>
          <Text style={styles.topicTag}>
            {q.topic}  ›  {q.subtopic}
          </Text>
          <Text style={styles.questionLabel}>Question {i + 1}</Text>
          <Text style={styles.stem}>{q.question}</Text>
          {(Object.entries(q.options) as [string, string][]).map(
            ([letter, text]) => (
              <Text key={letter} style={styles.option}>
                {letter}.{'  '}{text}
              </Text>
            )
          )}
        </View>
      ))}

      {/* Page footer */}
      <View style={styles.footer} fixed>
        <Text>Yeen Practice Paper</Text>
        <PageNumber/>
      </View>
    </Page>
  </Document>
)

// Client-side download helper
export async function downloadExamPDF(
  questions: Question[],
  title?: string,
  filename = 'yeen-paper.pdf'
) {
  const blob = await pdf(
    <ExamPDFDocument questions={questions} title={title} />
  ).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}