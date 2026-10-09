# GRN Construction Mobile App - Account Data Isolation Audit

## 1. Current Vulnerability & Root Cause
The current Supabase schema relies entirely on the `authenticated` role for row-level security (RLS). The `sites`, `materials`, `workers`, `attendance`, `expenses`, and `payroll_records` tables lack any ownership linkage (`owner_id` or `user_id`). Their RLS policies use `USING (auth.role() = 'authenticated')`, which allows **any authenticated user to read, update, and delete any record in the database**, regardless of who created it. Furthermore, child relationships rely on the existence of a valid parent `site_id`, but because all sites are visible to all users, a malicious user could attach records to another user's site.

## 2. Tables Affected
- `sites`
- `materials`
- `workers`
- `attendance`
- `expenses`
- `payroll_records`

## 3. Existing RLS Problems
Existing RLS policies only verified that a user possessed a valid JWT token (`auth.role() = 'authenticated'`).
Child tables (like `materials`) also verified that the parent `site_id` existed, but this provided no tenant isolation because the parent site was universally accessible to any authenticated user.

## 4. Ownership Model
The new model introduces a strict `owner_id UUID REFERENCES auth.users(id)` across all business entities.
- The `owner_id` is the absolute source of truth for authorization.
- Every read, insert, update, and delete operation is scoped to `owner_id = auth.uid()`.
- Child tables additionally verify that any foreign keys (e.g., `site_id` or `worker_id`) also reference parent records owned by `auth.uid()`.

## 5. Migration Created
**Migration File:** `supabase/migrations/006_account_data_isolation.sql`
Adds `owner_id` (with `DEFAULT auth.uid()`) and foreign key constraints to all business tables. Adds high-performance indexing for `owner_id`.

## 6. RLS Policies Created
All business tables now have strict RLS policies utilizing `auth.uid()`:
- **SELECT**: `USING (owner_id = auth.uid())`
- **INSERT**: `WITH CHECK (owner_id = auth.uid() AND EXISTS(SELECT 1 FROM parent_table WHERE id = parent_id AND owner_id = auth.uid()))`
- **UPDATE**: `USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid() AND <parent_ownership_checks>)`
- **DELETE**: `USING (owner_id = auth.uid())`

## 7. Service-layer Changes
No changes are strictly required in the UI insert payload because we utilized PostgreSQL's `DEFAULT auth.uid()` for the `owner_id` column. The Supabase client automatically executes inserts using the authenticated user's context, populating the column correctly on the database side without requiring the client to explicitly pass an `owner_id` property, preventing UI tampering.

## 8. Hook Changes
Hooks automatically benefit from the restricted queries returned by the database. The previous queries `.select('*')` now securely return only the tenant's data due to the updated database RLS. 

## 9. Cache/DataSync Changes
Added a hook into `AuthProvider.tsx` to automatically call `dataSync.clearAll()` when the user logs out, ensuring no orphaned state survives between different user sessions on the same device.

## 10. Legacy Data/Backfill Strategy
Existing records lack any reliable ownership tracking (no `created_by` or `user_id` existed). To preserve existing data without guessing ownership, we added `owner_id` as `DEFAULT auth.uid()` (which will populate future records, leaving old records as `NULL`). Since RLS now strictly requires `owner_id = auth.uid()`, these legacy records will become orphaned and invisible to standard users, but remain safely stored in the database for manual DBA assignment if a mapping can be determined later.

## 11. Security Test Matrix
- **Scenario A**: User A creates Site 1. User B logs in. User B should receive 0 rows for Sites.
- **Scenario B**: User B attempts to access Site 1 using direct route `/sites/[id]`. Must receive "Site not found" (handled by RLS preventing read).
- **Scenario C**: User B attempts to insert a Material using User A's Site ID. Must fail due to `WITH CHECK` on parent site ownership.
- **Scenario D**: Logout A -> Login B. Verify `dataSync` invalidates and clears the dashboard completely.

## 12. Remaining Risks
- Edge cases where background subscriptions (Supabase realtime, if implemented) might retain channel connections across logout. Ensure realtime channels are destroyed on sign-out.
- Legacy records are currently inaccessible. If users complain about missing data, an out-of-band manual backfill mapping script must be executed by the database administrator.
