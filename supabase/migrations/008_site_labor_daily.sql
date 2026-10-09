-- Migration: 008_site_labor_daily.sql

CREATE TABLE IF NOT EXISTS public.site_labor_daily (
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

    CONSTRAINT uq_site_labor_daily_site_date UNIQUE (site_id, work_date)
);

CREATE INDEX IF NOT EXISTS idx_site_labor_daily_owner_id ON public.site_labor_daily(owner_id);
CREATE INDEX IF NOT EXISTS idx_site_labor_daily_site_id ON public.site_labor_daily(site_id);
CREATE INDEX IF NOT EXISTS idx_site_labor_daily_owner_site_date ON public.site_labor_daily(owner_id, site_id, work_date);

ALTER TABLE public.site_labor_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own site labor daily records"
    ON public.site_labor_daily FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own site labor daily records"
    ON public.site_labor_daily FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own site labor daily records"
    ON public.site_labor_daily FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own site labor daily records"
    ON public.site_labor_daily FOR DELETE
    USING (auth.uid() = owner_id);

-- Drop the old single-site labor table logic/policies to avoid confusion
DROP TABLE IF EXISTS public.site_labor CASCADE;
