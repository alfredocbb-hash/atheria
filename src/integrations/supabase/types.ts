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
      app_modules: {
        Row: {
          category: string
          created_at: string
          description: string | null
          is_active: boolean
          key: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          is_active?: boolean
          key: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          is_active?: boolean
          key?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          default_billing_day: number | null
          default_first_due_day: number | null
          default_interest_after_first: number | null
          default_interest_after_second: number | null
          default_second_due_day: number | null
          id: number
          platform_name: string | null
          privacy_url: string | null
          support_email: string | null
          support_phone: string | null
          support_whatsapp: string | null
          terms_url: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          default_billing_day?: number | null
          default_first_due_day?: number | null
          default_interest_after_first?: number | null
          default_interest_after_second?: number | null
          default_second_due_day?: number | null
          id?: number
          platform_name?: string | null
          privacy_url?: string | null
          support_email?: string | null
          support_phone?: string | null
          support_whatsapp?: string | null
          terms_url?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          default_billing_day?: number | null
          default_first_due_day?: number | null
          default_interest_after_first?: number | null
          default_interest_after_second?: number | null
          default_second_due_day?: number | null
          id?: number
          platform_name?: string | null
          privacy_url?: string | null
          support_email?: string | null
          support_phone?: string | null
          support_whatsapp?: string | null
          terms_url?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          tenant_id: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          tenant_id?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_comments: {
        Row: {
          author_id: string | null
          body: string
          claim_id: string
          created_at: string
          id: string
          is_internal: boolean
          tenant_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          claim_id: string
          created_at?: string
          id?: string
          is_internal?: boolean
          tenant_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          claim_id?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_comments_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_comments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string
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
          tenant_id: string
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
          tenant_id?: string
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
          {
            foreignKeyName: "claims_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_requests: {
        Row: {
          created_at: string
          email: string
          handled_at: string | null
          handled_by: string | null
          id: string
          message: string
          name: string
          organization: string
          phone: string | null
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          message: string
          name: string
          organization: string
          phone?: string | null
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          message?: string
          name?: string
          organization?: string
          phone?: string | null
          source?: string
        }
        Relationships: []
      }
      crews: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          specialty: Database["public"]["Enums"]["crew_specialty"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          specialty?: Database["public"]["Enums"]["crew_specialty"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          specialty?: Database["public"]["Enums"]["crew_specialty"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          tenant_id: string
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
          tenant_id: string
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
          tenant_id?: string
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
          {
            foreignKeyName: "invoice_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string
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
          tenant_id: string
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
          tenant_id?: string
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
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          apartment: string | null
          city: string | null
          created_at: string
          document_id: string | null
          email: string | null
          floor: string | null
          full_name: string
          id: string
          is_renter: boolean
          member_number: string
          notes: string | null
          phone: string | null
          service_types: string[]
          status: Database["public"]["Enums"]["member_status"]
          street: string | null
          street_number: string | null
          tenant_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          apartment?: string | null
          city?: string | null
          created_at?: string
          document_id?: string | null
          email?: string | null
          floor?: string | null
          full_name: string
          id?: string
          is_renter?: boolean
          member_number: string
          notes?: string | null
          phone?: string | null
          service_types?: string[]
          status?: Database["public"]["Enums"]["member_status"]
          street?: string | null
          street_number?: string | null
          tenant_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          apartment?: string | null
          city?: string | null
          created_at?: string
          document_id?: string | null
          email?: string | null
          floor?: string | null
          full_name?: string
          id?: string
          is_renter?: boolean
          member_number?: string
          notes?: string | null
          phone?: string | null
          service_types?: string[]
          status?: Database["public"]["Enums"]["member_status"]
          street?: string | null
          street_number?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          tenant_id: string
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
          tenant_id: string
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
          tenant_id?: string
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
          {
            foreignKeyName: "meter_readings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string
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
          tenant_id: string
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
          tenant_id?: string
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
          {
            foreignKeyName: "meters_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      module_role_permissions: {
        Row: {
          enabled: boolean
          module_key: string
          role: string
          role_scope: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          enabled?: boolean
          module_key: string
          role: string
          role_scope: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          enabled?: boolean
          module_key?: string
          role?: string
          role_scope?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_role_permissions_module_key_fkey"
            columns: ["module_key"]
            isOneToOne: false
            referencedRelation: "app_modules"
            referencedColumns: ["key"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          metadata: Json
          read_at: string | null
          tenant_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          link?: string | null
          metadata?: Json
          read_at?: string | null
          tenant_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          metadata?: Json
          read_at?: string | null
          tenant_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string
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
          tenant_id: string
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
          tenant_id?: string
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
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          code: string
          created_at: string
          currency: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          limits: Json
          mp_preapproval_plan_id: string | null
          name: string
          price_cents: number
          provider_price_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          mp_preapproval_plan_id?: string | null
          name: string
          price_cents?: number
          provider_price_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          mp_preapproval_plan_id?: string | null
          name?: string
          price_cents?: number
          provider_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
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
      subscription_events: {
        Row: {
          created_at: string
          id: string
          payload: Json
          provider: string
          provider_event_id: string
          tenant_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          provider?: string
          provider_event_id: string
          tenant_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          provider?: string
          provider_event_id?: string
          tenant_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
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
          tenant_id: string
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
          tenant_id: string
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
          tenant_id?: string
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
          {
            foreignKeyName: "supplies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string
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
          tenant_id: string
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
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supply_addresses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          tenant_id: string
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
          tenant_id: string
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
          tenant_id?: string
          unit_price?: number
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tariffs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_billing_credentials: {
        Row: {
          access_token: string | null
          preapproval_plan_id: string | null
          provider: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
          webhook_secret: string | null
        }
        Insert: {
          access_token?: string | null
          preapproval_plan_id?: string | null
          provider?: string
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
          webhook_secret?: string | null
        }
        Update: {
          access_token?: string | null
          preapproval_plan_id?: string | null
          provider?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_billing_credentials_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_module_role_permissions: {
        Row: {
          enabled: boolean
          module_key: string
          role: string
          role_scope: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          enabled: boolean
          module_key: string
          role: string
          role_scope: string
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          enabled?: boolean
          module_key?: string
          role?: string
          role_scope?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_module_role_permissions_module_key_fkey"
            columns: ["module_key"]
            isOneToOne: false
            referencedRelation: "app_modules"
            referencedColumns: ["key"]
          },
        ]
      }
      tenant_settings: {
        Row: {
          billing_day: number | null
          cesp_code: string | null
          created_at: string
          cuit: string | null
          email: string | null
          email_collections: string | null
          email_inquiries: string | null
          email_services: string | null
          first_due_day: number | null
          fiscal_address: string | null
          iibb: string | null
          interest_rate_after_first: number | null
          interest_rate_after_second: number | null
          legal_address: string | null
          legal_name: string | null
          phone_main: string | null
          phone_mobile: string | null
          second_due_day: number | null
          tenant_id: string
          trade_name: string | null
          updated_at: string
          updated_by: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          billing_day?: number | null
          cesp_code?: string | null
          created_at?: string
          cuit?: string | null
          email?: string | null
          email_collections?: string | null
          email_inquiries?: string | null
          email_services?: string | null
          first_due_day?: number | null
          fiscal_address?: string | null
          iibb?: string | null
          interest_rate_after_first?: number | null
          interest_rate_after_second?: number | null
          legal_address?: string | null
          legal_name?: string | null
          phone_main?: string | null
          phone_mobile?: string | null
          second_due_day?: number | null
          tenant_id: string
          trade_name?: string | null
          updated_at?: string
          updated_by?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          billing_day?: number | null
          cesp_code?: string | null
          created_at?: string
          cuit?: string | null
          email?: string | null
          email_collections?: string | null
          email_inquiries?: string | null
          email_services?: string | null
          first_due_day?: number | null
          fiscal_address?: string | null
          iibb?: string | null
          interest_rate_after_first?: number | null
          interest_rate_after_second?: number | null
          legal_address?: string | null
          legal_name?: string | null
          phone_main?: string | null
          phone_mobile?: string | null
          second_due_day?: number | null
          tenant_id?: string
          trade_name?: string | null
          updated_at?: string
          updated_by?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          billing_customer_id: string | null
          billing_provider: string
          billing_subscription_id: string | null
          created_at: string
          id: string
          name: string
          plan_id: string | null
          slug: string
          status: Database["public"]["Enums"]["tenant_status"]
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          billing_customer_id?: string | null
          billing_provider?: string
          billing_subscription_id?: string | null
          created_at?: string
          id?: string
          name: string
          plan_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["tenant_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          billing_customer_id?: string | null
          billing_provider?: string
          billing_subscription_id?: string | null
          created_at?: string
          id?: string
          name?: string
          plan_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["tenant_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
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
          tenant_id: string
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
          tenant_id: string
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
          tenant_id?: string
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
          {
            foreignKeyName: "work_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_module: {
        Args: { _module: string; _tenant: string; _user: string }
        Returns: boolean
      }
      current_tenant_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
      is_tenant_member: {
        Args: { _role?: string; _tenant: string }
        Returns: boolean
      }
      link_my_member: {
        Args: { _document_id: string; _member_number: string }
        Returns: string
      }
      log_audit: {
        Args: {
          _action: string
          _actor: string
          _entity_id: string
          _entity_type: string
          _metadata: Json
        }
        Returns: undefined
      }
      notify_member_user: {
        Args: {
          _body: string
          _kind: string
          _link: string
          _member_id: string
          _metadata: Json
          _title: string
        }
        Returns: undefined
      }
      notify_tenant_admins: {
        Args: {
          _body: string
          _kind: string
          _link: string
          _metadata?: Json
          _tenant: string
          _title: string
        }
        Returns: undefined
      }
      recompute_invoice_balance: {
        Args: { _invoice_id: string }
        Returns: undefined
      }
      set_acting_tenant: { Args: { _tid: string }; Returns: undefined }
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
      tenant_role: "admin" | "operador" | "user"
      tenant_status: "trial" | "active" | "past_due" | "suspended" | "cancelled"
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
      tenant_role: ["admin", "operador", "user"],
      tenant_status: ["trial", "active", "past_due", "suspended", "cancelled"],
      work_order_status: ["scheduled", "in_progress", "completed", "cancelled"],
    },
  },
} as const
