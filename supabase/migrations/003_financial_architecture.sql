-- ==============================================================================
-- GRN Construction Mobile App - Migration 003
-- Description: Financial architecture (Budget, Payroll, Material Cost)
-- ==============================================================================

-- 1. Update Materials to include cost tracking
ALTER TABLE public.materials 
  ADD COLUMN IF NOT EXISTS unit_price numeric NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  ADD COLUMN IF NOT EXISTS total_cost numeric NOT NULL DEFAULT 0 CHECK (total_cost >= 0);

-- 2. Update Workers to include salary configuration
ALTER TABLE public.workers
  ADD COLUMN IF NOT EXISTS pay_frequency text NOT NULL DEFAULT 'Daily' CHECK (pay_frequency IN ('Daily', 'Weekly', 'Monthly')),
  ADD COLUMN IF NOT EXISTS salary_amount numeric NOT NULL DEFAULT 0 CHECK (salary_amount >= 0);

-- 3. Create payroll_records to snapshot labor costs and prevent historical rate changes
CREATE TABLE IF NOT EXISTS public.payroll_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE RESTRICT,
  pay_frequency text NOT NULL CHECK (pay_frequency IN ('Daily', 'Weekly', 'Monthly')),
  pay_period_start date NOT NULL,
  pay_period_end date NOT NULL,
  rate numeric NOT NULL CHECK (rate >= 0),
  days_present numeric NOT NULL DEFAULT 0 CHECK (days_present >= 0),
  half_days numeric NOT NULL DEFAULT 0 CHECK (half_days >= 0),
  days_absent numeric NOT NULL DEFAULT 0 CHECK (days_absent >= 0),
  gross_amount numeric NOT NULL CHECK (gross_amount >= 0),
  status text NOT NULL DEFAULT 'Paid' CHECK (status IN ('Paid', 'Pending')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_payroll_worker_period UNIQUE (worker_id, pay_period_start, pay_period_end)
);

-- 4. Triggers and Indexes for payroll_records
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payroll_records_updated_at ON public.payroll_records;
CREATE TRIGGER trg_payroll_records_updated_at
  BEFORE UPDATE ON public.payroll_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_payroll_records_site_id ON public.payroll_records(site_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_worker_id ON public.payroll_records(worker_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_period ON public.payroll_records(pay_period_start, pay_period_end);

-- 5. RLS for payroll_records
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view payroll_records" ON public.payroll_records;
CREATE POLICY "Authenticated users can view payroll_records"
  ON public.payroll_records FOR SELECT TO authenticated
  USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.sites WHERE sites.id = payroll_records.site_id));

DROP POLICY IF EXISTS "Authenticated users can insert payroll_records" ON public.payroll_records;
CREATE POLICY "Authenticated users can insert payroll_records"
  ON public.payroll_records FOR INSERT TO authenticated
  WITH CHECK (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.sites WHERE sites.id = payroll_records.site_id));

DROP POLICY IF EXISTS "Authenticated users can update payroll_records" ON public.payroll_records;
CREATE POLICY "Authenticated users can update payroll_records"
  ON public.payroll_records FOR UPDATE TO authenticated
  USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.sites WHERE sites.id = payroll_records.site_id))
  WITH CHECK (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.sites WHERE sites.id = payroll_records.site_id));

DROP POLICY IF EXISTS "Authenticated users can delete payroll_records" ON public.payroll_records;
CREATE POLICY "Authenticated users can delete payroll_records"
  ON public.payroll_records FOR DELETE TO authenticated
  USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.sites WHERE sites.id = payroll_records.site_id));
