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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          cancellation_reason: string | null
          created_at: string | null
          ends_at: string
          id: string
          location_label: string | null
          location_type: string | null
          patient_id: string
          practice_profile_id: string
          reminder_sent: boolean
          starts_at: string
          status: string | null
          ts_transmitted: boolean
          updated_at: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          created_at?: string | null
          ends_at: string
          id?: string
          location_label?: string | null
          location_type?: string | null
          patient_id: string
          practice_profile_id: string
          reminder_sent?: boolean
          starts_at: string
          status?: string | null
          ts_transmitted?: boolean
          updated_at?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          created_at?: string | null
          ends_at?: string
          id?: string
          location_label?: string | null
          location_type?: string | null
          patient_id?: string
          practice_profile_id?: string
          reminder_sent?: boolean
          starts_at?: string
          status?: string | null
          ts_transmitted?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_practice_profile_id_fkey"
            columns: ["practice_profile_id"]
            isOneToOne: false
            referencedRelation: "practice_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string | null
          actor_user_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action?: string | null
          actor_user_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string | null
          actor_user_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          category: string
          context_action: string | null
          created_at: string | null
          id: string
          message: string | null
          rating: number | null
          user_id: string
        }
        Insert: {
          category: string
          context_action?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          rating?: number | null
          user_id: string
        }
        Update: {
          category?: string
          context_action?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          rating?: number | null
          user_id?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          invoice_id: string
          quantity: number | null
          total_amount: number | null
          unit_amount: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id: string
          quantity?: number | null
          total_amount?: number | null
          unit_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id?: string
          quantity?: number | null
          total_amount?: number | null
          unit_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          billing_month: string | null
          created_at: string | null
          due_date: string | null
          id: string
          invoice_number: string | null
          issue_date: string | null
          patient_id: string
          pdf_url: string | null
          practice_profile_id: string
          sent_at: string | null
          service_record_id: string | null
          status: string | null
          subtotal: number | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          billing_month?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          patient_id: string
          pdf_url?: string | null
          practice_profile_id: string
          sent_at?: string | null
          service_record_id?: string | null
          status?: string | null
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          billing_month?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          patient_id?: string
          pdf_url?: string | null
          practice_profile_id?: string
          sent_at?: string | null
          service_record_id?: string | null
          status?: string | null
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_practice_profile_id_fkey"
            columns: ["practice_profile_id"]
            isOneToOne: false
            referencedRelation: "practice_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_service_record_id_fkey"
            columns: ["service_record_id"]
            isOneToOne: false
            referencedRelation: "service_records"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_consents: {
        Row: {
          accepted_at: string | null
          consent_type: string | null
          created_at: string | null
          file_url: string | null
          id: string
          patient_id: string
          revoked_at: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          accepted_at?: string | null
          consent_type?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          patient_id: string
          revoked_at?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          accepted_at?: string | null
          consent_type?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          patient_id?: string
          revoked_at?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_consents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          birth_date: string | null
          city: string | null
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          last_contacted_at: string | null
          last_name: string
          notes_admin: string | null
          phone: string | null
          practice_profile_id: string
          status: string | null
          tax_code: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_contacted_at?: string | null
          last_name: string
          notes_admin?: string | null
          phone?: string | null
          practice_profile_id: string
          status?: string | null
          tax_code?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_contacted_at?: string | null
          last_name?: string
          notes_admin?: string | null
          phone?: string | null
          practice_profile_id?: string
          status?: string | null
          tax_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_practice_profile_id_fkey"
            columns: ["practice_profile_id"]
            isOneToOne: false
            referencedRelation: "practice_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number | null
          bank_reference: string | null
          created_at: string | null
          id: string
          invoice_id: string
          method: string | null
          notes: string | null
          patient_id: string
          payment_date: string | null
          status: string | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          bank_reference?: string | null
          created_at?: string | null
          id?: string
          invoice_id: string
          method?: string | null
          notes?: string | null
          patient_id: string
          payment_date?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          bank_reference?: string | null
          created_at?: string | null
          id?: string
          invoice_id?: string
          method?: string | null
          notes?: string | null
          patient_id?: string
          payment_date?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_profiles: {
        Row: {
          created_at: string | null
          default_session_duration: number | null
          default_session_price: number | null
          id: string
          invoice_next_number: number | null
          invoice_prefix: string | null
          notification_preferences: Json | null
          practice_name: string | null
          professional_name: string | null
          tax_code: string | null
          updated_at: string | null
          user_id: string
          vat_number: string | null
        }
        Insert: {
          created_at?: string | null
          default_session_duration?: number | null
          default_session_price?: number | null
          id?: string
          invoice_next_number?: number | null
          invoice_prefix?: string | null
          notification_preferences?: Json | null
          practice_name?: string | null
          professional_name?: string | null
          tax_code?: string | null
          updated_at?: string | null
          user_id: string
          vat_number?: string | null
        }
        Update: {
          created_at?: string | null
          default_session_duration?: number | null
          default_session_price?: number | null
          id?: string
          invoice_next_number?: number | null
          invoice_prefix?: string | null
          notification_preferences?: Json | null
          practice_name?: string | null
          professional_name?: string | null
          tax_code?: string | null
          updated_at?: string | null
          user_id?: string
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      product_feedbacks: {
        Row: {
          category: string | null
          created_at: string | null
          feedback_type: string
          flow_context: string | null
          id: string
          message: string | null
          practice_profile_id: string | null
          rating: number | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          feedback_type: string
          flow_context?: string | null
          id?: string
          message?: string | null
          practice_profile_id?: string | null
          rating?: number | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          feedback_type?: string
          flow_context?: string | null
          id?: string
          message?: string | null
          practice_profile_id?: string | null
          rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_feedbacks_practice_profile_id_fkey"
            columns: ["practice_profile_id"]
            isOneToOne: false
            referencedRelation: "practice_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          appointment_id: string | null
          channel: string | null
          created_at: string | null
          id: string
          invoice_id: string | null
          patient_id: string | null
          practice_profile_id: string
          reminder_type: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          channel?: string | null
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          patient_id?: string | null
          practice_profile_id: string
          reminder_type?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          channel?: string | null
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          patient_id?: string | null
          practice_profile_id?: string
          reminder_type?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_practice_profile_id_fkey"
            columns: ["practice_profile_id"]
            isOneToOne: false
            referencedRelation: "practice_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_records: {
        Row: {
          admin_notes: string | null
          amount: number | null
          appointment_id: string
          closed_at: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          invoice_id: string | null
          patient_id: string
          practice_profile_id: string
          service_date: string | null
          service_type: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount?: number | null
          appointment_id: string
          closed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          invoice_id?: string | null
          patient_id: string
          practice_profile_id: string
          service_date?: string | null
          service_type?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number | null
          appointment_id?: string
          closed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          invoice_id?: string | null
          patient_id?: string
          practice_profile_id?: string
          service_date?: string | null
          service_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_records_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_records_practice_profile_id_fkey"
            columns: ["practice_profile_id"]
            isOneToOne: false
            referencedRelation: "practice_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_at: string | null
          id: string
          patient_id: string | null
          practice_profile_id: string
          priority: string | null
          source_id: string | null
          source_type: string | null
          status: string | null
          task_type: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          patient_id?: string | null
          practice_profile_id: string
          priority?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          task_type?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          patient_id?: string | null
          practice_profile_id?: string
          priority?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          task_type?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_practice_profile_id_fkey"
            columns: ["practice_profile_id"]
            isOneToOne: false
            referencedRelation: "practice_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          trial_end_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_end_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_end_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_owns_practice_profile: {
        Args: { profile_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
