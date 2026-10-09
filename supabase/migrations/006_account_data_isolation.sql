-- ==============================================================================
-- GRN Construction Mobile App - Account Data Isolation Migration
-- Migration: 006_account_data_isolation.sql
-- Description: Enforces strict tenant data isolation per authenticated user.
-- ==============================================================================

-- 1. ADD owner_id TO ALL BUSINESS TABLES

ALTER TABLE public.sites 
ADD COLUMN IF NOT EXISTS owner_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);

ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS owner_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);

ALTER TABLE public.workers 
ADD COLUMN IF NOT EXISTS owner_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);

ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS owner_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);

ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS owner_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);

ALTER TABLE public.payroll_records 
ADD COLUMN IF NOT EXISTS owner_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);

-- Note: We are using DEFAULT auth.uid() so that legacy records might remain with NULL owner_id (if added without default, but here DEFAULT auth.uid() will populate for NEW rows, existing rows will be NULL).
-- We DO NOT attempt to blindly guess ownership of existing records.

-- 2. ADD INDEXES FOR PERFORMANCE AND DATA ISOLATION

CREATE INDEX IF NOT EXISTS idx_sites_owner_id ON public.sites(owner_id);
CREATE INDEX IF NOT EXISTS idx_materials_owner_id ON public.materials(owner_id);
CREATE INDEX IF NOT EXISTS idx_workers_owner_id ON public.workers(owner_id);
CREATE INDEX IF NOT EXISTS idx_attendance_owner_id ON public.attendance(owner_id);
CREATE INDEX IF NOT EXISTS idx_expenses_owner_id ON public.expenses(owner_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_owner_id ON public.payroll_records(owner_id);

-- 3. UPDATE RLS POLICIES FOR SITES

DROP POLICY IF EXISTS "Authenticated users can view sites" ON public.sites;
CREATE POLICY "Authenticated users can view sites" ON public.sites
  FOR SELECT TO authenticated USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert sites" ON public.sites;
CREATE POLICY "Authenticated users can insert sites" ON public.sites
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can update sites" ON public.sites;
CREATE POLICY "Authenticated users can update sites" ON public.sites
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can delete sites" ON public.sites;
CREATE POLICY "Authenticated users can delete sites" ON public.sites
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- 4. UPDATE RLS POLICIES FOR MATERIALS

DROP POLICY IF EXISTS "Authenticated users can view materials" ON public.materials;
CREATE POLICY "Authenticated users can view materials" ON public.materials
  FOR SELECT TO authenticated USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert materials" ON public.materials;
CREATE POLICY "Authenticated users can insert materials" ON public.materials
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.sites WHERE id = site_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update materials" ON public.materials;
CREATE POLICY "Authenticated users can update materials" ON public.materials
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.sites WHERE id = site_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can delete materials" ON public.materials;
CREATE POLICY "Authenticated users can delete materials" ON public.materials
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- 5. UPDATE RLS POLICIES FOR WORKERS

DROP POLICY IF EXISTS "Authenticated users can view workers" ON public.workers;
CREATE POLICY "Authenticated users can view workers" ON public.workers
  FOR SELECT TO authenticated USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert workers" ON public.workers;
CREATE POLICY "Authenticated users can insert workers" ON public.workers
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.sites WHERE id = site_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update workers" ON public.workers;
CREATE POLICY "Authenticated users can update workers" ON public.workers
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.sites WHERE id = site_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can delete workers" ON public.workers;
CREATE POLICY "Authenticated users can delete workers" ON public.workers
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- 6. UPDATE RLS POLICIES FOR ATTENDANCE

DROP POLICY IF EXISTS "Authenticated users can view attendance" ON public.attendance;
CREATE POLICY "Authenticated users can view attendance" ON public.attendance
  FOR SELECT TO authenticated USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert attendance" ON public.attendance;
CREATE POLICY "Authenticated users can insert attendance" ON public.attendance
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.sites WHERE id = site_id AND owner_id = auth.uid()) AND EXISTS (SELECT 1 FROM public.workers WHERE id = worker_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update attendance" ON public.attendance;
CREATE POLICY "Authenticated users can update attendance" ON public.attendance
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.sites WHERE id = site_id AND owner_id = auth.uid()) AND EXISTS (SELECT 1 FROM public.workers WHERE id = worker_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can delete attendance" ON public.attendance;
CREATE POLICY "Authenticated users can delete attendance" ON public.attendance
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- 7. UPDATE RLS POLICIES FOR EXPENSES

DROP POLICY IF EXISTS "Authenticated users can view expenses" ON public.expenses;
CREATE POLICY "Authenticated users can view expenses" ON public.expenses
  FOR SELECT TO authenticated USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON public.expenses;
CREATE POLICY "Authenticated users can insert expenses" ON public.expenses
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.sites WHERE id = site_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update expenses" ON public.expenses;
CREATE POLICY "Authenticated users can update expenses" ON public.expenses
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.sites WHERE id = site_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can delete expenses" ON public.expenses;
CREATE POLICY "Authenticated users can delete expenses" ON public.expenses
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- 8. UPDATE RLS POLICIES FOR PAYROLL_RECORDS

DROP POLICY IF EXISTS "Authenticated users can view payroll_records" ON public.payroll_records;
CREATE POLICY "Authenticated users can view payroll_records" ON public.payroll_records
  FOR SELECT TO authenticated USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert payroll_records" ON public.payroll_records;
CREATE POLICY "Authenticated users can insert payroll_records" ON public.payroll_records
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.sites WHERE id = site_id AND owner_id = auth.uid()) AND EXISTS (SELECT 1 FROM public.workers WHERE id = worker_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update payroll_records" ON public.payroll_records;
CREATE POLICY "Authenticated users can update payroll_records" ON public.payroll_records
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.sites WHERE id = site_id AND owner_id = auth.uid()) AND EXISTS (SELECT 1 FROM public.workers WHERE id = worker_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can delete payroll_records" ON public.payroll_records;
CREATE POLICY "Authenticated users can delete payroll_records" ON public.payroll_records
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

