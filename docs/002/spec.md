# 코스 탐색 & 수강신청 (Learner) - Use Case Specification

## Primary Actor
Learner (학습자)

## Precondition
- 사용자가 Learner 역할로 로그인되어 있음
- 코스 카탈로그 페이지에 접근 가능

## Trigger
사용자가 코스 목록 페이지에 진입하거나 검색/필터를 통해 코스를 탐색함

## Main Scenario

### 1. 코스 목록 조회
1. 사용자가 코스 카탈로그 페이지에 접근
2. 시스템은 `published` 상태의 코스 목록을 표시
3. 사용자는 검색어 입력, 필터(카테고리, 난이도), 정렬(최신순/인기순) 적용 가능
4. 시스템은 조건에 맞는 코스 목록을 필터링하여 표시

### 2. 코스 상세 조회
1. 사용자가 특정 코스를 클릭하여 상세 페이지 진입
2. 시스템은 코스 정보(제목, 설명, Instructor 정보, 난이도, 카테고리 등) 표시
3. 시스템은 사용자의 수강신청 여부를 확인하여 UI 상태 결정
   - 미신청: "수강신청" 버튼 활성화
   - 이미 신청: "수강 중" 표시 및 버튼 비활성화

### 3. 수강신청
1. 사용자가 "수강신청" 버튼 클릭
2. 시스템은 수강신청 가능 여부 검증:
   - 코스 상태가 `published`인지 확인
   - 사용자가 이미 신청했는지 확인 (중복 신청 차단)
3. 검증 통과 시, `enrollments` 테이블에 신청 레코드 생성
4. 시스템은 성공 메시지를 표시하고 UI 업데이트
5. 사용자는 Learner 대시보드에서 신청한 코스 확인 가능

## Edge Cases

### EC1: 중복 신청 시도
- **상황**: 사용자가 이미 신청한 코스에 다시 수강신청 시도
- **처리**: 에러 메시지 표시 ("이미 수강 중인 코스입니다")

### EC2: 비공개 코스 신청 시도
- **상황**: 코스 상태가 `draft` 또는 `archived`인 경우
- **처리**: 에러 메시지 표시 ("현재 수강신청이 불가능한 코스입니다")

### EC3: 로그인하지 않은 사용자
- **상황**: 비로그인 상태에서 수강신청 시도
- **처리**: 로그인 페이지로 리다이렉트

### EC4: Instructor 역할 사용자
- **상황**: Instructor 역할로 로그인한 사용자가 수강신청 시도
- **처리**: 에러 메시지 표시 ("Instructor는 수강신청을 할 수 없습니다")

### EC5: 네트워크 오류
- **상황**: 수강신청 요청 중 네트워크 오류 발생
- **처리**: 에러 메시지 표시 ("네트워크 오류가 발생했습니다. 다시 시도해주세요")

## Business Rules

### BR1: 코스 공개 정책
- `published` 상태의 코스만 코스 목록 및 상세 페이지에 노출
- `draft`, `archived` 상태의 코스는 Instructor에게만 표시

### BR2: 수강신청 제한
- 한 사용자는 동일 코스에 1회만 신청 가능 (중복 신청 불가)
- Learner 역할만 수강신청 가능

### BR3: 데이터 무결성
- 수강신청 시 `enrollments` 테이블에 다음 정보 저장:
  - `user_id`: 신청자 ID
  - `course_id`: 코스 ID
  - `enrolled_at`: 신청 시각 (자동 생성)
  - `status`: 기본값 `active`

### BR4: 필터 및 검색
- 검색은 코스 제목, 설명에 대해 수행
- 카테고리, 난이도 필터는 AND 조건으로 적용
- 정렬: 최신순(created_at DESC), 인기순(enrollments count DESC)

---

## Sequence Diagram

\`\`\`plantuml
@startuml
actor User
participant FE
participant BE
database Database

== 코스 목록 조회 ==
User -> FE: 코스 카탈로그 페이지 접근
FE -> BE: GET /api/courses?status=published
BE -> Database: SELECT courses WHERE status='published'
Database --> BE: 코스 목록 반환
BE --> FE: 코스 목록 응답
FE --> User: 코스 목록 표시

== 검색/필터 적용 ==
User -> FE: 검색어 입력 및 필터 선택
FE -> BE: GET /api/courses?search=...&category=...&level=...&sort=...
BE -> Database: SELECT courses WITH filters
Database --> BE: 필터링된 코스 목록 반환
BE --> FE: 필터링된 코스 목록 응답
FE --> User: 필터링된 코스 목록 표시

== 코스 상세 조회 ==
User -> FE: 특정 코스 클릭
FE -> BE: GET /api/courses/:courseId
BE -> Database: SELECT course WHERE id=:courseId
Database --> BE: 코스 정보 반환
BE -> Database: SELECT enrollment WHERE user_id=:userId AND course_id=:courseId
Database --> BE: 수강신청 여부 반환
BE --> FE: 코스 상세 정보 + 수강신청 상태 응답
FE --> User: 코스 상세 정보 표시

== 수강신청 ==
User -> FE: "수강신청" 버튼 클릭
FE -> BE: POST /api/enrollments {courseId}
BE -> Database: SELECT course WHERE id=:courseId AND status='published'
Database --> BE: 코스 정보 반환

alt 코스 상태가 published가 아님
  BE --> FE: 400 Error (수강신청 불가)
  FE --> User: 에러 메시지 표시
else 코스 상태가 published
  BE -> Database: SELECT enrollment WHERE user_id=:userId AND course_id=:courseId
  Database --> BE: 수강신청 이력 반환
  
  alt 이미 신청한 코스
    BE --> FE: 400 Error (중복 신청)
    FE --> User: 에러 메시지 표시
  else 신청 가능
    BE -> Database: INSERT INTO enrollments (user_id, course_id, status)
    Database --> BE: 신청 레코드 생성 완료
    BE --> FE: 200 Success (수강신청 완료)
    FE --> User: 성공 메시지 표시 및 UI 업데이트
    FE -> BE: GET /api/enrollments (대시보드 갱신용)
    BE -> Database: SELECT enrollments WHERE user_id=:userId
    Database --> BE: 사용자의 수강 목록 반환
    BE --> FE: 수강 목록 응답
    FE --> User: Learner 대시보드 업데이트
  end
end

@enduml
\`\`\`

