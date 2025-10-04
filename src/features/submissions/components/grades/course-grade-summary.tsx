'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GradeCard } from './grade-card';
import type { CourseGradeSummary } from '@/features/submissions/lib/dto';
import { BookOpen, User } from 'lucide-react';

interface CourseGradeSummaryProps {
  course: CourseGradeSummary;
}

export function CourseGradeSummaryCard({ course }: CourseGradeSummaryProps) {
  const completionRate = course.totalAssignments > 0
    ? (course.gradedAssignments / course.totalAssignments) * 100
    : 0;

  const displayScore = course.totalScore !== null 
    ? course.totalScore.toFixed(1) 
    : 'N/A';

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <BookOpen className="h-6 w-6" />
                {course.courseTitle}
              </CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <User className="h-3 w-3" />
                강사: {course.instructorName}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                {displayScore}
                <span className="text-base text-muted-foreground ml-1">/ 100</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                총점
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">채점 진행률</span>
              <span className="font-medium">
                {course.gradedAssignments} / {course.totalAssignments} 과제
              </span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center">
              <p className="text-2xl font-bold">{course.totalAssignments}</p>
              <p className="text-xs text-muted-foreground">전체 과제</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{course.gradedAssignments}</p>
              <p className="text-xs text-muted-foreground">채점 완료</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {course.totalAssignments - course.gradedAssignments}
              </p>
              <p className="text-xs text-muted-foreground">미채점</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {course.assignments.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">과제별 성적</h3>
          <div className="grid gap-4">
            {course.assignments.map((grade) => (
              <GradeCard key={grade.assignmentId} grade={grade} />
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            아직 과제가 없습니다.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

