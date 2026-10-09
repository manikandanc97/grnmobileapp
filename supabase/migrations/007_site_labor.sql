CREATE TABLE public.site_labor (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    labor_count INTEGER NOT NULL DEFAULT 0 CHECK (labor_count >= 0),
    salary_type TEXT NOT NULL DEFAULT 'Daily' CHECK (salary_type IN ('Daily', 'Weekly', 'Monthly')),
    salary_rate NUMERIC NOT NULL DEFAULT 0 CHECK (salary_rate >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(site_id)
);

ALTER TABLE public.site_labor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own site labor"
    ON public.site_labor FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own site labor"
    ON public.site_labor FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own site labor"
    ON public.site_labor FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own site labor"
    ON public.site_labor FOR DELETE
    USING (auth.uid() = owner_id);

CREATE INDEX idx_site_labor_site_id ON public.site_labor(site_id);
CREATE INDEX idx_site_labor_owner_id ON public.site_labor(owner_id);
