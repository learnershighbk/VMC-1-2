export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'learner' | 'instructor';
          full_name: string;
          phone_number: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: 'learner' | 'instructor';
          full_name: string;
          phone_number: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: 'learner' | 'instructor';
          full_name?: string;
          phone_number?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      terms_acceptances: {
        Row: {
          id: string;
          user_id: string;
          version: string;
          accepted_at: string;
          ip_address: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          version: string;
          accepted_at?: string;
          ip_address?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          version?: string;
          accepted_at?: string;
          ip_address?: string | null;
        };
      };
      courses: {
        Row: {
          id: string;
          instructor_id: string;
          title: string;
          description: string;
          category: string;
          difficulty: string;
          status: 'draft' | 'published' | 'archived';
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          instructor_id: string;
          title: string;
          description: string;
          category: string;
          difficulty: string;
          status?: 'draft' | 'published' | 'archived';
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          instructor_id?: string;
          title?: string;
          description?: string;
          category?: string;
          difficulty?: string;
          status?: 'draft' | 'published' | 'archived';
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      course_enrollments: {
        Row: {
          id: string;
          course_id: string;
          learner_id: string;
          enrolled_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          learner_id: string;
          enrolled_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          learner_id?: string;
          enrolled_at?: string;
        };
      };
      assignments: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          description: string;
          status: 'draft' | 'published' | 'closed';
          due_at: string;
          score_weight: number;
          allow_late: boolean;
          allow_resubmission: boolean;
          published_at: string | null;
          closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          description: string;
          status?: 'draft' | 'published' | 'closed';
          due_at: string;
          score_weight: number;
          allow_late?: boolean;
          allow_resubmission?: boolean;
          published_at?: string | null;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          title?: string;
          description?: string;
          status?: 'draft' | 'published' | 'closed';
          due_at?: string;
          score_weight?: number;
          allow_late?: boolean;
          allow_resubmission?: boolean;
          published_at?: string | null;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      assignment_submissions: {
        Row: {
          id: string;
          assignment_id: string;
          learner_id: string;
          version: number;
          is_latest: boolean;
          status: 'submitted' | 'graded' | 'resubmission_required';
          late: boolean;
          submitted_at: string;
          content_text: string;
          content_link: string | null;
          score: number | null;
          feedback: string | null;
          graded_at: string | null;
          graded_by: string | null;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          learner_id: string;
          version?: number;
          is_latest?: boolean;
          status: 'submitted' | 'graded' | 'resubmission_required';
          late?: boolean;
          submitted_at?: string;
          content_text: string;
          content_link?: string | null;
          score?: number | null;
          feedback?: string | null;
          graded_at?: string | null;
          graded_by?: string | null;
        };
        Update: {
          id?: string;
          assignment_id?: string;
          learner_id?: string;
          version?: number;
          is_latest?: boolean;
          status?: 'submitted' | 'graded' | 'resubmission_required';
          late?: boolean;
          submitted_at?: string;
          content_text?: string;
          content_link?: string | null;
          score?: number | null;
          feedback?: string | null;
          graded_at?: string | null;
          graded_by?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      role_type: 'learner' | 'instructor';
      course_status: 'draft' | 'published' | 'archived';
      assignment_status: 'draft' | 'published' | 'closed';
      submission_status: 'submitted' | 'graded' | 'resubmission_required';
    };
  };
};

export type SupabaseUserMetadata = Record<string, unknown>;
