# UC-006: Assignment 게시/마감 Implementation Plan

## 개요

### 목적
Instructor가 과제의 게시(draft → published), 수동 마감(published → closed), 자동 마감 기능을 안전하게 수행할 수 있도록 비즈니스 규칙을 강화하고 UI를 개선합니다.

### 범위
- **Backend**: 게시/마감 시 검증 로직 강화, 자동 마감 API 추가
- **Frontend**: 과제 관리 페이지 버튼 UI 개선, Dialog 기반 피드백 추가
- **Business Rules**: 유스케이스 문서의 모든 Edge Case 및 Business Rule 구현

### 기존 구현 상태
- ✅ `POST /api/assignments/:id/publish` 라우터 (route.ts)
- ✅ `POST /api/assignments/:id/close` 라우터 (route.ts)
- ✅ `publishAssignment`, `closeAssignment` 서비스 (service.ts)
- ✅ `usePublishAssignment`, `useCloseAssignment` 훅 (hooks/)
- ⚠️ 검증 로직 미흡: 마감일 검증, 필수 항목 검증, 제출물 존재 여부 검증 등 누락

---

## Module Overview

### Backend Modules

| 모듈 | 위치 | 설명 | 상태 |
|------|------|------|------|
| `publishAssignment` (service) | `src/features/assignments/backend/service.ts` | 마감일 검증 추가 | **수정 필요** |
| `closeAssignment` (service) | `src/features/assignments/backend/service.ts` | 상태 검증 강화 | **수정 필요** |
| `updateAssignment` (service) | `src/features/assignments/backend/service.ts` | 상태별 수정 제한 추가 | **수정 필요** |
| `deleteAssignment` (service) | `src/features/assignments/backend/service.ts` | 제출물 존재 여부 검증 추가 | **수정 필요** |
| `autoCloseExpiredAssignments` (service) | `src/features/assignments/backend/service.ts` | 자동 마감 처리 로직 | **신규 생성** |
| Auto-close route | `src/features/assignments/backend/route.ts` | `POST /assignments/auto-close` 엔드포인트 | **신규 생성** |
| Error codes | `src/features/assignments/backend/error.ts` | 추가 에러 코드 정의 | **수정 필요** |

### Frontend Modules

| 모듈 | 위치 | 설명 | 상태 |
|------|------|------|------|
| `AssignmentActionsBar` | `src/features/assignments/components/assignment-actions-bar.tsx` | 게시/마감/삭제 버튼 통합 컴포넌트 | **신규 생성** |
| Instructor Assignment List Page | `src/app/(protected)/instructor/courses/[id]/assignments/page.tsx` | 강사용 과제 관리 페이지 | **신규 생성** |
| `usePublishAssignment` (hook) | `src/features/assignments/hooks/usePublishAssignment.ts` | Dialog 피드백 추가 | **개선** |
| `useCloseAssignment` (hook) | `src/features/assignments/hooks/useCloseAssignment.ts` | Dialog 피드백 추가 | **개선** |
| `useDeleteAssignment` (hook) | `src/features/assignments/hooks/useDeleteAssignment.ts` | Dialog 피드백 추가 | **개선** |

### Shared/Utility Modules

| 모듈 | 위치 | 설명 | 상태 |
|------|------|------|------|
| `ConfirmDialog` | `src/components/ui/confirm-dialog.tsx` | 확인 다이얼로그 (재사용) | ✅ 기존 사용 |
| `ErrorDialog` | `src/components/ui/error-dialog.tsx` | 에러 다이얼로그 (재사용) | ✅ 기존 사용 |
| `SuccessDialog` | `src/components/ui/success-dialog.tsx` | 성공 다이얼로그 (재사용) | ✅ 기존 사용 |

---

## Architecture Diagram

```mermaid
graph TB
    subgraph "Presentation Layer"
        A[Instructor Assignment List Page]
        B[AssignmentActionsBar Component]
        C[ConfirmDialog]
        D[SuccessDialog]
        E[ErrorDialog]
    end

    subgraph "Client State Management"
        F[usePublishAssignment]
        G[useCloseAssignment]
        H[useDeleteAssignment]
        I[@tanstack/react-query]
    end

    subgraph "API Client"
        J[apiClient - Axios Instance]
    end

    subgraph "Backend Routes - Hono"
        K[POST /assignments/:id/publish]
        L[POST /assignments/:id/close]
        M[DELETE /assignments/:id]
        N[POST /assignments/auto-close]
    end

    subgraph "Business Logic - Service Layer"
        O[publishAssignment]
        P[closeAssignment]
        Q[deleteAssignment]
        R[updateAssignment]
        S[autoCloseExpiredAssignments]
    end

    subgraph "Data Access - Supabase"
        T[(assignments table)]
        U[(assignment_submissions table)]
    end

    A --> B
    B --> C
    B --> D
    B --> E
    B --> F
    B --> G
    B --> H
    F --> I
    G --> I
    H --> I
    I --> J
    J --> K
    J --> L
    J --> M
    J --> N
    K --> O
    L --> P
    M --> Q
    N --> S
    O --> T
    O --> U
    P --> T
    Q --> T
    Q --> U
    R --> T
    S --> T

    style A fill:#e1f5ff
    style B fill:#e1f5ff
    style O fill:#fff4e1
    style P fill:#fff4e1
    style Q fill:#fff4e1
    style R fill:#fff4e1
    style S fill:#ffe1e1
```

---

## Implementation Plan

### 1. Backend Service Layer 강화

#### 1.1. publishAssignment 마감일 검증 추가

**File:** `src/features/assignments/backend/service.ts`

**Changes:**
```typescript
export const publishAssignment = async (
  supabase: SupabaseClient<Database>,
  assignmentId: string,
  instructorId: string
): Promise<ServiceResult<AssignmentDetail>> => {
  try {
    // ... 기존 권한 검증 로직 ...

    // 🆕 BR-002: 마감일이 현재 시각 이후여야 함
    const dueDate = new Date(assignmentData.due_at);
    const now = new Date();
    if (dueDate <= now) {
      return failure(
        400,
        assignmentErrorCodes.pastDueDate,
        '마감일이 과거입니다. 마감일을 수정한 후 게시해주세요.'
      );
    }

    // 🆕 BR-002: 필수 항목 검증 (제목, 설명, 마감일, 점수 비중)
    if (!assignmentData.title || !assignmentData.description || !assignmentData.due_at || assignmentData.score_weight == null) {
      return failure(
        400,
        assignmentErrorCodes.missingRequiredFields,
        '필수 항목을 모두 입력해주세요.'
      );
    }

    // ... 기존 업데이트 로직 ...
  } catch (err) {
    // ... 에러 처리 ...
  }
};
```

**Unit Test:**
```typescript
describe('publishAssignment', () => {
  it('should reject publishing assignment with past due date', async () => {
    // Given: draft assignment with past due date
    // When: publishAssignment called
    // Then: returns 400 with pastDueDate error code
  });

  it('should reject publishing assignment with missing required fields', async () => {
    // Given: draft assignment with null title
    // When: publishAssignment called
    // Then: returns 400 with missingRequiredFields error code
  });

  it('should successfully publish valid draft assignment', async () => {
    // Given: draft assignment with future due date and all required fields
    // When: publishAssignment called
    // Then: returns 200 with status='published' and published_at set
  });

  it('should reject publishing already published assignment', async () => {
    // Given: assignment with status='published'
    // When: publishAssignment called again
    // Then: returns 400 with validationError error code
  });
});
```

---

#### 1.2. deleteAssignment 제출물 검증 추가

**File:** `src/features/assignments/backend/service.ts`

**Changes:**
```typescript
export const deleteAssignment = async (
  supabase: SupabaseClient<Database>,
  assignmentId: string,
  instructorId: string
): Promise<ServiceResult<void>> => {
  try {
    // ... 기존 권한 검증 로직 ...

    // 🆕 BR-005: 제출물이 있는 과제는 삭제 불가
    const { data: submissions, error: submissionError } = await supabase
      .from('assignment_submissions')
      .select('id')
      .eq('assignment_id', assignmentId)
      .limit(1);

    if (submissionError) {
      return failure(500, assignmentErrorCodes.fetchError, submissionError.message);
    }

    if (submissions && submissions.length > 0) {
      return failure(
        400,
        assignmentErrorCodes.hasSubmissions,
        '제출물이 있는 과제는 삭제할 수 없습니다.'
      );
    }

    // 🆕 BR-005: closed 상태이면 삭제 불가
    if (assignmentData.status === 'closed') {
      return failure(
        400,
        assignmentErrorCodes.cannotDeleteClosed,
        '마감된 과제는 삭제할 수 없습니다.'
      );
    }

    // ... 기존 삭제 로직 ...
  } catch (err) {
    // ... 에러 처리 ...
  }
};
```

**Unit Test:**
```typescript
describe('deleteAssignment', () => {
  it('should reject deleting assignment with submissions', async () => {
    // Given: assignment with at least one submission
    // When: deleteAssignment called
    // Then: returns 400 with hasSubmissions error code
  });

  it('should reject deleting closed assignment', async () => {
    // Given: assignment with status='closed'
    // When: deleteAssignment called
    // Then: returns 400 with cannotDeleteClosed error code
  });

  it('should successfully delete draft assignment without submissions', async () => {
    // Given: draft assignment with no submissions
    // When: deleteAssignment called
    // Then: returns 200 and assignment is deleted
  });
});
```

---

#### 1.3. updateAssignment 상태별 수정 제한 추가

**File:** `src/features/assignments/backend/service.ts`

**Changes:**
```typescript
export const updateAssignment = async (
  supabase: SupabaseClient<Database>,
  assignmentId: string,
  instructorId: string,
  input: UpdateAssignmentInput
): Promise<ServiceResult<AssignmentDetail>> => {
  try {
    // ... 기존 권한 검증 로직 ...

    // 🆕 BR-008: 상태별 수정 제한
    if (assignmentData.status === 'closed') {
      return failure(
        400,
        assignmentErrorCodes.cannotEditClosed,
        '마감된 과제는 수정할 수 없습니다.'
      );
    }

    let updatePayload: any = {};

    if (assignmentData.status === 'published') {
      // published 상태: 제목, 설명만 수정 가능
      if (input.title) updatePayload.title = input.title;
      if (input.description) updatePayload.description = input.description;

      // 다른 필드 시도 시 경고
      if (input.dueAt || input.scoreWeight !== undefined || input.allowLate !== undefined || input.allowResubmission !== undefined) {
        return failure(
          400,
          assignmentErrorCodes.publishedFieldRestriction,
          '게시된 과제는 제목과 설명만 수정할 수 있습니다.'
        );
      }
    } else {
      // draft 상태: 모든 필드 수정 가능
      updatePayload = {
        ...(input.title && { title: input.title }),
        ...(input.description && { description: input.description }),
        ...(input.dueAt && { due_at: input.dueAt }),
        ...(input.scoreWeight !== undefined && { score_weight: input.scoreWeight }),
        ...(input.allowLate !== undefined && { allow_late: input.allowLate }),
        ...(input.allowResubmission !== undefined && { allow_resubmission: input.allowResubmission }),
      };
    }

    // ... 기존 업데이트 로직 ...
  } catch (err) {
    // ... 에러 처리 ...
  }
};
```

**Unit Test:**
```typescript
describe('updateAssignment', () => {
  it('should reject editing closed assignment', async () => {
    // Given: assignment with status='closed'
    // When: updateAssignment called
    // Then: returns 400 with cannotEditClosed error code
  });

  it('should reject editing restricted fields on published assignment', async () => {
    // Given: assignment with status='published'
    // When: updateAssignment called with dueAt field
    // Then: returns 400 with publishedFieldRestriction error code
  });

  it('should allow editing title and description on published assignment', async () => {
    // Given: assignment with status='published'
    // When: updateAssignment called with title and description only
    // Then: returns 200 with updated fields
  });

  it('should allow editing all fields on draft assignment', async () => {
    // Given: assignment with status='draft'
    // When: updateAssignment called with all fields
    // Then: returns 200 with all fields updated
  });
});
```

---

#### 1.4. autoCloseExpiredAssignments 자동 마감 처리

**File:** `src/features/assignments/backend/service.ts`

**Changes:**
```typescript
/**
 * 자동 마감: published 상태이면서 마감일이 지난 과제를 closed로 전환
 * BR-007: 주기적으로 실행되며, 조건을 만족하는 과제를 자동 마감 처리
 */
export const autoCloseExpiredAssignments = async (
  supabase: SupabaseClient<Database>
): Promise<ServiceResult<{ closedCount: number }>> => {
  try {
    const now = new Date().toISOString();

    // BR-007: published 상태이면서 due_at < NOW()인 과제 조회
    const { data: expiredAssignments, error: selectError } = await supabase
      .from('assignments')
      .select('id')
      .eq('status', 'published')
      .lt('due_at', now);

    if (selectError) {
      return failure(
        500,
        assignmentErrorCodes.fetchError,
        selectError.message
      );
    }

    if (!expiredAssignments || expiredAssignments.length === 0) {
      return success({ closedCount: 0 });
    }

    const assignmentIds = expiredAssignments.map((a: any) => a.id);

    // BR-007: 해당 과제들을 closed로 일괄 업데이트
    const { error: updateError } = await supabase
      .from('assignments')
      .update({
        status: 'closed',
        closed_at: now,
      })
      .in('id', assignmentIds);

    if (updateError) {
      return failure(
        500,
        assignmentErrorCodes.updateError,
        updateError.message
      );
    }

    return success({ closedCount: assignmentIds.length });
  } catch (err) {
    return failure(
      500,
      assignmentErrorCodes.autoCloseError,
      err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    );
  }
};
```

**Unit Test:**
```typescript
describe('autoCloseExpiredAssignments', () => {
  it('should auto-close published assignments past due date', async () => {
    // Given: 3 published assignments with due_at < now
    // When: autoCloseExpiredAssignments called
    // Then: returns success with closedCount=3, all assignments status='closed'
  });

  it('should not affect draft or closed assignments', async () => {
    // Given: 1 draft, 1 published (past due), 1 closed (past due)
    // When: autoCloseExpiredAssignments called
    // Then: returns success with closedCount=1, only published is closed
  });

  it('should return 0 if no expired assignments', async () => {
    // Given: all published assignments have future due_at
    // When: autoCloseExpiredAssignments called
    // Then: returns success with closedCount=0
  });
});
```

---

#### 1.5. Backend Route 추가

**File:** `src/features/assignments/backend/route.ts`

**Changes:**
```typescript
// 🆕 자동 마감 처리 엔드포인트 (관리자/시스템용)
assignmentsRouter.post('/auto-close', async (c) => {
  const supabase = c.get('supabase');

  // 인증 검증 (선택: 관리자 권한 검증 추가 가능)
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData.user) {
    return c.json(
      { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
      401
    );
  }

  const result = await autoCloseExpiredAssignments(supabase);

  return respond(c, result);
});
```

**참고:** 실제 운영 환경에서는 cron job 또는 Supabase Edge Function으로 주기적 실행 권장.

---

#### 1.6. Error Codes 추가

**File:** `src/features/assignments/backend/error.ts`

**Changes:**
```typescript
export const assignmentErrorCodes = {
  // 기존 코드...
  fetchError: 'ASSIGNMENT_FETCH_ERROR',
  notFound: 'ASSIGNMENT_NOT_FOUND',
  validationError: 'ASSIGNMENT_VALIDATION_ERROR',
  unauthorizedAccess: 'ASSIGNMENT_UNAUTHORIZED_ACCESS',
  notEnrolled: 'ASSIGNMENT_NOT_ENROLLED',
  notPublished: 'ASSIGNMENT_NOT_PUBLISHED',
  createError: 'ASSIGNMENT_CREATE_ERROR',
  updateError: 'ASSIGNMENT_UPDATE_ERROR',
  deleteError: 'ASSIGNMENT_DELETE_ERROR',
  courseNotFound: 'ASSIGNMENT_COURSE_NOT_FOUND',

  // 🆕 UC-006 추가 에러 코드
  pastDueDate: 'ASSIGNMENT_PAST_DUE_DATE',
  missingRequiredFields: 'ASSIGNMENT_MISSING_REQUIRED_FIELDS',
  hasSubmissions: 'ASSIGNMENT_HAS_SUBMISSIONS',
  cannotDeleteClosed: 'ASSIGNMENT_CANNOT_DELETE_CLOSED',
  cannotEditClosed: 'ASSIGNMENT_CANNOT_EDIT_CLOSED',
  publishedFieldRestriction: 'ASSIGNMENT_PUBLISHED_FIELD_RESTRICTION',
  autoCloseError: 'ASSIGNMENT_AUTO_CLOSE_ERROR',
} as const;
```

---

### 2. Frontend Layer 구현

#### 2.1. AssignmentActionsBar Component

**File:** `src/features/assignments/components/assignment-actions-bar.tsx`

**Description:** 과제 상태에 따라 게시/마감/삭제 버튼을 표시하는 통합 액션 바.

**Props:**
```typescript
interface AssignmentActionsBarProps {
  assignment: AssignmentDetailResponse;
  onPublish: () => void;
  onClose: () => void;
  onDelete: () => void;
  isPublishing?: boolean;
  isClosing?: boolean;
  isDeleting?: boolean;
}
```

**UI Logic:**
- `draft`: "게시하기" 버튼 표시
- `published`: "마감하기" 버튼 표시
- `closed`: 버튼 비활성화 또는 "마감됨" 배지만 표시
- 삭제 버튼: draft 상태에서만 활성화

**QA Sheet:**
```markdown
| Test Case | Input | Expected Output | Pass/Fail |
|-----------|-------|----------------|-----------|
| TC-001: draft 상태 버튼 표시 | assignment.status = 'draft' | "게시하기" 버튼 표시, "삭제" 버튼 활성화 | |
| TC-002: published 상태 버튼 표시 | assignment.status = 'published' | "마감하기" 버튼 표시, "삭제" 버튼 비활성화 | |
| TC-003: closed 상태 버튼 표시 | assignment.status = 'closed' | 모든 버튼 비활성화 또는 숨김 | |
| TC-004: 게시 버튼 클릭 | "게시하기" 클릭 | ConfirmDialog 표시 | |
| TC-005: 마감 버튼 클릭 | "마감하기" 클릭 | ConfirmDialog 표시 | |
| TC-006: 삭제 버튼 클릭 | "삭제" 클릭 | ConfirmDialog 표시 (destructive) | |
| TC-007: 로딩 중 버튼 비활성화 | isPublishing=true | 모든 버튼 비활성화 | |
```

---

#### 2.2. Instructor Assignment List Page

**File:** `src/app/(protected)/instructor/courses/[id]/assignments/page.tsx`

**Description:** 강사가 본인 코스의 과제 목록을 관리하는 페이지. 각 과제에 AssignmentActionsBar를 표시.

**Features:**
- 과제 목록 조회 (`useCourseAssignments`)
- 각 과제별 게시/마감/삭제 액션
- ConfirmDialog, SuccessDialog, ErrorDialog 연동

**QA Sheet:**
```markdown
| Test Case | Input | Expected Output | Pass/Fail |
|-----------|-------|----------------|-----------|
| TC-008: 과제 목록 로드 | 코스 ID | 해당 코스의 모든 과제 표시 (draft 포함) | |
| TC-009: 권한 없는 사용자 접근 | 다른 instructor의 코스 | 403 에러 또는 리다이렉트 | |
| TC-010: 게시 성공 | draft 과제 게시 | SuccessDialog "과제가 게시되었습니다" 표시 | |
| TC-011: 게시 실패 (마감일 과거) | 마감일이 과거인 과제 게시 | ErrorDialog "마감일이 과거입니다" 표시 | |
| TC-012: 마감 성공 | published 과제 마감 | SuccessDialog "과제가 마감되었습니다" 표시 | |
| TC-013: 삭제 성공 | draft 과제 삭제 | SuccessDialog "과제가 삭제되었습니다" 표시 | |
| TC-014: 삭제 실패 (제출물 존재) | 제출물이 있는 과제 삭제 | ErrorDialog "제출물이 있는 과제는 삭제할 수 없습니다" 표시 | |
| TC-015: 네트워크 오류 | API 요청 실패 | ErrorDialog "네트워크 오류가 발생했습니다" 표시 | |
```

---

#### 2.3. Hooks 개선 (Dialog 피드백 추가)

**Files:**
- `src/features/assignments/hooks/usePublishAssignment.ts`
- `src/features/assignments/hooks/useCloseAssignment.ts`
- `src/features/assignments/hooks/useDeleteAssignment.ts`

**Changes:**
- 각 훅의 `onSuccess`, `onError` 콜백에서 Dialog 상태를 제어할 수 있도록 옵션 추가
- 페이지 레벨에서 Dialog 상태 관리

**Example:**
```typescript
// usePublishAssignment.ts (변경 없음, 페이지에서 Dialog 상태 관리)

// Page에서 사용 예시:
const [successMessage, setSuccessMessage] = useState('');
const [errorMessage, setErrorMessage] = useState('');

const publishMutation = usePublishAssignment(assignmentId);

const handlePublish = () => {
  publishMutation.mutate(undefined, {
    onSuccess: () => {
      setSuccessMessage('과제가 게시되었습니다.');
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.error || '게시에 실패했습니다.');
    },
  });
};
```

**QA Sheet:**
```markdown
| Test Case | Input | Expected Output | Pass/Fail |
|-----------|-------|----------------|-----------|
| TC-016: 게시 성공 피드백 | 게시 성공 | SuccessDialog 표시 | |
| TC-017: 게시 실패 피드백 | 게시 실패 (에러 응답) | ErrorDialog 표시 (에러 메시지 포함) | |
| TC-018: 마감 성공 피드백 | 마감 성공 | SuccessDialog 표시 | |
| TC-019: 마감 실패 피드백 | 마감 실패 (에러 응답) | ErrorDialog 표시 | |
| TC-020: 삭제 성공 피드백 | 삭제 성공 | SuccessDialog 표시 | |
| TC-021: 삭제 실패 피드백 | 삭제 실패 (에러 응답) | ErrorDialog 표시 | |
```

---

### 3. Integration & Testing

#### 3.1. Edge Cases 검증

**EC1: 이미 게시된 과제를 다시 게시**
- Backend: `publishAssignment` 에서 이미 구현됨 (status 검증)
- Frontend: 버튼 비활성화 처리

**EC2: 마감일이 과거인 과제 게시**
- Backend: ✅ Section 1.1에서 구현
- Frontend: ErrorDialog 표시

**EC3: 필수 항목 미입력 상태 게시**
- Backend: ✅ Section 1.1에서 구현
- Frontend: ErrorDialog 표시

**EC4: 제출물이 있는 과제 삭제**
- Backend: ✅ Section 1.2에서 구현
- Frontend: ErrorDialog 표시

**EC5: 다른 Instructor 과제 접근**
- Backend: 기존 권한 검증 로직으로 차단됨
- Frontend: 페이지 접근 시 403 처리

**EC6: 네트워크 오류**
- Frontend: try-catch + ErrorDialog 표시

**EC7: 이미 마감된 과제 재마감**
- Backend: `closeAssignment` 에서 이미 구현됨
- Frontend: 버튼 비활성화 처리

**EC8: 동시 상태 변경 (Race Condition)**
- Backend: Supabase 트랜잭션 기본 제공
- Frontend: optimistic update 비활성화, invalidateQueries로 최신 상태 갱신

---

#### 3.2. Business Rules 구현 체크리스트

- [x] **BR-001**: 상태 전환 규칙 (draft → published → closed, 역방향 불가)
  - Backend: 상태 검증 로직으로 구현
- [x] **BR-002**: 게시 조건 (필수 항목, 마감일 미래)
  - ✅ Section 1.1에서 구현
- [x] **BR-003**: 마감 조건 (published만 수동 마감 가능)
  - Backend: 기존 `closeAssignment`에서 구현됨
- [x] **BR-004**: 권한 검증 (Instructor만, 본인 코스만)
  - Backend: 기존 로직으로 구현됨
- [x] **BR-005**: 삭제 제한 (제출물 있으면 불가, closed 불가)
  - ✅ Section 1.2에서 구현
- [x] **BR-006**: Learner 노출 규칙 (draft 비공개, published/closed 노출)
  - Backend: `listCourseAssignmentsForLearner`에서 이미 구현됨
- [x] **BR-007**: 자동 마감 처리
  - ✅ Section 1.4에서 구현
- [x] **BR-008**: 상태별 수정 제한
  - ✅ Section 1.3에서 구현

---

## Dependencies

### New Dependencies
- 없음 (기존 라이브러리 사용)

### Existing Dependencies
- `@tanstack/react-query`: 클라이언트 상태 관리
- `zod`: 스키마 검증
- `date-fns`: 날짜 처리
- `lucide-react`: 아이콘
- `tailwindcss`: 스타일링

---

## Deployment Checklist

- [ ] Backend 서비스 로직 수정 완료
- [ ] Backend 라우트 추가 완료
- [ ] Frontend 컴포넌트 구현 완료
- [ ] Frontend 페이지 구현 완료
- [ ] Unit Test 작성 및 통과
- [ ] QA Sheet 기반 수동 테스트 통과
- [ ] Edge Case 시나리오 검증
- [ ] 자동 마감 API 테스트 (수동 호출)
- [ ] 프로덕션 배포 전 스테이징 환경 검증
- [ ] (선택) Cron job 또는 Edge Function 설정하여 주기적 자동 마감 처리

---

## Notes

1. **자동 마감 처리 (BR-007):** 
   - 현재 구현은 수동 API 호출 방식 (`POST /assignments/auto-close`)
   - 실제 운영 환경에서는 Supabase Edge Function + pg_cron 또는 외부 Cron job으로 주기적 실행 권장 (5분마다)
   - 프론트엔드에서는 자동 마감 API를 직접 호출하지 않음 (관리자/시스템만 호출)

2. **Dialog 피드백:**
   - 모든 성공/실패 케이스에 Dialog 표시 (inline alert 사용 금지)
   - 사용자 경험 향상을 위해 명확한 메시지 제공

3. **상태 관리:**
   - React Query의 `invalidateQueries`로 낙관적 업데이트 없이 안전하게 최신 상태 갱신
   - 동시성 문제는 Supabase 트랜잭션으로 해결

4. **기존 코드 재사용:**
   - ConfirmDialog, ErrorDialog, SuccessDialog 등 기존 UI 컴포넌트 최대한 재사용
   - 일관된 UX 유지

---

**Implementation Priority:**
1. Backend Service Layer 강화 (Section 1.1 ~ 1.6) - **High**
2. Frontend AssignmentActionsBar 컴포넌트 (Section 2.1) - **High**
3. Instructor Assignment List Page (Section 2.2) - **High**
4. Frontend Hooks 개선 (Section 2.3) - **Medium**
5. Unit Test 작성 - **Medium**
6. 자동 마감 Edge Function 설정 - **Low** (추후 운영 최적화)

