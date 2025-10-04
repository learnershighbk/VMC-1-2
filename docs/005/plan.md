# UC-005: Assignment Grading & Feedback - Implementation Plan

## 개요
- **SubmissionGradingService** (`src/features/submissions/backend/service.ts`): 강사용 제출물 조회 및 상태 변경(채점·재제출) 로직 추가.
- **SubmissionSchemas** (`src/features/submissions/backend/schema.ts`): 제출물 리스트/채점 요청 Zod 스키마 정의 및 확장.
- **SubmissionRoutes** (`src/features/submissions/backend/route.ts`): `GET /submissions/assignment/:assignmentId`, `PATCH /submissions/:submissionId` 라우트 추가.
- **SubmissionDTO** (`src/features/submissions/lib/dto.ts`): 신규 스키마/타입 재노출.
- **useAssignmentSubmissions** (`src/features/submissions/hooks/useAssignmentSubmissions.ts`): 강사용 제출물 목록 조회 훅.
- **useReviewSubmission** (`src/features/submissions/hooks/useReviewSubmission.ts`): 채점/재제출 요청 Mutation 훅.
- **AssignmentSubmissionList** (`src/features/submissions/components/assignment-submission-list.tsx`): 제출물 목록 표시 및 액션 트리거 UI.
- **SubmissionReviewDialog** (`src/features/submissions/components/submission-review-dialog.tsx`): 점수·피드백 입력 다이얼로그.
- **InstructorAssignmentSubmissionsPage** (`src/app/(protected)/instructor/courses/[id]/assignments/[assignmentId]/submissions/page.tsx`): 강사용 제출물 관리 페이지.
- **AssignmentEditLinksUpdate** (`src/app/(protected)/instructor/courses/[id]/assignments/[assignmentId]/edit/page.tsx`): 제출물 관리 페이지로 이동하는 CTA 추가.

## Diagram

```mermaid
graph TB
    subgraph Frontend Hooks & State
        H1[useAssignmentSubmissions] -->|fetch| AC[apiClient]
        H2[useReviewSubmission] -->|mutate| AC
    end

    subgraph Frontend UI
        P[InstructorAssignmentSubmissionsPage]
        L[AssignmentSubmissionList]
        D[SubmissionReviewDialog]
        P --> H1
        P --> L
        L --> D
        D --> H2
        L --> SD[SuccessDialog]
        L --> ED[ErrorDialog]
    end

    subgraph Backend Layer (Submissions Feature)
        AC --> R[SubmissionRoutes]
        R --> SVC[SubmissionGradingService]
        R --> SCH[SubmissionSchemas]
    end

    subgraph Database
        SVC --> DB1[(assignment_submissions)]
        SVC --> DB2[(assignments)]
        SVC --> DB3[(courses)]
        SVC --> DB4[(profiles)]
    end

    subgraph Instructor Entry
        E[Assignment Edit Page CTA]
        E --> P
    end

    classDef frontend fill:#e1f5ff,stroke:#7fb3ff
    classDef backend fill:#ffeaea,stroke:#ff8a8a
    classDef db fill:#f3f3f3,stroke:#bbb
    class E fill:#fff4e5,stroke:#f5a623
    class P,L,D,H1,H2,SD,ED frontend
    class R,SVC,SCH backend
    class DB1,DB2,DB3,DB4 db
```

## Implementation Plan

### 1. Backend: SubmissionGradingService (`src/features/submissions/backend/service.ts`)
- **신규 함수**
  1. `listAssignmentSubmissionsForInstructor(supabase, instructorId, assignmentId)`
     - `assignments` + `courses` 조인으로 강사 소유권 검증.
     - `assignment_submissions`에서 `is_latest = true` 제출물만 조회.
     - 학습자 이름(`profiles.full_name`), 제출 버전, 상태, 점수, 피드백, 제출·채점 시각 포함.
     - 권한 실패 → `failure(403, submissionErrorCodes.unauthorized, '본인 과제만 조회 가능합니다.')`.
  2. `reviewSubmission(supabase, instructorId, submissionId, input)`
     - 입력: `action` (`grade` | `requestResubmission`), `score?`, `feedback`.
     - 제출물이 최신 버전인지, 강사 소유 과제인지 확인.
     - `grade` 액션: 점수 0~100 정수, 피드백 필수 → 상태 `graded`, `graded_at`/`graded_by` 업데이트.
     - `requestResubmission`: 이미 `resubmission_required`면 중복 요청 방지, `score` null, `graded_at` null, 상태 전환.
     - 상태 충돌 시 `failure(409, submissionErrorCodes.stateConflict, ...)` 반환.
- **에러 코드 확장** (`submissionErrorCodes`)
  - `unauthorized`, `stateConflict`, `scoreOutOfRange`, `feedbackRequired` 추가.
- **단위 테스트** (`src/features/submissions/backend/__tests__/service.test.ts`)
  - 권한 실패, 점수 범위 위반, 피드백 미입력, 상태 충돌, 성공 케이스(채점/재제출 요청) 각각 검증.

### 2. Backend: SubmissionSchemas (`src/features/submissions/backend/schema.ts`)
- `AssignmentSubmissionItemSchema` (제출물 리스트 항목) 정의: id, learnerId, learnerName, status, score, feedback, submittedAt, gradedAt, version, late 등.
- `AssignmentSubmissionListResponseSchema` : `assignment` 메타(제목, 상태) + `submissions: AssignmentSubmissionItem[]`.
- `ReviewSubmissionSchema`: 액션별 필드 조건 (grade ⇒ score required + int + 0~100, feedback required; requestResubmission ⇒ score disallowed, feedback required).
- 타입 export (`AssignmentSubmissionItem`, `AssignmentSubmissionListResponse`, `ReviewSubmissionInput`).
- **단위 테스트**: score 음수/101, feedback 공백, action별 필드 누락 검증.

### 3. Backend: SubmissionRoutes (`src/features/submissions/backend/route.ts`)
- 경로 추가
  - `GET /submissions/assignment/:assignmentId` → `listAssignmentSubmissionsForInstructor` 호출.
  - `PATCH /submissions/:submissionId` → `ReviewSubmissionSchema` 파싱 후 `reviewSubmission` 실행.
- 인증(GUARD): `supabase.auth.getUser()`.
- 검증 실패 시 `respond(failure(...))` 사용, 메시지는 유저 친화적으로 유지.
- 상태 코드: 400(검증), 401(미인증), 403(권한), 404(대상 미존재), 409(상태 충돌), 500(기타).

### 4. Backend: SubmissionDTO (`src/features/submissions/lib/dto.ts`)
- 신규 타입/스키마 export 추가: `AssignmentSubmissionItem`, `AssignmentSubmissionListResponse`, `ReviewSubmissionSchema`, `ReviewSubmissionInput`.

### 5. Hooks: useAssignmentSubmissions (`src/features/submissions/hooks/useAssignmentSubmissions.ts`)
- `useQuery` 사용, key: `['assignment-submissions', assignmentId]`.
- API 호출: `apiClient.get<AssignmentSubmissionListResponse>(
      "/submissions/assignment/${assignmentId}"
    )`.
- 응답 데이터에서 제출물 제출일 내림차순 정렬.
- 에러는 throw하여 상위 컴포넌트에서 Dialog 처리.

### 6. Hooks: useReviewSubmission (`src/features/submissions/hooks/useReviewSubmission.ts`)
- `useMutation` + `apiClient.patch<AssignmentSubmissionItem>(
      "/submissions/${submissionId}", input
    )`.
- 성공 시 `invalidateQueries` for `assignment-submissions` & `assignment` 디테일.
- `onError`에서 `extractApiErrorMessage` 활용.

### 7. Components: AssignmentSubmissionList (`src/features/submissions/components/assignment-submission-list.tsx`)
- Props: `assignment`, `submissions`, `onOpenReview(submission)`.
- 각 항목 카드/row 구조: 학습자 이름, 제출 시간, 상태 배지(`ts-pattern`), 점수/피드백 요약.
- `Button` 두 개: `채점하기`/`재제출 요청` (상태에 따라 레이블/비활성화 다르게 처리).
- 비어있는 경우 안내 블록 + `picsum.photos` 이미지를 활용한 placeholder 카드.
- 목록 상단에 과제 정보 요약(상태, 마감일) 표시.

### 8. Components: SubmissionReviewDialog (`src/features/submissions/components/submission-review-dialog.tsx`)
- `Dialog` + `Form` 조합.
- 액션 전환 UI: `Tabs` 또는 `ToggleGroup`으로 `grade` vs `requestResubmission`.
- `grade` 선택 시 점수 입력(`Input type="number"`), `requestResubmission`일 때는 비활성화.
- `Textarea`로 피드백 입력, 최소 길이 검증 메시지 출력.
- `useReviewSubmission` mutation 사용, 성공 시 `onSuccess` 호출.

### 9. Page: InstructorAssignmentSubmissionsPage (`src/app/(protected)/instructor/courses/[id]/assignments/[assignmentId]/submissions/page.tsx`)
- `use` 훅으로 params resolve (promise pattern 준수).
- `useAssignmentSubmissions` 호출, 로딩 시 스켈레톤, 에러 시 `ErrorDialog`.
- 성공 시 `AssignmentSubmissionList` 렌더링, dialog 상태(`selectedSubmission`, `isDialogOpen`) 관리.
- 채점/재제출 완료 후 `SuccessDialog`로 피드백, `ErrorDialog`로 실패 처리.

### 10. Assignment Edit Page CTA 업데이트 (`src/app/(protected)/instructor/courses/[id]/assignments/[assignmentId]/edit/page.tsx`)
- 상단 또는 요약 카드에 `제출물 관리` 버튼 추가 → `/instructor/courses/${courseId}/assignments/${assignmentId}/submissions`로 이동.
- 버튼은 `lucide-react` 아이콘(`Users` 등) 사용.

### 11. QA & 테스트 계획
- **Backend Unit Tests**
  - `listAssignmentSubmissionsForInstructor` 권한/정상 케이스.
  - `reviewSubmission` 점수 범위, 피드백 미입력, 상태 충돌, 정상 채점/재제출.
- **Schema Tests**
  - `ReviewSubmissionSchema`의 refinement 및 transform 검증.
- **Frontend QA 시나리오**
  - 정상 채점 플로우: 리스트 → 채점 → SuccessDialog → 목록 갱신.
  - 재제출 요청 플로우.
  - 점수 미입력/범위 초과 시 폼 에러.
  - 피드백 공백 시 폼 에러.
  - 네트워크 오류 시 ErrorDialog.
- **Integration**
  - 페이지 진입 시 제출물 목록 정렬/필터 확인.
  - Learner 화면(AssignmentDetailPage)에서 상태 반영 여부 확인(React Query invalidation 포함).


