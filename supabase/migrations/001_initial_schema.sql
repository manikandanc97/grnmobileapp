-- ==============================================================================
-- GRN Construction Mobile App - Initial Database Schema Migration
-- Migration: 001_initial_schema.sql
-- Description: Establishes core database schema for GRN Construction App
-- Tables: profiles, sites, materials, workers, attendance, expenses, notifications
-- Idempotent, deterministic, and safe (no destructive DROP TABLE statements)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. REUSABLE UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 3. CORE TABLES

-- ------------------------------------------------------------------------------
-- Table 1: profiles
-- Maps 1:1 with auth.users to store profile metadata without sensitive tokens
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- Table 2: sites
-- Central entity representing construction project sites
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  type text NOT NULL CHECK (type IN ('Residential', 'Commercial', 'Renovation', 'Other')),
  progress numeric NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status text NOT NULL DEFAULT 'In Progress' CHECK (status IN ('On Track', 'In Progress', 'Finishing', 'Delayed', 'Completed', 'On Hold')),
  start_date date,
  expected_completion date,
  budget numeric CHECK (budget IS NULL OR budget >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ------------------------------------------------------------------------------
-- Table 3: materials
-- Site-specific materials inventory and tracking
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE RESTRICT,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Cement', 'Sand', 'Bricks', 'Steel', 'Other')),
  quantity numeric NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit text NOT NULL CHECK (unit IN ('Bags', 'Loads', 'Nos', 'Tons', 'Kg', 'Litres', 'Units')),
  status text NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Low Stock', 'Pending', 'Out of Stock')),
  used numeric NOT NULL DEFAULT 0 CHECK (used >= 0),
  received numeric NOT NULL DEFAULT 0 CHECK (received >= 0),
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ------------------------------------------------------------------------------
-- Table 4: workers
-- Workers assigned to construction sites
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE RESTRICT,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('Mason', 'Painter', 'Electrician', 'Plumber', 'Carpenter', 'Supervisor', 'Laborer', 'Other')),
  phone text,
  joining_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ------------------------------------------------------------------------------
-- Table 5: attendance
-- Daily attendance records for workers at sites
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'Not Marked' CHECK (status IN ('Present', 'Absent', 'Not Marked', 'Half Day')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_attendance_worker_date UNIQUE (worker_id, date)
);

-- ------------------------------------------------------------------------------
-- Table 6: expenses
-- Site financial expenses and payment tracking
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE RESTRICT,
  title text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  category text NOT NULL CHECK (category IN ('Materials', 'Labor', 'Transport', 'Equipment', 'Other')),
  date date NOT NULL DEFAULT CURRENT_DATE,
  vendor text,
  payment_method text NOT NULL DEFAULT 'Cash' CHECK (payment_method IN ('Cash', 'UPI', 'Bank Transfer', 'Card', 'Cheque')),
  payment_status text NOT NULL DEFAULT 'Paid' CHECK (payment_status IN ('Paid', 'Pending')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ------------------------------------------------------------------------------
-- Table 7: notifications
-- In-app notifications directed to a specific user or broadcast to all
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('material', 'attendance', 'expense', 'system', 'progress')),
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. AUTOMATIC UPDATED_AT TRIGGERS
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_sites_updated_at ON public.sites;
CREATE TRIGGER trg_sites_updated_at
  BEFORE UPDATE ON public.sites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_materials_updated_at ON public.materials;
CREATE TRIGGER trg_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_workers_updated_at ON public.workers;
CREATE TRIGGER trg_workers_updated_at
  BEFORE UPDATE ON public.workers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_attendance_updated_at ON public.attendance;
CREATE TRIGGER trg_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_expenses_updated_at ON public.expenses;
CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. AUTH PROFILE CREATION HOOK
-- Safely inserts a corresponding profile when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email
    ),
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. INDEXES FOR PERFORMANCE
-- Sites
CREATE INDEX IF NOT EXISTS idx_sites_deleted_at ON public.sites(deleted_at);
CREATE INDEX IF NOT EXISTS idx_sites_created_at ON public.sites(created_at DESC);

-- Materials
CREATE INDEX IF NOT EXISTS idx_materials_site_id ON public.materials(site_id);
CREATE INDEX IF NOT EXISTS idx_materials_deleted_at ON public.materials(deleted_at);
CREATE INDEX IF NOT EXISTS idx_materials_status ON public.materials(status);

-- Workers
CREATE INDEX IF NOT EXISTS idx_workers_site_id ON public.workers(site_id);
CREATE INDEX IF NOT EXISTS idx_workers_deleted_at ON public.workers(deleted_at);

-- Attendance
CREATE INDEX IF NOT EXISTS idx_attendance_worker_date ON public.attendance(worker_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_site_id_date ON public.attendance(site_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);

-- Expenses
CREATE INDEX IF NOT EXISTS idx_expenses_site_id ON public.expenses(site_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON public.expenses(deleted_at);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS across all application tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS: profiles
-- Authenticated members can view other team members; each can update only their own
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- RLS: sites
-- Authenticated team members can manage site records
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view sites" ON public.sites;
CREATE POLICY "Authenticated users can view sites"
  ON public.sites
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert sites" ON public.sites;
CREATE POLICY "Authenticated users can insert sites"
  ON public.sites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update sites" ON public.sites;
CREATE POLICY "Authenticated users can update sites"
  ON public.sites
  FOR UPDATE
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete sites" ON public.sites;
CREATE POLICY "Authenticated users can delete sites"
  ON public.sites
  FOR DELETE
  TO authenticated
  USING (auth.role() = 'authenticated');

-- ------------------------------------------------------------------------------
-- RLS: materials
-- Authenticated members can manage site materials for valid sites
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view materials" ON public.materials;
CREATE POLICY "Authenticated users can view materials"
  ON public.materials
  FOR SELECT
  TO authenticated
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.sites WHERE sites.id = materials.site_id)
  );

DROP POLICY IF EXISTS "Authenticated users can insert materials" ON public.materials;
CREATE POLICY "Authenticated users can insert materials"
  ON public.materials
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.sites WHERE sites.id = materials.site_id)
  );

DROP POLICY IF EXISTS "Authenticated users can update materials" ON public.materials;
CREATE POLICY "Authenticated users can update materials"
  ON public.materials
  FOR UPDATE
  TO authenticated
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.sites WHERE sites.id = materials.site_id)
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.sites WHERE sites.id = materials.site_id)
  );

DROP POLICY IF EXISTS "Authenticated users can delete materials" ON public.materials;
CREATE POLICY "Authenticated users can delete materials"
  ON public.materials
  FOR DELETE
  TO authenticated
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.sites WHERE sites.id = materials.site_id)
  );

-- ------------------------------------------------------------------------------
-- RLS: workers
-- Authenticated members can manage workers attached to sites
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view workers" ON public.workers;
CREATE POLICY "Authenticated users can view workers"
  ON public.workers
  FOR SELECT
  TO authenticated
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.sites WHERE sites.id = workers.site_id)
  );

DROP POLICY IF EXISTS "Authenticated users can insert workers" ON public.workers;
CREATE POLICY "Authenticated users can insert workers"
  ON public.workers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.sites WHERE sites.id = workers.site_id)
  );

DROP POLICY IF EXISTS "Authenticated users can update workers" ON public.workers;
CREATE POLICY "Authenticated users can update workers"
  ON public.workers
  FOR UPDATE
  TO authenticated
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.sites WHERE sites.id = workers.site_id)
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.sites WHERE sites.id = workers.site_id)
  );

DROP POLICY IF EXISTS "Authenticated users can delete workers" ON public.workers;
CREATE POLICY "Authenticated users can delete workers"
  ON public.workers
  FOR DELETE
  TO authenticated
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.sites WHERE sites.id = workers.site_id)
  );

-- ------------------------------------------------------------------------------
-- RLS: attendance
-- Authenticated members can manage attendance for workers and sites
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view attendance" ON public.attendance;
CREATE POLICY "Authenticated users can view attendance"
  ON public.attendance
  FOR SELECT
  TO authenticated
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.sites WHERE sites.id = attendance.site_id) AND
    EXISTS (SELECT 1 FROM public.workers WHERE workers.id = attendance.worker_id)
  );

DROP POLICY IF EXISTS "Authenticated users can insert attendance" ON public.attendance;
CREATE POLICY "Authenticated users can insert attendance"
  ON public.attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.sites WHERE sites.id = attendance.site_id) AND
    EXISTS (SELECT 1 FROM public.workers WHERE workers.id = attendance.worker_id)
  );

DROP POLICY IF EXISTS "Authenticated users can update attendance" ON public.attendance;
CREATE POLICY "Authenticated users can update attendance"
  ON public.attendance
  FOR UPDATE
  TO authenticated
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.sites WHERE sites.id = attendance.site_id) AND
    EXISTS (SELECT 1 FROM public.workers WHERE workers.id = attendance.worker_id)
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.sites WHERE sites.id = attendance.site_id) AND
    EXISTS (SELECT 1 FROM public.workers WHERE workers.id = attendance.worker_id)
  );

DROP POLICY IF EXISTS "Authenticated users can delete attendance" ON public.attendance;
CREATE POLICY "Authenticated users can delete attendance"
  ON public.attendance
  FOR DELETE
  TO authenticated
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.sites WHERE sites.id = attendance.site_id) AND
    EXISTS (SELECT 1 FROM public.workers WHERE workers.id = attendance.worker_id)
  );

-- ------------------------------------------------------------------------------
-- RLS: expenses
-- Authenticated members can manage site expenses
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view expenses" ON public.expenses;
CREATE POLICY "Authenticated users can view expenses"
  ON public.expenses
  FOR SELECT
  TO authenticated
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.sites WHERE sites.id = expenses.site_id)
  );

DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON public.expenses;
CREATE POLICY "Authenticated users can insert expenses"
  ON public.expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.sites WHERE sites.id = expenses.site_id)
  );

DROP POLICY IF EXISTS "Authenticated users can update expenses" ON public.expenses;
CREATE POLICY "Authenticated users can update expenses"
  ON public.expenses
  FOR UPDATE
  TO authenticated
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.sites WHERE sites.id = expenses.site_id)
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.sites WHERE sites.id = expenses.site_id)
  );

DROP POLICY IF EXISTS "Authenticated users can delete expenses" ON public.expenses;
CREATE POLICY "Authenticated users can delete expenses"
  ON public.expenses
  FOR DELETE
  TO authenticated
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.sites WHERE sites.id = expenses.site_id)
  );

-- ------------------------------------------------------------------------------
-- RLS: notifications
-- Users can view their direct notifications or broadcasts; mark their own as read
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own or broadcast notifications" ON public.notifications;
CREATE POLICY "Users can view own or broadcast notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    auth.role() = 'authenticated' AND
    (user_id = auth.uid() OR user_id IS NULL)
  );

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (
    auth.role() = 'authenticated' AND
    (user_id = auth.uid() OR user_id IS NULL)
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND
    (user_id = auth.uid() OR user_id IS NULL)
  );

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');
