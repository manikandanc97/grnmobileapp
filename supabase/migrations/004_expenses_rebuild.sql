-- ==============================================================================
-- GRN Construction Mobile App - Migration 004
-- Description: Deep audit and rebuild of Expenses module
-- ==============================================================================

-- 1. Rename date to expense_date if it hasn't been renamed yet
DO $$
BEGIN
  IF EXISTS(SELECT *
    FROM information_schema.columns
    WHERE table_name='expenses' and column_name='date')
  THEN
      ALTER TABLE "public"."expenses" RENAME COLUMN "date" TO "expense_date";
  END IF;
END $$;

-- 2. Add reference column
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS reference text;

-- 3. Update existing mismatched categories to 'Miscellaneous'
UPDATE public.expenses 
SET category = 'Miscellaneous' 
WHERE category NOT IN (
    'Transport', 'Fuel', 'Vehicle', 'Equipment Rental', 'Machine Rental', 
    'Tools', 'Electricity', 'Water', 'Site Accommodation', 'Food / Refreshments', 
    'Travel', 'Loading / Unloading', 'Delivery Charges', 'Permit / Approval', 
    'Waste Removal', 'Repair / Maintenance', 'Safety Equipment', 'Communication', 
    'Office / Site Administration', 'Miscellaneous'
);

-- 4. Update category constraint
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_category_check;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_category_check CHECK (
  category IN (
    'Transport', 'Fuel', 'Vehicle', 'Equipment Rental', 'Machine Rental', 
    'Tools', 'Electricity', 'Water', 'Site Accommodation', 'Food / Refreshments', 
    'Travel', 'Loading / Unloading', 'Delivery Charges', 'Permit / Approval', 
    'Waste Removal', 'Repair / Maintenance', 'Safety Equipment', 'Communication', 
    'Office / Site Administration', 'Miscellaneous'
  )
);

-- 5. Indexes for scalability
CREATE INDEX IF NOT EXISTS idx_expenses_site_id ON public.expenses(site_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_status ON public.expenses(payment_status);
CREATE INDEX IF NOT EXISTS idx_expenses_site_id_date ON public.expenses(site_id, expense_date);
