export function calculateCourseTotal(
  grades: Array<{ score: number | null; scoreWeight: number; status: string | null }>
): number | null {
  const gradedItems = grades.filter(
    (g) => g.status === 'graded' && g.score !== null
  );

  if (gradedItems.length === 0) {
    return null;
  }

  return gradedItems.reduce((sum, g) => {
    return sum + ((g.score as number) * g.scoreWeight) / 100;
  }, 0);
}

export function calculateCompletionRate(total: number, graded: number): number {
  if (total === 0) return 0;
  return Math.round((graded / total) * 100);
}

export function getGradeLevel(score: number | null): string {
  if (score === null) return 'N/A';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

