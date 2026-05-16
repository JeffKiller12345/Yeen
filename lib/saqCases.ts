export function getSAQCaseId(id: string): string {
  return id.replace(/_q\d+$/i, '')
}
