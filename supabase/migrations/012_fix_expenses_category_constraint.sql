-- ==============================================================================
-- GRN Construction Mobile App - Migration 012
-- Description: Fix expenses_category_check constraint to accept modern construction categories
-- ==============================================================================

-- 1. Drop existing restrictive check constraint
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_category_check;

-- 2. Add comprehensive check constraint supporting all 20 categories + legacy fallbacks
ALTER TABLE public.expenses ADD CONSTRAINT expenses_category_check CHECK (
  category IN (
    'Transport', 'Fuel', 'Vehicle', 'Equipment Rental', 'Machine Rental', 
    'Tools', 'Electricity', 'Water', 'Site Accommodation', 'Food / Refreshments', 
    'Travel', 'Loading / Unloading', 'Delivery Charges', 'Permit / Approval', 
    'Waste Removal', 'Repair / Maintenance', 'Safety Equipment', 'Communication', 
    'Office / Site Administration', 'Miscellaneous',
    'Materials', 'Labor', 'Equipment', 'Other'
  )
);

-- 3. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
