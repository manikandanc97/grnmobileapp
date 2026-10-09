# Site Labor Daily Architecture Model

## 1. New Business Requirement
The Labor module needs to transition from managing individual worker identities to a site and date-based aggregate count. For every site, on any given date, the labor must be tracked in three categories: Mason, Men Helper, and Women Helper. Each category can have its own count and daily salary rate. Today's current count or salary changes must not affect historical records.

## 2. Database Model
Instead of `site_labor` with a generic count and salary rate per site, we will introduce `site_labor_daily`.

```sql
CREATE TABLE public.site_labor_daily (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,

    mason_count INTEGER NOT NULL DEFAULT 0 CHECK (mason_count >= 0),
    mason_rate NUMERIC NOT NULL DEFAULT 0 CHECK (mason_rate >= 0),

    men_helper_count INTEGER NOT NULL DEFAULT 0 CHECK (men_helper_count >= 0),
    men_helper_rate NUMERIC NOT NULL DEFAULT 0 CHECK (men_helper_rate >= 0),

    women_helper_count INTEGER NOT NULL DEFAULT 0 CHECK (women_helper_count >= 0),
    women_helper_rate NUMERIC NOT NULL DEFAULT 0 CHECK (women_helper_rate >= 0),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    UNIQUE(site_id, work_date)
);

CREATE INDEX idx_site_labor_daily_owner_site_date ON public.site_labor_daily(owner_id, site_id, work_date);
```

## 3. Date Snapshot Architecture
- Historical accuracy: `work_date` is a `DATE` type (YYYY-MM-DD). 
- Every date has its own independent snapshot of labor counts and rates.

## 4. Salary/Rate History
- Salary rates (mason_rate, men_helper_rate, women_helper_rate) are specific to a date. 
- Editing rates for the current date applies strictly to `work_date = today` and does not propagate backwards to overwrite previous dates.

## 5. Daily Calculations
- Total Workers = `mason_count + men_helper_count + women_helper_count`
- Total Daily Labor Cost = `(mason_count * mason_rate) + (men_helper_count * men_helper_rate) + (women_helper_count * women_helper_rate)`
- Calculations happen dynamically in the application layer or derived views, relying on the stored snapshot values.

## 6. Budget Integration
- Site Budget is calculated by taking the SUM of all `(mason_count * mason_rate) + (men_helper_count * men_helper_rate) + (women_helper_count * women_helper_rate)` across the specified date range. 
- The historical costs are accurate since the rate is preserved for each past day.

## 7. Dashboard Integration
- The Dashboard aggregates active labor for `work_date = today` across all sites belonging to the user.

## 8. Reports
- Date Range Filtering allows reporting daily labor counts and costs accurately. 
- The report presents rows corresponding to each distinct date in the requested range.

## 9. Security/RLS
- Each `site_labor_daily` row has an `owner_id`.
- RLS Policies restrict `SELECT`, `INSERT`, `UPDATE`, `DELETE` to only rows where `owner_id = auth.uid()`.
- Data remains isolated securely by `owner_id`, regardless of `site_id` knowledge.

## 10. Migration Strategy
- `008_site_labor_daily.sql` will be introduced.
- Existing `site_labor` table can be deprecated. Since this is a new model, we will drop `site_labor` completely or simply not use it anymore if it was recently added.
- Existing tables (`workers`, `attendance`, `payroll`, `payroll_records`) will be evaluated. They can be left as legacy in the database for now (no DROP statements) but UI components managing individual workers will be pruned.

## 11. Legacy Worker Handling
- All UI links to "Workers", "Add Worker", "Edit Worker", "Worker Profile" will be removed.
- Components such as `WorkerCard` and `WorkerForm` will be removed.
- Services and hooks related to `workers`, `attendance`, `payroll` will be cleaned up to ensure the codebase relies solely on the new `site_labor_daily` architecture.

## 12. Test Results

FINAL REPORT:
- SITE + DATE LABOR MODEL: PENDING
- MASON COUNT: PENDING
- MEN HELPER COUNT: PENDING
- WOMEN HELPER COUNT: PENDING
- DATE-WISE HISTORY: PENDING
- DATE-SPECIFIC SALARY: PENDING
- SALARY EDIT: PENDING
- DAILY TOTAL LABOR COST: PENDING
- DATE RANGE TOTAL: PENDING
- SITE BUDGET: PENDING
- DASHBOARD: PENDING
- REPORTS: PENDING
- ACCOUNT ISOLATION: PENDING
- RLS: PENDING
- TYPESCRIPT: PENDING
- LINT: PENDING
- WEB BUILD: PENDING
