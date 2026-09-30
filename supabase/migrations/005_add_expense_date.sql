-- ==============================================================================
-- GRN Construction Mobile App - Migration 005
-- Description: Direct rename of legacy 'date' to 'expense_date' with constraints
-- ==============================================================================

-- 1. Direct column rename from 'date' to 'expense_date'
ALTER TABLE public.expenses RENAME COLUMN "date" TO expense_date;

-- 2. Backfill existing records if any
UPDATE public.expenses
SET expense_date = COALESCE(DATE(created_at), CURRENT_DATE)
WHERE expense_date IS NULL;

-- 3. Set default and apply NOT NULL constraint
ALTER TABLE public.expenses 
  ALTER COLUMN expense_date SET DEFAULT CURRENT_DATE,
  ALTER COLUMN expense_date SET NOT NULL;

-- 4. Ensure reference column exists
ALTER TABLE public.expenses 
  ADD COLUMN IF NOT EXISTS reference TEXT;

-- 5. Indexes for fast date range filtering and site sorting
DROP INDEX IF EXISTS public.idx_expenses_date;
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_site_id_date ON public.expenses(site_id, expense_date DESC);

-- 6. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
