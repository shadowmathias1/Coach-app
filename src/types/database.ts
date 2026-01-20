export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'coach' | 'client'
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role: 'coach' | 'client'
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'coach' | 'client'
          name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      coaches: {
        Row: {
          id: string
          invite_code: string
          brand_name: string | null
          timezone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          invite_code?: string
          brand_name?: string | null
          timezone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invite_code?: string
          brand_name?: string | null
          timezone?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          coach_id: string
          display_name: string
          age: number | null
          height: number | null
          weight: number | null
          goal: string | null
          injuries: string | null
          joined_at: string
          last_activity_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          coach_id: string
          display_name: string
          age?: number | null
          height?: number | null
          weight?: number | null
          goal?: string | null
          injuries?: string | null
          joined_at?: string
          last_activity_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          display_name?: string
          age?: number | null
          height?: number | null
          weight?: number | null
          goal?: string | null
          injuries?: string | null
          joined_at?: string
          last_activity_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          id: string
          coach_id: string
          client_id: string | null
          title: string
          description: string | null
          start_date: string | null
          end_date: string | null
          is_active: boolean
          is_template: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          client_id?: string | null
          title: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          is_template?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          client_id?: string | null
          title?: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          is_template?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      program_days: {
        Row: {
          id: string
          program_id: string
          week_number: number
          day_number: number
          title: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          program_id: string
          week_number: number
          day_number: number
          title: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          program_id?: string
          week_number?: number
          day_number?: number
          title?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      program_items: {
        Row: {
          id: string
          program_day_id: string
          exercise_id: string | null
          exercise_name: string
          order_index: number
          target_sets: number | null
          target_reps: string | null
          target_rpe: number | null
          target_weight: number | null
          rest_seconds: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          program_day_id: string
          exercise_id?: string | null
          exercise_name: string
          order_index: number
          target_sets?: number | null
          target_reps?: string | null
          target_rpe?: number | null
          target_weight?: number | null
          rest_seconds?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          program_day_id?: string
          exercise_id?: string | null
          exercise_name?: string
          order_index?: number
          target_sets?: number | null
          target_reps?: string | null
          target_rpe?: number | null
          target_weight?: number | null
          rest_seconds?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          id: string
          coach_id: string
          name: string
          muscle_group: string | null
          equipment: string | null
          video_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          name: string
          muscle_group?: string | null
          equipment?: string | null
          video_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          name?: string
          muscle_group?: string | null
          equipment?: string | null
          video_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workout_logs: {
        Row: {
          id: string
          client_id: string
          coach_id: string
          date: string
          duration_minutes: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          coach_id: string
          date: string
          duration_minutes: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          coach_id?: string
          date?: string
          duration_minutes?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workout_entries: {
        Row: {
          id: string
          workout_log_id: string
          exercise_name: string
          sets_json: Json
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workout_log_id: string
          exercise_name: string
          sets_json: Json
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workout_log_id?: string
          exercise_name?: string
          sets_json?: Json
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      checkins: {
        Row: {
          id: string
          client_id: string
          coach_id: string
          week_start_date: string
          weight: number | null
          sleep_quality: number
          stress_level: number
          soreness_level: number
          mood: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          coach_id: string
          week_start_date: string
          weight?: number | null
          sleep_quality: number
          stress_level: number
          soreness_level: number
          mood: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          coach_id?: string
          week_start_date?: string
          weight?: number | null
          sleep_quality?: number
          stress_level?: number
          soreness_level?: number
          mood?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          coach_id: string
          client_id: string
          sender_user_id: string
          text: string
          read_by_coach: boolean
          read_by_client: boolean
          created_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          client_id: string
          sender_user_id: string
          text: string
          read_by_coach?: boolean
          read_by_client?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          client_id?: string
          sender_user_id?: string
          text?: string
          read_by_coach?: boolean
          read_by_client?: boolean
          created_at?: string
        }
        Relationships: []
      }
      chat_threads: {
        Row: {
          id: string
          coach_id: string
          title: string
          is_group: boolean
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          title: string
          is_group?: boolean
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          title?: string
          is_group?: boolean
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      chat_members: {
        Row: {
          id: string
          thread_id: string
          user_id: string
          role: 'coach' | 'client'
          added_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          user_id: string
          role: 'coach' | 'client'
          added_at?: string
        }
        Update: {
          id?: string
          thread_id?: string
          user_id?: string
          role?: 'coach' | 'client'
          added_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          id: string
          thread_id: string
          sender_user_id: string
          text: string | null
          message_type: string
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          sender_user_id: string
          text?: string | null
          message_type?: string
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          thread_id?: string
          sender_user_id?: string
          text?: string | null
          message_type?: string
          parent_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      chat_attachments: {
        Row: {
          id: string
          message_id: string
          file_name: string
          file_path: string
          file_type: string | null
          file_size: number | null
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          file_name: string
          file_path: string
          file_type?: string | null
          file_size?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          file_name?: string
          file_path?: string
          file_type?: string | null
          file_size?: number | null
          created_at?: string
        }
        Relationships: []
      }
      chat_reactions: {
        Row: {
          id: string
          message_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string
          emoji?: string
          created_at?: string
        }
        Relationships: []
      }
      chat_reads: {
        Row: {
          id: string
          message_id: string
          user_id: string
          read_at: string
        }
        Insert: {
          id?: string
          message_id: string
          user_id: string
          read_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string
          read_at?: string
        }
        Relationships: []
      }
      coach_notes: {
        Row: {
          id: string
          coach_id: string
          client_id: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          client_id: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          client_id?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      coach_branding: {
        Row: {
          coach_id: string
          brand_name: string | null
          logo_url: string | null
          primary_color: string | null
          accent_color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          brand_name?: string | null
          logo_url?: string | null
          primary_color?: string | null
          accent_color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          brand_name?: string | null
          logo_url?: string | null
          primary_color?: string | null
          accent_color?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      muscle_groups: {
        Row: {
          id: string
          coach_id: string | null
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id?: string | null
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string | null
          name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      exercise_muscles: {
        Row: {
          exercise_id: string
          muscle_group_id: string
          created_at: string
        }
        Insert: {
          exercise_id: string
          muscle_group_id: string
          created_at?: string
        }
        Update: {
          exercise_id?: string
          muscle_group_id?: string
          created_at?: string
        }
        Relationships: []
      }
      client_goals: {
        Row: {
          id: string
          client_id: string
          coach_id: string
          goal_type: string
          status: string
          target_value: number
          target_unit: string | null
          start_date: string
          target_date: string | null
          exercise_id: string | null
          performance_metric: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          coach_id: string
          goal_type: string
          status?: string
          target_value: number
          target_unit?: string | null
          start_date?: string
          target_date?: string | null
          exercise_id?: string | null
          performance_metric?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          coach_id?: string
          goal_type?: string
          status?: string
          target_value?: number
          target_unit?: string | null
          start_date?: string
          target_date?: string | null
          exercise_id?: string | null
          performance_metric?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workout_templates: {
        Row: {
          id: string
          coach_id: string | null
          client_id: string | null
          title: string
          description: string | null
          is_shared: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id?: string | null
          client_id?: string | null
          title: string
          description?: string | null
          is_shared?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string | null
          client_id?: string | null
          title?: string
          description?: string | null
          is_shared?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workout_template_days: {
        Row: {
          id: string
          template_id: string
          week_number: number
          day_number: number
          title: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          template_id: string
          week_number: number
          day_number: number
          title: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          week_number?: number
          day_number?: number
          title?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workout_template_items: {
        Row: {
          id: string
          template_day_id: string
          exercise_id: string | null
          exercise_name: string
          order_index: number
          target_sets: number | null
          target_reps: string | null
          target_rpe: number | null
          target_weight: number | null
          rest_seconds: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          template_day_id: string
          exercise_id?: string | null
          exercise_name: string
          order_index: number
          target_sets?: number | null
          target_reps?: string | null
          target_rpe?: number | null
          target_weight?: number | null
          rest_seconds?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          template_day_id?: string
          exercise_id?: string | null
          exercise_name?: string
          order_index?: number
          target_sets?: number | null
          target_reps?: string | null
          target_rpe?: number | null
          target_weight?: number | null
          rest_seconds?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      workout_entry_sets: {
        Row: {
          workout_entry_id: string
          workout_log_id: string
          client_id: string
          coach_id: string
          date: string
          exercise_id: string | null
          exercise_name: string
          set_index: number
          reps: number | null
          weight: number | null
          rpe: number | null
          rir: number | null
          rest_seconds: number | null
          set_volume: number | null
        }
        Relationships: []
      }
      exercise_best_loads_daily: {
        Row: {
          client_id: string
          coach_id: string
          exercise_id: string | null
          exercise_name: string
          date: string
          max_weight: number | null
        }
        Relationships: []
      }
      exercise_best_1rm_daily: {
        Row: {
          client_id: string
          coach_id: string
          exercise_id: string | null
          exercise_name: string
          date: string
          max_estimated_1rm: number | null
        }
        Relationships: []
      }
      exercise_compare_series: {
        Row: {
          client_id: string
          coach_id: string
          exercise_id: string | null
          exercise_name: string
          date: string
          metric: string
          value: number | null
        }
        Relationships: []
      }
      client_bmi: {
        Row: {
          client_id: string
          coach_id: string
          display_name: string
          height: number | null
          weight: number | null
          bmi: number | null
          bmi_note: string | null
        }
        Relationships: []
      }
      exercise_perf_daily_secure: {
        Row: {
          client_id: string
          coach_id: string
          exercise_id: string | null
          exercise_name: string
          date: string
          max_weight: number | null
          max_estimated_1rm: number | null
        }
        Relationships: []
      }
      exercise_prs: {
        Row: {
          client_id: string
          coach_id: string
          exercise_id: string | null
          exercise_name: string
          max_weight: number | null
          max_weight_date: string | null
          max_estimated_1rm: number | null
          max_estimated_1rm_date: string | null
        }
        Relationships: []
      }
      exercise_last_best: {
        Row: {
          client_id: string
          coach_id: string
          exercise_id: string | null
          exercise_name: string
          last_date: string
          last_max_weight: number | null
          last_max_estimated_1rm: number | null
        }
        Relationships: []
      }
      client_weekly_volume: {
        Row: {
          client_id: string
          coach_id: string
          week_start: string
          total_volume: number | null
          total_reps: number | null
          set_count: number | null
        }
        Relationships: []
      }
      client_weekly_volume_compare: {
        Row: {
          client_id: string
          coach_id: string
          week_start: string
          current_volume: number | null
          previous_volume: number | null
          delta_volume: number | null
        }
        Relationships: []
      }
      workout_entry_sets_with_muscles: {
        Row: {
          workout_entry_id: string
          workout_log_id: string
          client_id: string
          coach_id: string
          date: string
          exercise_id: string | null
          exercise_name: string
          reps: number | null
          weight: number | null
          muscle_group: string | null
        }
        Relationships: []
      }
      client_weekly_muscle_tonnage: {
        Row: {
          client_id: string
          coach_id: string
          week_start: string
          muscle_group: string
          total_tonnage: number | null
        }
        Relationships: []
      }
      workout_set_intensity: {
        Row: {
          workout_entry_id: string
          workout_log_id: string
          client_id: string
          coach_id: string
          date: string
          exercise_id: string | null
          exercise_name: string
          reps: number | null
          weight: number | null
          max_estimated_1rm: number | null
          intensity_percent: number | null
          intensity_goal: string | null
        }
        Relationships: []
      }
      client_weekly_goal_sets: {
        Row: {
          client_id: string
          coach_id: string
          week_start: string
          intensity_goal: string
          set_count: number
        }
        Relationships: []
      }
      client_goal_progress: {
        Row: {
          id: string
          client_id: string
          coach_id: string
          goal_type: string
          status: string
          target_value: number
          target_unit: string | null
          start_date: string
          target_date: string | null
          exercise_id: string | null
          performance_metric: string | null
          notes: string | null
          created_at: string
          updated_at: string
          current_weight: number | null
          sessions_last_7d: number | null
          current_value: number | null
          progress_ratio: number | null
          is_met: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_coach_by_invite_code: {
        Args: {
          invite_code: string
        }
        Returns: {
          id: string
          brand_name: string | null
        }[]
      }
      create_client_with_invite_v2: {
        Args: {
          p_invite_code: string
          display_name: string
        }
        Returns: {
          id: string
          coach_id: string
        }[]
      }
      compare_exercises: {
        Args: {
          in_client_id: string
          in_exercise_ids: string[]
          in_metric?: string | null
        }
        Returns: {
          date: string
          exercise_id: string
          exercise_name: string
          metric: string
          value: number | null
        }[]
      }
      refresh_exercise_perf_daily_agg: {
        Args: Record<string, never>
        Returns: void
      }
      round_to_increment: {
        Args: {
          value: number
          increment: number
        }
        Returns: number
      }
      suggest_exercise_loads: {
        Args: {
          in_client_id: string
          in_exercise_id: string
          in_goal?: string | null
          in_increment?: number | null
        }
        Returns: {
          goal: string
          rep_range: string
          min_weight: number | null
          max_weight: number | null
          suggested_weight: number | null
          last_session_date: string | null
          last_best_weight: number | null
          last_best_1rm: number | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
