# Database Dataflow & Schema

## 데이터플로우 요약
1. 역할 선택 & 온보딩
   - Auth 가입 성공 후 Supabase `auth.users`의 식별자를 받아 `profiles`에 역할, 이름, 휴대폰을 저장하고, 동시에 `terms_acceptances`에 약관 동의 이력을 추가한다.
2. 코스 탐색 & 수강신청 (Learner)
   - 신규 학습자는 `courses`에서 상태가 `published`인 코스 목록을 조회하고, 수강 신청 시 `course_enrollments`에 `course_id`와 `learner_id` 조합으로 단일 레코드를 생성한다.
3. 과제 상세 열람 (Learner)
   - 학습자는 `assignments`에서 `published` 상태이면서 본인이 등록한 코스(`course_enrollments`)에 속한 과제 정보를 읽어온다.
4. 과제 제출 (Learner)
   - 과제 제출 시 `assignment_submissions`에 최신 버전 레코드를 추가하고, 마감일 비교를 위해 `assignments.due_at`을 조회하여 `late` 여부와 `status`를 결정한다. 새로운 제출이 저장되면 직전 제출 레코드의 `is_latest` 플래그를 꺼서 버전 히스토리를 유지한다.
5. 과제 채점 & 피드백 (Instructor)
   - 담당 강사는 `assignment_submissions`에서 `status='submitted'`이고 자신의 코스(`courses.instructor_id`)에 속한 제출물을 가져온 뒤, 점수와 피드백을 입력하여 해당 제출 레코드를 `graded` 또는 `resubmission_required`로 갱신한다.
6. Assignment 게시/마감 (Instructor)
   - 강사는 `assignments`의 상태를 `draft → published`로 전환하거나 마감 시 `closed`로 업데이트하고, 마감 처리를 위해 `closed_at`을 기록한다. Learner UI는 이 상태 변화를 통해 제출 가능 여부를 판단한다.
7. 성적 & 피드백 열람 (Learner)
   - 학습자는 자신의 제출 히스토리(`assignment_submissions` where `learner_id`)와 점수를 조회하고, 코스별 총점 계산을 위해 `assignments.score_weight`와 제출 점수를 조합한다.

## 데이터베이스 스키마 상세
### 공통 타입 및 Enum
- `role_type`: `CREATE TYPE role_type AS ENUM ('learner', 'instructor');`
- `course_status`: `CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');`
- `assignment_status`: `CREATE TYPE assignment_status AS ENUM ('draft', 'published', 'closed');`
- `submission_status`: `CREATE TYPE submission_status AS ENUM ('submitted', 'graded', 'resubmission_required');`

### 테이블 정의
#### `profiles`
| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| `id` | uuid | PK, `REFERENCES auth.users(id)` | Supabase Auth 사용자 식별자 |
| `role` | role_type | NOT NULL | 사용자 역할 |
| `full_name` | text | NOT NULL | 이름 |
| `phone_number` | text | NOT NULL | 휴대폰 번호 (형식 검증은 애플리케이션 레벨) |
| `created_at` | timestamptz | DEFAULT `now()` | 생성 시각 |
| `updated_at` | timestamptz | DEFAULT `now()` | 수정 시각 |

#### `terms_acceptances`
| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| `id` | uuid | PK, DEFAULT `gen_random_uuid()` | 식별자 |
| `user_id` | uuid | NOT NULL, `REFERENCES profiles(id)` | 약관 수락한 사용자 |
| `version` | text | NOT NULL | 약관 버전 문자열 |
| `accepted_at` | timestamptz | NOT NULL, DEFAULT `now()` | 수락 시점 |
| `ip_address` | inet | NULL | 선택적 감사 정보 |

#### `courses`
| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| `id` | uuid | PK, DEFAULT `gen_random_uuid()` | 코스 식별자 |
| `instructor_id` | uuid | NOT NULL, `REFERENCES profiles(id)` | 코스를 운영하는 강사 |
| `title` | text | NOT NULL | 코스 제목 |
| `description` | text | NOT NULL | 코스 소개 |
| `category` | text | NOT NULL | 카테고리 필터용 값 |
| `difficulty` | text | NOT NULL | 난이도 필터용 값 |
| `status` | course_status | NOT NULL, DEFAULT `'draft'` | 코스 상태 |
| `published_at` | timestamptz | NULL | `published` 전환 시각 |
| `created_at` | timestamptz | DEFAULT `now()` | 생성 시각 |
| `updated_at` | timestamptz | DEFAULT `now()` | 수정 시각 |

#### `course_enrollments`
| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| `id` | uuid | PK, DEFAULT `gen_random_uuid()` | 수강신청 식별자 |
| `course_id` | uuid | NOT NULL, `REFERENCES courses(id)` | 신청한 코스 |
| `learner_id` | uuid | NOT NULL, `REFERENCES profiles(id)` | 신청한 학습자 |
| `enrolled_at` | timestamptz | NOT NULL, DEFAULT `now()` | 신청 시각 |

**Unique Constraint**: `(course_id, learner_id)` 유일 인덱스로 중복 신청 방지.

#### `assignments`
| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| `id` | uuid | PK, DEFAULT `gen_random_uuid()` | 과제 식별자 |
| `course_id` | uuid | NOT NULL, `REFERENCES courses(id)` | 소속 코스 |
| `title` | text | NOT NULL | 과제 제목 |
| `description` | text | NOT NULL | 과제 설명 |
| `status` | assignment_status | NOT NULL, DEFAULT `'draft'` | 과제 상태 |
| `due_at` | timestamptz | NOT NULL | 마감 시각 |
| `score_weight` | numeric(5,2) | NOT NULL | 성적 비중 (예: 25.00) |
| `allow_late` | boolean | NOT NULL, DEFAULT false | 지각 제출 허용 여부 |
| `allow_resubmission` | boolean | NOT NULL, DEFAULT false | 재제출 허용 여부 |
| `published_at` | timestamptz | NULL | `published` 전환 시각 |
| `closed_at` | timestamptz | NULL | `closed` 처리 시각 |
| `created_at` | timestamptz | DEFAULT `now()` | 생성 시각 |
| `updated_at` | timestamptz | DEFAULT `now()` | 수정 시각 |

#### `assignment_submissions`
| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| `id` | uuid | PK, DEFAULT `gen_random_uuid()` | 제출물 식별자 |
| `assignment_id` | uuid | NOT NULL, `REFERENCES assignments(id)` | 대상 과제 |
| `learner_id` | uuid | NOT NULL, `REFERENCES profiles(id)` | 제출자 |
| `version` | integer | NOT NULL, DEFAULT 1 | 제출 차수 (재제출 시 +1) |
| `is_latest` | boolean | NOT NULL, DEFAULT true | 최신 제출 여부 |
| `status` | submission_status | NOT NULL | 제출 상태 |
| `late` | boolean | NOT NULL, DEFAULT false | 지각 여부 |
| `submitted_at` | timestamptz | NOT NULL, DEFAULT `now()` | 제출 시각 |
| `content_text` | text | NOT NULL | 본문 텍스트 |
| `content_link` | text | NULL | 선택적 링크 (URL) |
| `score` | numeric(5,2) | NULL | 채점 점수 (0~100) |
| `feedback` | text | NULL | 강사 피드백 |
| `graded_at` | timestamptz | NULL | 채점 완료 시각 |
| `graded_by` | uuid | NULL, `REFERENCES profiles(id)` | 채점한 강사 |

**Indexes & Constraints**
- Unique `(assignment_id, learner_id, version)`으로 버전 중복 방지.
- Partial Index `CREATE UNIQUE INDEX assignment_submissions_latest_idx ON assignment_submissions(assignment_id, learner_id) WHERE is_latest;` 로 최신 제출 단일 유지.

### 뷰(View)
- `course_grade_view`: 학습자별 코스 총점을 계산하기 위해 `assignment_submissions`의 최신 제출(`is_latest = true` AND `status = 'graded'`)과 `assignments.score_weight`를 조인하여 `(submission.score * assignments.score_weight) / 100` 합계를 반환하는 뷰. Learner 성적 페이지는 이 뷰를 사용하여 코스별 요약을 조회한다.

### 트리거 제안
- `assignment_submissions_is_latest_trigger`: 동일 학습자·과제의 기존 최신 제출을 `is_latest=false`로 갱신.
- `timestamp_update_triggers`: `profiles`, `courses`, `assignments` 테이블의 `updated_at` 자동 갱신.
