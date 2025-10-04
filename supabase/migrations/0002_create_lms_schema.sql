-- Migration: Create LMS core schema (profiles, courses, assignments, submissions)
-- Description: Implements the complete database schema for learner/instructor course management system

BEGIN;

-- Ensure required extensions are available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUM TYPES
-- =====================================================

DO $$ BEGIN
  CREATE TYPE role_type AS ENUM ('learner', 'instructor');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE assignment_status AS ENUM ('draft', 'published', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE submission_status AS ENUM ('submitted', 'graded', 'resubmission_required');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- TABLES
-- =====================================================

-- profiles: User profile information linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role role_type NOT NULL,
  full_name text NOT NULL,
  phone_number text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'User profiles with role and basic information';

-- terms_acceptances: Terms and conditions acceptance history
CREATE TABLE IF NOT EXISTS public.terms_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address inet
);

COMMENT ON TABLE public.terms_acceptances IS 'Audit log for terms and conditions acceptance';

-- courses: Course catalog managed by instructors
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  difficulty text NOT NULL,
  status course_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.courses IS 'Course catalog with status and metadata';

-- course_enrollments: Learner enrollment records
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  learner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_course_learner UNIQUE (course_id, learner_id)
);

COMMENT ON TABLE public.course_enrollments IS 'Student enrollment records with duplicate prevention';

-- assignments: Course assignments with submission policies
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  status assignment_status NOT NULL DEFAULT 'draft',
  due_at timestamptz NOT NULL,
  score_weight numeric(5,2) NOT NULL,
  allow_late boolean NOT NULL DEFAULT false,
  allow_resubmission boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.assignments IS 'Course assignments with deadline and scoring policies';

-- assignment_submissions: Student submission records with versioning
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  learner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  is_latest boolean NOT NULL DEFAULT true,
  status submission_status NOT NULL,
  late boolean NOT NULL DEFAULT false,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  content_text text NOT NULL,
  content_link text,
  score numeric(5,2),
  feedback text,
  graded_at timestamptz,
  graded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT unique_submission_version UNIQUE (assignment_id, learner_id, version)
);

COMMENT ON TABLE public.assignment_submissions IS 'Assignment submissions with versioning and grading support';

-- =====================================================
-- INDEXES
-- =====================================================

-- Ensure only one latest submission per assignment per learner
CREATE UNIQUE INDEX IF NOT EXISTS assignment_submissions_latest_idx 
ON public.assignment_submissions(assignment_id, learner_id) 
WHERE is_latest = true;

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_learner ON public.course_enrollments(learner_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_submissions_learner ON public.assignment_submissions(learner_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.assignment_submissions(status);

-- =====================================================
-- TRIGGER FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to maintain is_latest flag on new submission
CREATE OR REPLACE FUNCTION public.maintain_submission_latest_flag()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark all previous submissions as not latest
  UPDATE public.assignment_submissions
  SET is_latest = false
  WHERE assignment_id = NEW.assignment_id
    AND learner_id = NEW.learner_id
    AND id != NEW.id
    AND is_latest = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at on profiles
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at on courses
DROP TRIGGER IF EXISTS trigger_courses_updated_at ON public.courses;
CREATE TRIGGER trigger_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at on assignments
DROP TRIGGER IF EXISTS trigger_assignments_updated_at ON public.assignments;
CREATE TRIGGER trigger_assignments_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Maintain is_latest flag on new submission
DROP TRIGGER IF EXISTS trigger_maintain_submission_latest ON public.assignment_submissions;
CREATE TRIGGER trigger_maintain_submission_latest
BEFORE INSERT ON public.assignment_submissions
FOR EACH ROW
EXECUTE FUNCTION public.maintain_submission_latest_flag();

-- =====================================================
-- VIEWS
-- =====================================================

-- View for calculating course grades per learner
CREATE OR REPLACE VIEW public.course_grade_view AS
SELECT 
  ce.learner_id,
  ce.course_id,
  c.title AS course_title,
  SUM((asub.score * a.score_weight) / 100.0) AS total_score,
  COUNT(DISTINCT a.id) AS total_assignments,
  COUNT(DISTINCT CASE WHEN asub.status = 'graded' THEN a.id END) AS graded_assignments
FROM public.course_enrollments ce
JOIN public.courses c ON c.id = ce.course_id
LEFT JOIN public.assignments a ON a.course_id = ce.course_id AND a.status != 'draft'
LEFT JOIN public.assignment_submissions asub ON asub.assignment_id = a.id 
  AND asub.learner_id = ce.learner_id 
  AND asub.is_latest = true 
  AND asub.status = 'graded'
GROUP BY ce.learner_id, ce.course_id, c.title;

COMMENT ON VIEW public.course_grade_view IS 'Aggregated course grades per learner with weighted scoring';

-- =====================================================
-- ROW LEVEL SECURITY (DISABLED)
-- =====================================================

ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.terms_acceptances DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.course_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assignment_submissions DISABLE ROW LEVEL SECURITY;

COMMIT;

