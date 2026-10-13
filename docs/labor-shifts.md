# Attendance with half and extra shifts

For each worker category, choose **0.5, 1, 1.5 or 2 shifts**, then enter the number of workers on that shift in one count field. The amount per worker appears before the count: for example, ₹1,200 × 1.5 = ₹1,800 per worker. To enter a different group, select its shift and enter those workers. Switching shifts preserves the other groups. Each person belongs to one group.

Entered groups show their worker count, wage per worker and subtotal. The bottom shows actual total workers and total wages. Tap a group to edit it; set its count to zero to remove it. All attendance editors use this shared control. The base rate remains the wage for **one shift**, with a proportional multiplier rather than an hourly overtime policy.

Example: 3 masons doing 1 shift and 2 masons doing 1.5 shifts means **5 workers**, **6 paid shifts**. At ₹1,200 per shift, wages are **₹7,200**.

This app records attendance by category, site and date. It does not identify individual workers by name or use an hourly overtime rate.

Both the standalone Attendance screen and the site attendance editors support the same counts. Daily cost, category subtotals and project labor budgets use paid shifts; dashboard worker counts remain actual people. Stored records without shift details retain one shift per worker. Editing and clearing extra counts preserves the distinction between people and shifts.

## Database deployment

Apply `supabase/migrations/013_labor_shift_counts.sql` after the existing migrations, including `010_expand_site_labor_roles.sql`, before deploying the updated app. Use the project's usual Supabase migration workflow, or run the file in the intended project's SQL Editor.

The migration adds a JSONB column with an empty-object default, so old records need no backfill. A constraint rejects invalid shift buckets, negative/fractional worker counts, unknown roles and extra-worker counts above the saved role headcount. Existing ownership policies remain in effect.

Cloud migration execution was not performed in this workspace. The app refuses to strip extra-shift data when the remote schema is missing columns. Offline entries retain shift details in the existing queue and require the migrated database when they sync.

## Verification

`node --test tests/laborShifts.test.cjs` checks mixed shifts, all worker roles, old records, zero/decimal rates, save/reopen round trips, clearing counts, invalid values, missing-schema errors and offline/online payload preservation. Also run `npx.cmd expo lint` and `npx.cmd tsc --noEmit`.

Verify on a development build: enter 3 normal + 2 extra-shift workers, save and reopen, confirm 5 workers / 6 shifts / ₹7,200, then change one worker to a half shift. Check both attendance entry points, offline reconnect and the resulting project labor budget.
