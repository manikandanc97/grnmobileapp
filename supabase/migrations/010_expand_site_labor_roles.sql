-- Migration: 010_expand_site_labor_roles.sql
-- Add expanded construction worker categories to site_labor_daily

ALTER TABLE public.site_labor_daily
ADD COLUMN IF NOT EXISTS painter_count INTEGER NOT NULL DEFAULT 0 CHECK (painter_count >= 0),
ADD COLUMN IF NOT EXISTS painter_rate NUMERIC NOT NULL DEFAULT 0 CHECK (painter_rate >= 0),

ADD COLUMN IF NOT EXISTS carpenter_count INTEGER NOT NULL DEFAULT 0 CHECK (carpenter_count >= 0),
ADD COLUMN IF NOT EXISTS carpenter_rate NUMERIC NOT NULL DEFAULT 0 CHECK (carpenter_rate >= 0),

ADD COLUMN IF NOT EXISTS plumber_count INTEGER NOT NULL DEFAULT 0 CHECK (plumber_count >= 0),
ADD COLUMN IF NOT EXISTS plumber_rate NUMERIC NOT NULL DEFAULT 0 CHECK (plumber_rate >= 0),

ADD COLUMN IF NOT EXISTS electrician_count INTEGER NOT NULL DEFAULT 0 CHECK (electrician_count >= 0),
ADD COLUMN IF NOT EXISTS electrician_rate NUMERIC NOT NULL DEFAULT 0 CHECK (electrician_rate >= 0),

ADD COLUMN IF NOT EXISTS bar_bender_count INTEGER NOT NULL DEFAULT 0 CHECK (bar_bender_count >= 0),
ADD COLUMN IF NOT EXISTS bar_bender_rate NUMERIC NOT NULL DEFAULT 0 CHECK (bar_bender_rate >= 0),

ADD COLUMN IF NOT EXISTS welder_count INTEGER NOT NULL DEFAULT 0 CHECK (welder_count >= 0),
ADD COLUMN IF NOT EXISTS welder_rate NUMERIC NOT NULL DEFAULT 0 CHECK (welder_rate >= 0),

ADD COLUMN IF NOT EXISTS flooring_count INTEGER NOT NULL DEFAULT 0 CHECK (flooring_count >= 0),
ADD COLUMN IF NOT EXISTS flooring_rate NUMERIC NOT NULL DEFAULT 0 CHECK (flooring_rate >= 0);
