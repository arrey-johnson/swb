export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'audit_logs_actor_id_fkey'
            columns: ['actor_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      deposit_requests: {
        Row: {
          amount: number
          created_at: string
          goal_id: string
          id: string
          proof_url: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database['public']['Enums']['deposit_request_status']
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          goal_id: string
          id?: string
          proof_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database['public']['Enums']['deposit_request_status']
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          goal_id?: string
          id?: string
          proof_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database['public']['Enums']['deposit_request_status']
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'deposit_requests_goal_id_fkey'
            columns: ['goal_id']
            isOneToOne: false
            referencedRelation: 'savings_goals'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'deposit_requests_reviewed_by_fkey'
            columns: ['reviewed_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'deposit_requests_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      discipline_scores: {
        Row: {
          id: string
          last_deposit_month: string | null
          level: Database['public']['Enums']['discipline_level']
          points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          last_deposit_month?: string | null
          level?: Database['public']['Enums']['discipline_level']
          points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          last_deposit_month?: string | null
          level?: Database['public']['Enums']['discipline_level']
          points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'discipline_scores_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      finance_post_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'finance_post_comments_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'finance_posts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'finance_post_comments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      finance_post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'finance_post_likes_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'finance_posts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'finance_post_likes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      finance_post_saves: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'finance_post_saves_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'finance_posts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'finance_post_saves_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      finance_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'finance_posts_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          link_path: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          link_path?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link_path?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      penalty_settings: {
        Row: {
          duration_months: number
          id: string
          percentage: number
          updated_at: string
        }
        Insert: {
          duration_months: number
          id?: string
          percentage: number
          updated_at?: string
        }
        Update: {
          duration_months?: number
          id?: string
          percentage?: number
          updated_at?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          onboarding_completed: boolean
          payout_phone: string | null
          phone: string
          phone_verified: boolean
          role: Database['public']['Enums']['user_role']
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          onboarding_completed?: boolean
          payout_phone?: string | null
          phone: string
          phone_verified?: boolean
          role?: Database['public']['Enums']['user_role']
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          onboarding_completed?: boolean
          payout_phone?: string | null
          phone?: string
          phone_verified?: boolean
          role?: Database['public']['Enums']['user_role']
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      savings_accounts: {
        Row: {
          balance: number
          created_at: string
          id: string
          reserve_balance: number
          status: Database['public']['Enums']['account_status']
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          reserve_balance?: number
          status?: Database['public']['Enums']['account_status']
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          reserve_balance?: number
          status?: Database['public']['Enums']['account_status']
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'savings_accounts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      savings_goals: {
        Row: {
          created_at: string
          current_amount: number
          description: string | null
          duration_months: number
          id: string
          maturity_date: string
          start_date: string
          status: Database['public']['Enums']['goal_status']
          target_amount: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_amount?: number
          description?: string | null
          duration_months: number
          id?: string
          maturity_date: string
          start_date?: string
          status?: Database['public']['Enums']['goal_status']
          target_amount: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_amount?: number
          description?: string | null
          duration_months?: number
          id?: string
          maturity_date?: string
          start_date?: string
          status?: Database['public']['Enums']['goal_status']
          target_amount?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'savings_goals_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          goal_id: string | null
          id: string
          transaction_type: Database['public']['Enums']['transaction_type']
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          goal_id?: string | null
          id?: string
          transaction_type: Database['public']['Enums']['transaction_type']
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          goal_id?: string | null
          id?: string
          transaction_type?: Database['public']['Enums']['transaction_type']
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_goal_id_fkey'
            columns: ['goal_id']
            isOneToOne: false
            referencedRelation: 'savings_goals'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string
          goal_id: string
          id: string
          is_early: boolean
          net_amount: number
          paid_at: string | null
          payout_phone: string | null
          payout_reference: string | null
          payout_status: Database['public']['Enums']['payout_status']
          penalty_amount: number
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          goal_id: string
          id?: string
          is_early?: boolean
          net_amount: number
          paid_at?: string | null
          payout_phone?: string | null
          payout_status?: Database['public']['Enums']['payout_status']
          penalty_amount?: number
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          goal_id?: string
          id?: string
          is_early?: boolean
          net_amount?: number
          paid_at?: string | null
          payout_phone?: string | null
          payout_status?: Database['public']['Enums']['payout_status']
          penalty_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'withdrawals_goal_id_fkey'
            columns: ['goal_id']
            isOneToOne: false
            referencedRelation: 'savings_goals'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'withdrawals_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_penalty: {
        Args: { p_amount: number; p_goal_id: string }
        Returns: Json
      }
      check_maturity: { Args: never; Returns: number }
      cancel_goal: { Args: { p_goal_id: string }; Returns: undefined }
      complete_goal: {
        Args: { p_goal_id: string; p_user_id: string }
        Returns: undefined
      }
      create_goal: {
        Args: {
          p_description: string
          p_duration_months: number
          p_target_amount: number
          p_title: string
          p_user_id: string
        }
        Returns: string
      }
      deposit_funds: {
        Args: {
          p_amount: number
          p_deposit_request_id?: string
          p_goal_id: string
          p_user_id: string
        }
        Returns: string
      }
      get_admin_metrics: { Args: never; Returns: Json }
      get_admin_user_detail: { Args: { p_user_id: string }; Returns: Json }
      get_dashboard_metrics: { Args: never; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      admin_update_account_status: {
        Args: { p_user_id: string; p_status: Database['public']['Enums']['account_status']; p_reason?: string }
        Returns: undefined
      }
      admin_credit_balance: {
        Args: {
          p_user_id: string
          p_amount: number
          p_type: Database['public']['Enums']['transaction_type']
          p_reason: string
          p_goal_id?: string
        }
        Returns: string
      }
      admin_debit_balance: {
        Args: { p_user_id: string; p_amount: number; p_reason: string; p_goal_id?: string }
        Returns: string
      }
      admin_update_user_role: {
        Args: { p_user_id: string; p_role: Database['public']['Enums']['user_role'] }
        Returns: undefined
      }
      admin_verify_phone: {
        Args: { p_user_id: string; p_verified: boolean }
        Returns: undefined
      }
      mark_withdrawal_paid: {
        Args: { p_withdrawal_id: string; p_payout_reference?: string }
        Returns: undefined
      }
      reject_deposit: {
        Args: { p_reason: string; p_request_id: string }
        Returns: undefined
      }
      withdraw_funds: {
        Args: { p_amount: number; p_goal_id: string; p_user_id: string }
        Returns: string
      }
      update_goal: {
        Args: {
          p_description: string
          p_goal_id: string
          p_target_amount?: number
          p_title: string
        }
        Returns: undefined
      }
    }
    Enums: {
      account_status: 'active' | 'suspended' | 'closed' | 'pending'
      deposit_request_status: 'pending' | 'approved' | 'rejected'
      discipline_level: 'bronze' | 'silver' | 'gold' | 'platinum'
      goal_status: 'active' | 'matured' | 'completed' | 'withdrawn_early' | 'cancelled'
      payout_status: 'pending_payout' | 'paid'
      transaction_type: 'deposit' | 'withdrawal' | 'penalty' | 'adjustment' | 'refund'
      user_role: 'saver' | 'admin'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
