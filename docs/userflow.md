# Userflow

## 1. 역할 선택 & 온보딩

**입력**

* 이메일/비밀번호
* 역할 선택 (Learner / Instructor)
* 공통 프로필 최소 입력: 이름, 휴대폰번호, 약관동의

**처리**

* Auth 계정 생성 (Supabase)
* 역할 저장 (`role=learner | instructor`)
* 프로필 레코드 생성
* 약관 이력 저장
* 기본 권한 토큰 발급

**출력**

* Learner → 코스 카탈로그 첫 진입
* Instructor → 대시보드 첫 진입

---

## 1.5 코스 생성 & 관리 (Instructor)

**입력**

* 코스 제목, 설명, 카테고리, 난이도
* 초기 상태: `draft`
* 수정/삭제 액션

**처리 (정책)**

* Instructor만 코스 생성 가능 (`role=instructor` 검증)
* 코스는 `instructor_id`로 소유자 연결
* 상태 전환: `draft` → `published` → `archived`
* `draft` 상태: Learner에게 비공개, Instructor만 수정 가능
* `published` 상태: Learner 카탈로그에 노출, 수강신청 가능
* `archived` 상태: 카탈로그 비노출, 기존 수강생은 접근 가능
* 본인이 생성한 코스만 수정/삭제 가능

**출력**

* Instructor 대시보드에서 "내 코스 목록" 표시
* 코스별 상태 배지 (draft/published/archived)
* 게시 버튼 → `published` 전환 시 Learner 카탈로그 반영

---

## 1.6 과제 생성 & 관리 (Instructor)

**입력**

* 과제 제목, 설명, 마감일, 점수 비중
* 제출 정책: 지각 허용 여부, 재제출 허용 여부
* 초기 상태: `draft`
* 수정/삭제/게시/마감 액션

**처리 (정책)**

* Instructor만 자신의 코스에 과제 생성 가능
* 과제는 `course_id`로 코스에 연결
* 상태 전환: `draft` → `published` → `closed`
* `draft` 상태: Learner에게 비공개
* `published` 상태: Learner에게 노출, 제출 가능
* `closed` 상태: 제출 불가, 채점만 가능
* 마감일(`due_at`) 도래 시 자동으로 `closed`로 전환 가능
* 본인 코스의 과제만 수정/삭제 가능

**출력**

* Instructor → 코스 상세 → 과제 목록 표시
* 각 과제 상태 배지 (draft/published/closed)
* 게시 버튼 → Learner에게 과제 노출
* 마감 버튼 → 제출 차단, 채점 모드 전환

---

## 2. 코스 탐색 & 수강신청 (Learner)

**입력**

* 검색어, 필터(카테고리, 난이도), 정렬(최신순/인기순)
* 코스 상세 진입
* “수강신청” 버튼 클릭

**처리 (정책)**

* 코스 상태 `published`만 신청 가능
* 중복 신청 불가 (이미 등록된 경우 차단)
* `enrollments` 테이블에 기록 생성

**출력**

* 신청 성공/실패 피드백
* Learner 대시보드 반영

---

## 3. 과제 상세 열람 (Learner)

**입력**

* 내 코스 → Assignment 목록 → Assignment 상세 클릭

**처리 (정책)**

* Assignment 상태 `published`만 열람 가능
* `closed` 상태면 제출 버튼 비활성화
* 본인 코스 등록 여부 검증

**출력**

* 과제 설명, 마감일, 점수 비중, 정책(지각 허용 여부/재제출 허용 여부) 표시
* 제출 UI(text+link 입력란) 노출

---

## 4. 과제 제출 (Learner)

**입력**

* Text 필드(필수) + Link 필드(선택, URL 형식)
* 제출 버튼 클릭

**처리 (정책)**

* 마감일 전: 정상 제출 (`status=submitted`)
* 마감일 후:

  * `지각 허용 = true` → `status=submitted`, `late=true` 플래그
  * `지각 허용 = false` → 제출 차단
* 재제출 허용 여부 검증:

  * `재제출 허용 = true` → 기존 제출 overwrite or 새 버전 레코드 생성
  * `재제출 허용 = false` → 최초 제출 1회만 허용
* 텍스트/링크 유효성 검사 (공백 방지, URL 형식 검사)

**출력**

* 제출 성공/실패 메시지
* Learner 화면에서 상태 업데이트 (`제출됨/지각 제출/차단됨`)

---

## 5. 과제 채점 & 피드백 (Instructor)

**입력**

* Instructor 대시보드 → 특정 Assignment → 제출물 목록
* 특정 제출물 선택 후 점수(0~100), 피드백(텍스트) 입력
* “재제출 요청” 버튼 선택 가능

**처리 (정책)**

* Instructor 본인 소유 코스만 접근 가능
* 점수 범위(0~100) 제한
* 상태 전환:

  * 점수 입력 → `graded`
  * 재제출 요청 → `resubmission_required` (Learner는 다시 제출 가능)
* 피드백 저장(필수)

**출력**

* Learner에게 피드백 표시
* Learner 대시보드 과제 상태 반영 (`graded / resubmission_required`)

---

## 6. Assignment 게시/마감 (Instructor)

**입력**

* 과제 생성/수정 (제목, 설명, 마감일, 점수 비중, 지각 허용 여부, 재제출 허용 여부)
* “게시하기” 클릭
* 마감일 도래 시 자동 마감 or “마감하기” 수동 클릭

**처리 (정책)**

* `draft → published` 전환 시 학습자에게 노출
* 마감일 이후 자동 `closed`
* 마감 후에는 제출 불가, 채점만 가능

**출력**

* Assignment 목록 갱신
* Learner 화면에서 마감 상태 반영

---

## 7. 성적 & 피드백 열람 (Learner)

**입력**

* 성적 페이지 접근

**처리 (정책)**

* 본인 제출물만 조회 가능
* 과제별 점수, 지각 여부, 재제출 여부, 피드백 표시
* 코스별 총점 계산: (각 Assignment 점수 × 비중) 합산

**출력**

* 과제별 점수/상태(제출됨/지각/graded/재제출요청)
* 코스 총점 요약
