# GRN Construction Expo App - Production Readiness Audit

## 1. Authentication Audit
**Status: Pass**
- Supabase client is correctly initialized without secrets.
- `AuthProvider` effectively manages `onAuthStateChange` listeners and gracefully unsubscribes on unmount.
- Protected routes use Expo Router's `<Redirect href="/(auth)" />` conditionally based on the session state.
- Google OAuth implementation handles platform differences (`Platform.OS === 'web'`) and uses `expo-linking` for deep linking safely.

## 2. Environment / Secret Audit
**Status: Pass**
- `.env` only contains `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- No `service_role` keys, hardcoded passwords, or Google Client secrets exist in the source code.
- `.gitignore` correctly ignores `.env` files.

## 3. RLS (Row Level Security) Audit
**Status: Architecture Note**
- RLS is explicitly enabled on all public tables in `001_initial_schema.sql`.
- **Finding (Intentional Shared Workspace):** The current architecture grants access to `materials`, `workers`, `attendance`, and `expenses` if the user is authenticated and the `site_id` exists. Since *any* authenticated user can view *all* sites (`USING (auth.role() = 'authenticated')`), any authenticated team member has read/write access to all project data. This fits a trusted team model but must be noted as it is not a multi-tenant/isolated architecture.

## 4. Database Security
**Status: Minor Issue Found**
- Soft deletes are implemented well (`deleted_at` timestamps).
- Check constraints successfully guard against negative values (e.g. `amount >= 0`).
- **Issue:** The `materials` table tracks `quantity` and `used`. However, there is no constraint ensuring that `used` cannot exceed `quantity` (e.g. `CHECK (used <= quantity)`). This could theoretically result in negative available inventory if not strictly guarded by the UI.

## 5. Supabase Query Audit
**Status: Clean but Unoptimized**
- Queries always use the authenticated client.
- Soft-delete filters (`.is('deleted_at', null)`) are consistently applied.
- Null handling and `maybeSingle()` are correctly utilized.

## 6. Date / Time Audit
**Status: Critical Issue Found**
- `attendance.ts` safely parses the local date to `YYYY-MM-DD` strings, immune to UTC drift.
- **Issue:** In `dashboard.ts`, `getDashboardMetrics()` calculates the month start date using `new Date(...).toISOString()`. For users in IST (+5:30), the 1st of September at 00:00 becomes August 31st 18:30 in UTC. When this UTC string is compared against the `expenses.date` column (which stores a `DATE` like `2026-09-01`), it can shift calculations and fetch expenses from the wrong month.

## 7. Currency / Number Audit
**Status: Pass**
- The database strictly uses `numeric` types.
- `sites.ts` isolates presentation logic via `formatSiteBudget` (converting standard numbers into INR Lakh/Crore strings) and safely parses strings back into DB numbers with `parseBudgetInput`.

## 8. Navigation Audit
**Status: Pass**
- Tab layouts are securely wrapped.
- Forms navigate cleanly via `router.back()` upon success.

## 9. UI State Audit
**Status: Pass**
- Components manage `loading` and `isSubmitting` states correctly.
- Fallback errors are localized (e.g., handling generic DB errors safely in `sites.ts` via `formatDatabaseError` before displaying to the user).

## 10. Form Audit
**Status: Pass**
- Required fields are actively validated prior to submission.
- Buttons are properly disabled during network requests (preventing duplicate saves).

## 11. Mobile + Web Audit
**Status: Pass**
- Static rendering correctly handles `Platform.OS` splits (e.g., in Google Auth).
- Web compilation runs without errors. 
- Touch targets and safe area boundaries are adequate.

## 12. Performance Audit
**Status: Medium Issue Found**
- **Issue:** The Dashboard makes several sequential (waterfall) network requests. 
  - `getDashboardMetrics()` awaits 4 separate count queries serially.
  - `getRecentActivity()` awaits 4 separate feed queries serially.
- This creates an 8-request waterfall on the home screen, significantly impacting TTFB (Time To First Byte) on slow mobile connections. These should be refactored to run concurrently via `Promise.all` or merged into a single PostgreSQL RPC.

## 13. TypeScript / ESLint
**Status: Pass**
- `npx tsc --noEmit` exits cleanly.
- `npx expo lint` found zero warnings/errors.

## 14. Git / Project Hygiene
**Status: Pass**
- Build artifacts (`.expo/`, `dist/`) and OS files (`.DS_Store`) are correctly ignored.
- No local secrets committed.

---

### Final Summary

- **Total Critical Issues:** 1 (Timezone drift in Dashboard date filtering)
- **Total Medium Issues:** 1 (Dashboard sequential queries causing network bottlenecks)
- **Total Minor Issues:** 1 (Missing database constraint on `materials.used`)

**Is the app ready for the next hardening phase?**
Yes. The security and authentication fundamentals are robust, and the codebase is extremely clean. Only a few specific bug fixes and optimizations remain before scaling.

**Exact files that should be changed next:**
1. `src/services/dashboard.ts` (Fix timezone `.toISOString()` bug and optimize sequential `await` queries using `Promise.all`)
2. `supabase/migrations/002_add_material_constraints.sql` (Create a new migration to add a `CHECK (used <= quantity + received)` constraint to the `materials` table).