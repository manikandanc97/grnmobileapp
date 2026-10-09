-- ==============================================================================
-- GRN Construction Mobile App - Migration 009
-- Description: Site Cash Book module
-- Table: site_cash_transactions
-- Each transaction belongs to a site AND an authenticated owner.
-- Cash On Hand is always computed from the ledger — never stored.
-- ==============================================================================

-- 1. CREATE THE CASH TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.site_cash_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE RESTRICT,
  transaction_type text NOT NULL CHECK (transaction_type IN ('INWARD', 'OUTWARD')),
  transaction_date date NOT NULL,
  particulars text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. UPDATED_AT TRIGGER
DROP TRIGGER IF EXISTS trg_site_cash_transactions_updated_at ON public.site_cash_transactions;
CREATE TRIGGER trg_site_cash_transactions_updated_at
  BEFORE UPDATE ON public.site_cash_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. PERFORMANCE INDEXES
-- Primary lookup: all transactions for an account's site ordered by date
CREATE INDEX IF NOT EXISTS idx_cash_txn_owner_site_date
  ON public.site_cash_transactions(owner_id, site_id, transaction_date DESC);

-- Lookup for balance-at-date queries
CREATE INDEX IF NOT EXISTS idx_cash_txn_site_date
  ON public.site_cash_transactions(site_id, transaction_date);

-- Lookup by type within a site
CREATE INDEX IF NOT EXISTS idx_cash_txn_site_type
  ON public.site_cash_transactions(site_id, transaction_type);

-- Full-text particulars search (owner scoped)
CREATE INDEX IF NOT EXISTS idx_cash_txn_owner_particulars
  ON public.site_cash_transactions(owner_id, particulars text_pattern_ops);

-- 4. ROW LEVEL SECURITY
ALTER TABLE public.site_cash_transactions ENABLE ROW LEVEL SECURITY;

-- SELECT: owner must match AND site must belong to same owner
DROP POLICY IF EXISTS "Users can view own cash transactions" ON public.site_cash_transactions;
CREATE POLICY "Users can view own cash transactions"
  ON public.site_cash_transactions
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
  );

-- INSERT: enforce owner_id from auth, and verify site belongs to same owner
DROP POLICY IF EXISTS "Users can insert own cash transactions" ON public.site_cash_transactions;
CREATE POLICY "Users can insert own cash transactions"
  ON public.site_cash_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.sites
      WHERE id = site_id
        AND owner_id = auth.uid()
    )
  );

-- UPDATE: owner must match; also verify site still belongs to owner
DROP POLICY IF EXISTS "Users can update own cash transactions" ON public.site_cash_transactions;
CREATE POLICY "Users can update own cash transactions"
  ON public.site_cash_transactions
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.sites
      WHERE id = site_id
        AND owner_id = auth.uid()
    )
  );

-- DELETE: owner must match
DROP POLICY IF EXISTS "Users can delete own cash transactions" ON public.site_cash_transactions;
CREATE POLICY "Users can delete own cash transactions"
  ON public.site_cash_transactions
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());
