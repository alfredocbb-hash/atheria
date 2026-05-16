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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      claim_comments: {
        Row: {
          author_id: string | null
          body: string
          claim_id: string
          created_at: string
          id: string
          is_internal: boolean
        }
        Insert: {
          author_id?: string | null
          body: string
          claim_id: string
          created_at?: string
          id?: string
          is_internal?: boolean
        }
        Update: {
          author_id?: string | null
          body?: string
          claim_id?: string
          created_at?: string
          id?: string
          is_internal?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "claim_comments_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          category: Database["public"]["Enums"]["claim_category"]
          claim_number: string
          created_at: string
          description: string | null
          id: string
          location: string | null
          member_id: string
          opened_by: string | null
          priority: Database["public"]["Enums"]["claim_priority"]
          resolved_at: string | null
          status: Database["public"]["Enums"]["claim_status"]
          supply_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["claim_category"]
          claim_number: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          member_id: string
          opened_by?: string | null
          priority?: Database["public"]["Enums"]["claim_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          supply_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["claim_category"]
          claim_number?: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          member_id?: string
          opened_by?: string | null
          priority?: Database["public"]["Enums"]["claim_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          supply_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "supplies"
            referencedColumns: ["id"]
          },
        ]
      }
      crews: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          specialty: Database["public"]["Enums"]["crew_specialty"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          specialty?: Database["public"]["Enums"]["crew_specialty"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          specialty?: Database["public"]["Enums"]["crew_specialty"]
          updated_at?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          invoice_id: string
          kind: Database["public"]["Enums"]["invoice_item_kind"]
          quantity: number
          unit_price: number
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          kind: Database["public"]["Enums"]["invoice_item_kind"]
          quantity?: number
          unit_price?: number
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          kind?: Database["public"]["Enums"]["invoice_item_kind"]
          quantity?: number
          unit_price?: number
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
          balance: number
          created_at: string
          currency: string
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          member_id: string
          notes: string | null
          period_end: string
          period_start: string
          reading_current_id: string | null
          reading_previous_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          supply_id: string
          tax_amount: number
          total: number
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          member_id: string
          notes?: string | null
          period_end: string
          period_start: string
          reading_current_id?: string | null
          reading_previous_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          supply_id: string
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          member_id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          reading_current_id?: string | null
          reading_previous_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          supply_id?: string
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_reading_current_id_fkey"
            columns: ["reading_current_id"]
            isOneToOne: false
            referencedRelation: "meter_readings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_reading_previous_id_fkey"
            columns: ["reading_previous_id"]
            isOneToOne: false
            referencedRelation: "meter_readings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "supplies"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          created_at: string
          document_id: string | null
          email: string | null
          full_name: string
          id: string
          member_number: string
          notes: string | null
          phone: string | null
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          email?: string | null
          full_name: string
          id?: string
          member_number: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string | null
          email?: string | null
          full_name?: string
          id?: string
          member_number?: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      meter_readings: {
        Row: {
          consumption: number | null
          created_at: string
          created_by: string | null
          id: string
          meter_id: string
          notes: string | null
          reading_date: string
          reading_value: number
          source: Database["public"]["Enums"]["reading_source"]
          updated_at: string
        }
        Insert: {
          consumption?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          meter_id: string
          notes?: string | null
          reading_date?: string
          reading_value: number
          source?: Database["public"]["Enums"]["reading_source"]
          updated_at?: string
        }
        Update: {
          consumption?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          meter_id?: string
          notes?: string | null
          reading_date?: string
          reading_value?: number
          source?: Database["public"]["Enums"]["reading_source"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meter_readings_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "meters"
            referencedColumns: ["id"]
          },
        ]
      }
      meters: {
        Row: {
          brand: string | null
          created_at: string
          id: string
          installed_at: string | null
          model: string | null
          notes: string | null
          serial_number: string
          status: Database["public"]["Enums"]["meter_status"]
          supply_id: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          id?: string
          installed_at?: string | null
          model?: string | null
          notes?: string | null
          serial_number: string
          status?: Database["public"]["Enums"]["meter_status"]
          supply_id: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          id?: string
          installed_at?: string | null
          model?: string | null
          notes?: string | null
          serial_number?: string
          status?: Database["public"]["Enums"]["meter_status"]
          supply_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meters_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "supplies"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          payment_date: string
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_date?: string
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_date?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          document_id: string | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      supplies: {
        Row: {
          activated_at: string | null
          address_id: string
          created_at: string
          id: string
          member_id: string
          service_type: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["supply_status"]
          supply_number: string
          tariff_category: string | null
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          address_id: string
          created_at?: string
          id?: string
          member_id: string
          service_type: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["supply_status"]
          supply_number: string
          tariff_category?: string | null
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          address_id?: string
          created_at?: string
          id?: string
          member_id?: string
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["supply_status"]
          supply_number?: string
          tariff_category?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplies_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "supply_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplies_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_addresses: {
        Row: {
          apartment: string | null
          city: string
          created_at: string
          floor: string | null
          id: string
          notes: string | null
          postal_code: string | null
          province: string
          street: string
          street_number: string | null
          updated_at: string
        }
        Insert: {
          apartment?: string | null
          city: string
          created_at?: string
          floor?: string | null
          id?: string
          notes?: string | null
          postal_code?: string | null
          province: string
          street: string
          street_number?: string | null
          updated_at?: string
        }
        Update: {
          apartment?: string | null
          city?: string
          created_at?: string
          floor?: string | null
          id?: string
          notes?: string | null
          postal_code?: string | null
          province?: string
          street?: string
          street_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tariffs: {
        Row: {
          category: string | null
          created_at: string
          currency: string
          fixed_charge: number
          id: string
          is_active: boolean
          name: string
          service_type: Database["public"]["Enums"]["service_type"]
          unit_price: number
          updated_at: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency?: string
          fixed_charge?: number
          id?: string
          is_active?: boolean
          name: string
          service_type: Database["public"]["Enums"]["service_type"]
          unit_price?: number
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          currency?: string
          fixed_charge?: number
          id?: string
          is_active?: boolean
          name?: string
          service_type?: Database["public"]["Enums"]["service_type"]
          unit_price?: number
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_orders: {
        Row: {
          claim_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          crew_id: string
          id: string
          notes: string | null
          scheduled_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["work_order_status"]
          updated_at: string
        }
        Insert: {
          claim_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          crew_id: string
          id?: string
          notes?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["work_order_status"]
          updated_at?: string
        }
        Update: {
          claim_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          crew_id?: string
          id?: string
          notes?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["work_order_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recompute_invoice_balance: {
        Args: { _invoice_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "operator" | "client"
      claim_category:
        | "water_outage"
        | "gas_outage"
        | "electricity_outage"
        | "leak"
        | "meter"
        | "billing"
        | "other"
      claim_priority: "low" | "medium" | "high" | "urgent"
      claim_status:
        | "open"
        | "assigned"
        | "in_progress"
        | "resolved"
        | "cancelled"
      crew_specialty: "water" | "gas" | "electricity" | "general"
      invoice_item_kind: "fixed_charge" | "consumption" | "tax" | "other"
      invoice_status: "draft" | "issued" | "paid" | "overdue" | "void"
      member_status: "active" | "inactive" | "suspended"
      meter_status: "active" | "removed" | "faulty"
      payment_method: "cash" | "transfer" | "card" | "debit" | "other"
      reading_source: "manual" | "estimated" | "remote"
      service_type: "water" | "gas" | "electricity"
      supply_status: "active" | "suspended" | "inactive" | "pending"
      work_order_status: "scheduled" | "in_progress" | "completed" | "cancelled"
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
    Enums: {
      app_role: ["admin", "operator", "client"],
      claim_category: [
        "water_outage",
        "gas_outage",
        "electricity_outage",
        "leak",
        "meter",
        "billing",
        "other",
      ],
      claim_priority: ["low", "medium", "high", "urgent"],
      claim_status: [
        "open",
        "assigned",
        "in_progress",
        "resolved",
        "cancelled",
      ],
      crew_specialty: ["water", "gas", "electricity", "general"],
      invoice_item_kind: ["fixed_charge", "consumption", "tax", "other"],
      invoice_status: ["draft", "issued", "paid", "overdue", "void"],
      member_status: ["active", "inactive", "suspended"],
      meter_status: ["active", "removed", "faulty"],
      payment_method: ["cash", "transfer", "card", "debit", "other"],
      reading_source: ["manual", "estimated", "remote"],
      service_type: ["water", "gas", "electricity"],
      supply_status: ["active", "suspended", "inactive", "pending"],
      work_order_status: ["scheduled", "in_progress", "completed", "cancelled"],
    },
  },
} as const
