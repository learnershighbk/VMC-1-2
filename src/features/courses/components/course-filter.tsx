'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import type { CourseListQuery } from '../lib/dto';

interface CourseFilterProps {
  filters: CourseListQuery;
  onFilterChange: (filters: CourseListQuery) => void;
}

export const CourseFilter = ({ filters, onFilterChange }: CourseFilterProps) => {
  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filters, search: value || undefined });
  };

  const handleCategoryChange = (value: string) => {
    onFilterChange({
      ...filters,
      category: value === 'all' ? undefined : value,
    });
  };

  const handleDifficultyChange = (value: string) => {
    onFilterChange({
      ...filters,
      difficulty: value === 'all' ? undefined : value,
    });
  };

  const handleSortChange = (value: 'latest' | 'popular') => {
    onFilterChange({ ...filters, sort: value });
  };

  const handleReset = () => {
    onFilterChange({
      status: 'published',
      sort: 'latest',
    });
  };

  const hasActiveFilters =
    filters.search || filters.category || filters.difficulty;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">검색</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="코스 제목이나 설명으로 검색..."
              value={filters.search ?? ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="w-48">
          <label className="text-sm font-medium mb-2 block">카테고리</label>
          <Select
            value={filters.category ?? 'all'}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="프론트엔드">프론트엔드</SelectItem>
              <SelectItem value="백엔드">백엔드</SelectItem>
              <SelectItem value="데이터">데이터</SelectItem>
              <SelectItem value="디자인">디자인</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-48">
          <label className="text-sm font-medium mb-2 block">난이도</label>
          <Select
            value={filters.difficulty ?? 'all'}
            onValueChange={handleDifficultyChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="초급">초급</SelectItem>
              <SelectItem value="중급">중급</SelectItem>
              <SelectItem value="고급">고급</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-48">
          <label className="text-sm font-medium mb-2 block">정렬</label>
          <Select
            value={filters.sort ?? 'latest'}
            onValueChange={handleSortChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">최신순</SelectItem>
              <SelectItem value="popular">인기순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            title="필터 초기화"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

