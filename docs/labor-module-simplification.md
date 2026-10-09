# Labor Module Simplification

## Objective
The GRN Construction mobile app required a simplified Labor management experience. Instead of tracking individual workers with personal details and daily attendance, the app now tracks labor headcounts and payroll at the site level.

## Key Architectural Changes

1. **New Database Entity: `site_labor`**
   - We created the `007_site_labor.sql` Supabase migration to introduce the `site_labor` table.
   - It maintains a one-to-one relationship with `sites`.
   - Fields: `site_id`, `labor_count`, `salary_type` (Daily, Weekly, Monthly), and `salary_rate`.
   - Implemented full Row-Level Security (RLS) enforcing `owner_id` isolation.

2. **Supabase Client Types & Services**
   - Regenerated TypeScript types in `src/types/database.ts` to include the `site_labor` schema.
   - Built a new data access layer `src/services/siteLabor.ts` to handle CRUD interactions with `site_labor`.
   - Built a corresponding React Hook `src/hooks/useSiteLabor.ts` to supply live data to UI components and trigger global syncs via `DataSyncEngine`.

3. **Replacing Individual Workers in UI**
   - Removed the obsolete Labor listing and details screens (`/labor/index.tsx`, `/labor/[id].tsx`).
   - Replaced individual worker inputs with `SiteLaborForm.tsx`, prompting only for headcount, salary type, and site-specific rate.
   - Hooked up `labor/add.tsx` and `labor/edit.tsx` to utilize `SiteLaborForm` instead.
   - Migrated `src/app/(app)/sites/[id].tsx` to present a unified "Labor Summary" card powered by `site_labor` in place of the detailed workers/attendance lists.

4. **Payroll and Budget Integration**
   - The `useSiteBudget.ts` calculations previously iterated over granular `payroll_records`.
   - We modified `useSiteBudget.ts` to derive labor cost estimates directly from `site_labor` by calculating `labor_count * salary_rate`.

5. **Dashboard Analytics Simplification**
   - In `src/services/dashboard.ts`, removed dependency on `attendance` and individual `workers`.
   - Changed the "Workers Today" dashboard metric to "Active Labor", pulling aggregate `labor_count` from `site_labor`.
   - Substituted recent attendance/worker activities with labor update logs in the Recent Activity feed.
   - Updated `OverviewSection.tsx` and `reports.tsx` textual descriptions to align with site-level analytics.

6. **Cleanup of Deprecated Systems**
   - Searched and safely removed empty UI components that solely depended on the deprecated workers logic (e.g. `WorkerCard`, `WorkerForm`, etc.).
   - Legacy worker schema configurations (`workers`, `attendance`, `payroll_records`) remain in the database unaltered to prevent production data loss, however, they are no longer exposed in the active UI flow.

## Final Validation Results
All systems successfully validated against Expo build environments.
- `npx tsc --noEmit`: 0 Errors (TypeScript integrity intact).
- `npx expo config --type public`: Correct configurations validated.
- `npx expo export --platform web`: Project bundled and compiled statically without errors.
