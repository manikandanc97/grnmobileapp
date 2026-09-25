-- ==============================================================================
-- GRN Construction Mobile App - Migration 002
-- Description: Adds a safety CHECK constraint to the materials table to prevent 
-- 'used' inventory from exceeding the total sum of initial 'quantity' and 'received'.
-- ==============================================================================

-- Safely add the check constraint to ensure inventory correctness
ALTER TABLE public.materials 
  ADD CONSTRAINT chk_materials_used_validity 
  CHECK (used <= quantity + received);
