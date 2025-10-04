'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { CourseResponse } from '../lib/dto';

interface CourseCardProps {
  course: CourseResponse;
  onClick?: () => void;
  onPublish?: (courseId: string) => void;
  isPublishing?: boolean;
  showActions?: boolean;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'draft':
      return <Badge variant="secondary">작성 중</Badge>;
    case 'published':
      return <Badge variant="default" className="bg-green-600">게시됨</Badge>;
    case 'archived':
      return <Badge variant="outline">보관됨</Badge>;
    default:
      return null;
  }
};

export const CourseCard = ({ 
  course, 
  onClick, 
  onPublish, 
  isPublishing = false, 
  showActions = false 
}: CourseCardProps) => {
  const handlePublish = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPublish?.(course.id);
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl font-bold">{course.title}</CardTitle>
          <div className="flex gap-2 flex-shrink-0">
            {getStatusBadge(course.status)}
            <Badge variant="secondary">{course.category}</Badge>
            <Badge variant="outline">{course.difficulty}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {course.description}
        </p>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="font-medium">{course.instructorName}</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{course.enrollmentCount}명</span>
            </div>
            <span>
              {format(new Date(course.createdAt), 'yyyy.MM.dd', {
                locale: ko,
              })}
            </span>
          </div>
        </div>
        {showActions && course.status === 'draft' && onPublish && (
          <div className="pt-2 border-t">
            <Button
              size="sm"
              className="w-full"
              onClick={handlePublish}
              disabled={isPublishing}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isPublishing ? '게시 중...' : '코스 게시'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


