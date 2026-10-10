export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sites: {
        Row: {
          id: string;
          name: string;
          location: string;
          type: 'Residential' | 'Commercial' | 'Renovation' | 'Other';
          progress: number;
          status: 'On Track' | 'In Progress' | 'Finishing' | 'Delayed' | 'Completed' | 'On Hold';
          start_date: string | null;
          expected_completion: string | null;
          budget: number | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
                  owner_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          location: string;
          type: 'Residential' | 'Commercial' | 'Renovation' | 'Other';
          progress?: number;
          status?: 'On Track' | 'In Progress' | 'Finishing' | 'Delayed' | 'Completed' | 'On Hold';
          start_date?: string | null;
          expected_completion?: string | null;
          budget?: number | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
                  owner_id?: string;
        };
        Update: {
          id?: string;
          name?: string;
          location?: string;
          type?: 'Residential' | 'Commercial' | 'Renovation' | 'Other';
          progress?: number;
          status?: 'On Track' | 'In Progress' | 'Finishing' | 'Delayed' | 'Completed' | 'On Hold';
          start_date?: string | null;
          expected_completion?: string | null;
          budget?: number | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
                  owner_id?: string;
        };
        Relationships: [];
      };
      materials: {
        Row: {
          id: string;
          site_id: string;
          name: string;
          category: string;
          quantity: number;
          unit: string;
          status: 'Available' | 'Low Stock' | 'Pending' | 'Out of Stock';
          used: number;
          received: number;
          unit_price: number;
          total_cost: number;
          last_updated: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
                  owner_id: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          name: string;
          category: string;
          quantity?: number;
          unit: string;
          status?: 'Available' | 'Low Stock' | 'Pending' | 'Out of Stock';
          used?: number;
          received?: number;
          unit_price?: number;
          total_cost?: number;
          last_updated?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
                  owner_id?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          name?: string;
          category?: string;
          quantity?: number;
          unit?: string;
          status?: 'Available' | 'Low Stock' | 'Pending' | 'Out of Stock';
          used?: number;
          received?: number;
          unit_price?: number;
          total_cost?: number;
          last_updated?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
                  owner_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'materials_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          }
        ];
      };
      workers: {
        Row: {
          id: string;
          site_id: string;
          name: string;
          role: 'Mason' | 'Painter' | 'Electrician' | 'Plumber' | 'Carpenter' | 'Supervisor' | 'Laborer' | 'Other';
          phone: string | null;
          joining_date: string | null;
          pay_frequency: 'Daily' | 'Weekly' | 'Monthly';
          salary_amount: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
                  owner_id: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          name: string;
          role: 'Mason' | 'Painter' | 'Electrician' | 'Plumber' | 'Carpenter' | 'Supervisor' | 'Laborer' | 'Other';
          phone?: string | null;
          joining_date?: string | null;
          pay_frequency?: 'Daily' | 'Weekly' | 'Monthly';
          salary_amount?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
                  owner_id?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          name?: string;
          role?: 'Mason' | 'Painter' | 'Electrician' | 'Plumber' | 'Carpenter' | 'Supervisor' | 'Laborer' | 'Other';
          phone?: string | null;
          joining_date?: string | null;
          pay_frequency?: 'Daily' | 'Weekly' | 'Monthly';
          salary_amount?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
                  owner_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workers_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          }
        ];
      };
      attendance: {
        Row: {
          id: string;
          worker_id: string;
          site_id: string;
          date: string;
          status: 'Present' | 'Absent' | 'Not Marked' | 'Half Day';
          created_at: string;
          updated_at: string;
                  owner_id: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          site_id: string;
          date?: string;
          status?: 'Present' | 'Absent' | 'Not Marked' | 'Half Day';
          created_at?: string;
          updated_at?: string;
                  owner_id?: string;
        };
        Update: {
          id?: string;
          worker_id?: string;
          site_id?: string;
          date?: string;
          status?: 'Present' | 'Absent' | 'Not Marked' | 'Half Day';
          created_at?: string;
          updated_at?: string;
                  owner_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'attendance_worker_id_fkey';
            columns: ['worker_id'];
            isOneToOne: false;
            referencedRelation: 'workers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'attendance_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          }
        ];
      };
      payroll_records: {
        Row: {
          id: string;
          worker_id: string;
          site_id: string;
          pay_frequency: 'Daily' | 'Weekly' | 'Monthly';
          pay_period_start: string;
          pay_period_end: string;
          rate: number;
          days_present: number;
          half_days: number;
          days_absent: number;
          gross_amount: number;
          status: 'Paid' | 'Pending';
          created_at: string;
          updated_at: string;
                  owner_id: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          site_id: string;
          pay_frequency: 'Daily' | 'Weekly' | 'Monthly';
          pay_period_start: string;
          pay_period_end: string;
          rate: number;
          days_present?: number;
          half_days?: number;
          days_absent?: number;
          gross_amount: number;
          status?: 'Paid' | 'Pending';
          created_at?: string;
          updated_at?: string;
                  owner_id?: string;
        };
        Update: {
          id?: string;
          worker_id?: string;
          site_id?: string;
          pay_frequency?: 'Daily' | 'Weekly' | 'Monthly';
          pay_period_start?: string;
          pay_period_end?: string;
          rate?: number;
          days_present?: number;
          half_days?: number;
          days_absent?: number;
          gross_amount?: number;
          status?: 'Paid' | 'Pending';
          created_at?: string;
          updated_at?: string;
                  owner_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payroll_records_worker_id_fkey';
            columns: ['worker_id'];
            isOneToOne: false;
            referencedRelation: 'workers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payroll_records_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          }
        ];
      };
      expenses: {
        Row: {
          id: string;
          site_id: string;
          title: string;
          amount: number;
          category: string;
          expense_date: string;
          vendor: string | null;
          payment_method: string;
          payment_status: string;
          reference: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
                  owner_id: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          title: string;
          amount: number;
          category: string;
          expense_date: string;
          vendor?: string | null;
          payment_method?: string;
          payment_status?: string;
          reference?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
                  owner_id?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          title?: string;
          amount?: number;
          category?: string;
          expense_date?: string;
          vendor?: string | null;
          payment_method?: string;
          payment_status?: string;
          reference?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
                  owner_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'expenses_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          site_id: string | null;
          title: string;
          message: string;
          type: 'material' | 'attendance' | 'expense' | 'system' | 'progress';
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          site_id?: string | null;
          title: string;
          message: string;
          type: 'material' | 'attendance' | 'expense' | 'system' | 'progress';
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          site_id?: string | null;
          title?: string;
          message?: string;
          type?: 'material' | 'attendance' | 'expense' | 'system' | 'progress';
          read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          }
        ];
      };
      site_labor_daily: {
        Row: {
          id: string;
          owner_id: string;
          site_id: string;
          work_date: string;
          mason_count: number;
          mason_rate: number;
          men_helper_count: number;
          men_helper_rate: number;
          women_helper_count: number;
          women_helper_rate: number;
          painter_count?: number;
          painter_rate?: number;
          carpenter_count?: number;
          carpenter_rate?: number;
          plumber_count?: number;
          plumber_rate?: number;
          electrician_count?: number;
          electrician_rate?: number;
          bar_bender_count?: number;
          bar_bender_rate?: number;
          welder_count?: number;
          welder_rate?: number;
          flooring_count?: number;
          flooring_rate?: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          site_id: string;
          work_date: string;
          mason_count?: number;
          mason_rate?: number;
          men_helper_count?: number;
          men_helper_rate?: number;
          women_helper_count?: number;
          women_helper_rate?: number;
          painter_count?: number;
          painter_rate?: number;
          carpenter_count?: number;
          carpenter_rate?: number;
          plumber_count?: number;
          plumber_rate?: number;
          electrician_count?: number;
          electrician_rate?: number;
          bar_bender_count?: number;
          bar_bender_rate?: number;
          welder_count?: number;
          welder_rate?: number;
          flooring_count?: number;
          flooring_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          site_id?: string;
          work_date?: string;
          mason_count?: number;
          mason_rate?: number;
          men_helper_count?: number;
          men_helper_rate?: number;
          women_helper_count?: number;
          women_helper_rate?: number;
          painter_count?: number;
          painter_rate?: number;
          carpenter_count?: number;
          carpenter_rate?: number;
          plumber_count?: number;
          plumber_rate?: number;
          electrician_count?: number;
          electrician_rate?: number;
          bar_bender_count?: number;
          bar_bender_rate?: number;
          welder_count?: number;
          welder_rate?: number;
          flooring_count?: number;
          flooring_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'site_labor_daily_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          }
        ];
      };
      site_cash_transactions: {
        Row: {
          id: string;
          owner_id: string;
          site_id: string;
          transaction_type: 'INWARD' | 'OUTWARD';
          transaction_date: string;
          particulars: string;
          amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          site_id: string;
          transaction_type: 'INWARD' | 'OUTWARD';
          transaction_date: string;
          particulars: string;
          amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          site_id?: string;
          transaction_type?: 'INWARD' | 'OUTWARD';
          transaction_date?: string;
          particulars?: string;
          amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'site_cash_transactions_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type ProfileRow = Tables<'profiles'>;
export type SiteRow = Tables<'sites'>;
export type MaterialRow = Tables<'materials'>;
export type WorkerRow = Tables<'workers'>;
export type AttendanceRow = Tables<'attendance'>;
export type PayrollRecordRow = Tables<'payroll_records'>;
export type ExpenseRow = Tables<'expenses'>;
export type NotificationRow = Tables<'notifications'>;
export type SiteLaborDailyRow = Tables<'site_labor_daily'>;
export type SiteCashTransactionRow = Tables<'site_cash_transactions'>;
