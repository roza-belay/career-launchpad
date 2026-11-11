export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          applied_date: string | null
          arrangement: string
          company: string
          cover_letter: string | null
          created_at: string
          cv_version: string | null
          id: string
          interview_date: string | null
          is_demo: boolean
          job_url: string | null
          last_contact_date: string | null
          location: string | null
          next_follow_up: string | null
          notes: string | null
          recruiter_email: string | null
          recruiter_name: string | null
          recruiter_phone: string | null
          salary_max: number | null
          salary_min: number | null
          status: Database["public"]["Enums"]["app_status"]
          title: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          applied_date?: string | null
          arrangement?: string
          company: string
          cover_letter?: string | null
          created_at?: string
          cv_version?: string | null
          id?: string
          interview_date?: string | null
          is_demo?: boolean
          job_url?: string | null
          last_contact_date?: string | null
          location?: string | null
          next_follow_up?: string | null
          notes?: string | null
          recruiter_email?: string | null
          recruiter_name?: string | null
          recruiter_phone?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: Database["public"]["Enums"]["app_status"]
          title: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Update: {
          applied_date?: string | null
          arrangement?: string
          company?: string
          cover_letter?: string | null
          created_at?: string
          cv_version?: string | null
          id?: string
          interview_date?: string | null
          is_demo?: boolean
          job_url?: string | null
          last_contact_date?: string | null
          location?: string | null
          next_follow_up?: string | null
          notes?: string | null
          recruiter_email?: string | null
          recruiter_name?: string | null
          recruiter_phone?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: Database["public"]["Enums"]["app_status"]
          title?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      career_profiles: {
        Row: {
          headline: string
          preferred_roles: string[]
          summary: string
          updated_at: string
          user_id: string
        }
        Insert: {
          headline?: string
          preferred_roles?: string[]
          summary?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          headline?: string
          preferred_roles?: string[]
          summary?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cv_documents: {
        Row: {
          content: Json
          created_at: string
          id: string
          kind: string
          language: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          kind?: string
          language?: string
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          kind?: string
          language?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      follow_ups: {
        Row: {
          application_id: string
          created_at: string
          followed_up_on: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          followed_up_on?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          followed_up_on?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_items: {
        Row: {
          created_at: string
          details: string | null
          hub: string
          id: string
          status: string
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          hub: string
          id?: string
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          hub?: string
          id?: string
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      interview_questions: {
        Row: {
          answer: string | null
          category: string
          created_at: string
          id: string
          preset_key: string | null
          question: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          category?: string
          created_at?: string
          id?: string
          preset_key?: string | null
          question?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          answer?: string | null
          category?: string
          created_at?: string
          id?: string
          preset_key?: string | null
          question?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_goals: {
        Row: {
          created_at: string
          done: boolean
          id: string
          skill_id: string | null
          target_date: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          skill_id?: string | null
          target_date?: string | null
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          skill_id?: string | null
          target_date?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_goals_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      planner_tasks: {
        Row: {
          created_at: string
          id: string
          label: string
          position: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          position?: number
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          position?: number
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          category: string | null
          challenges: string | null
          checklist: Json
          created_at: string
          demo_url: string | null
          description: string | null
          docs_url: string | null
          end_date: string | null
          features: string[]
          github_url: string | null
          id: string
          is_public: boolean
          role: string | null
          screenshots: string[]
          short_description: string | null
          start_date: string | null
          status: string
          technologies: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          challenges?: string | null
          checklist?: Json
          created_at?: string
          demo_url?: string | null
          description?: string | null
          docs_url?: string | null
          end_date?: string | null
          features?: string[]
          github_url?: string | null
          id?: string
          is_public?: boolean
          role?: string | null
          screenshots?: string[]
          short_description?: string | null
          start_date?: string | null
          status?: string
          technologies?: string[]
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string | null
          challenges?: string | null
          checklist?: Json
          created_at?: string
          demo_url?: string | null
          description?: string | null
          docs_url?: string | null
          end_date?: string | null
          features?: string[]
          github_url?: string | null
          id?: string
          is_public?: boolean
          role?: string | null
          screenshots?: string[]
          short_description?: string | null
          start_date?: string | null
          status?: string
          technologies?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string
          created_at: string
          goal: string | null
          id: string
          improving: boolean
          is_custom: boolean
          level: string | null
          name: string
          notes: string | null
          progress: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          goal?: string | null
          id?: string
          improving?: boolean
          is_custom?: boolean
          level?: string | null
          name: string
          notes?: string | null
          progress?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string
          created_at?: string
          goal?: string | null
          id?: string
          improving?: boolean
          is_custom?: boolean
          level?: string | null
          name?: string
          notes?: string | null
          progress?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      task_completions: {
        Row: {
          done_on: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          done_on?: string
          id?: string
          task_id: string
          user_id?: string
        }
        Update: {
          done_on?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "planner_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      vacancies: {
        Row: {
          application_id: string | null
          arrangement: string
          company: string
          created_at: string
          deadline: string | null
          description: string | null
          employment_type: string
          id: string
          job_url: string | null
          location: string | null
          saved_on: string
          skills: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          arrangement?: string
          company: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          employment_type?: string
          id?: string
          job_url?: string | null
          location?: string | null
          saved_on?: string
          skills?: string[]
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          application_id?: string | null
          arrangement?: string
          company?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          employment_type?: string
          id?: string
          job_url?: string | null
          location?: string | null
          saved_on?: string
          skills?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacancies_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_goals: {
        Row: {
          created_at: string
          done: boolean
          id: string
          label: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          label: string
          user_id?: string
          week_start: string
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          label?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      seed_developer_expansion: { Args: { _uid: string }; Returns: undefined }
      seed_skills_and_questions: { Args: { _uid: string }; Returns: undefined }
    }
    Enums: {
      app_status: "SAVED" | "APPLIED" | "INTERVIEWING" | "OFFER" | "CLOSED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_status: ["SAVED", "APPLIED", "INTERVIEWING", "OFFER", "CLOSED"],
    },
  },
} as const
