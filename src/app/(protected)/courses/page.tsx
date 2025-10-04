'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCourses } from '@/features/courses/hooks/useCourses';
import { CourseCard } from '@/features/courses/components/course-card';
import { CourseFilter } from '@/features/courses/components/course-filter';
import type { CourseListQuery } from '@/features/courses/lib/dto';
import { Loader2 } from 'lucide-react';
import { ErrorDialog } from '@/components/ui/error-dialog';

export default function CoursesPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<CourseListQuery>({
    status: 'published',
    sort: 'latest',
  });

  const { data: courses, isLoading, error } = useCourses(filters);

  const handleCourseClick = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">코스 탐색</h1>
        <p className="text-muted-foreground">
          원하는 코스를 찾아 수강신청하세요
        </p>
      </div>

      <div className="mb-8">
        <CourseFilter filters={filters} onFilterChange={setFilters} />
      </div>

      {courses && courses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            조건에 맞는 코스가 없습니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses?.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={() => handleCourseClick(course.id)}
            />
          ))}
        </div>
      )}

      <ErrorDialog
        open={!!error}
        onClose={() => {}}
        title="오류 발생"
        message={
          error instanceof Error ? error.message : '코스를 불러오는 중 오류가 발생했습니다.'
        }
      />
    </div>
  );
}
