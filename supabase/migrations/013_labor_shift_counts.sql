-- Keep *_count as real headcounts; store only workers on nonstandard shifts.
-- Existing records continue to mean one shift per worker.
BEGIN;

ALTER TABLE public.site_labor_daily
ADD COLUMN IF NOT EXISTS shift_counts JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.valid_labor_shift_counts(shifts JSONB, heads JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  role_entry RECORD;
  shift_entry RECORD;
  workers NUMERIC;
  role_workers NUMERIC;
BEGIN
  IF shifts IS NULL OR jsonb_typeof(shifts) <> 'object' THEN RETURN FALSE; END IF;
  FOR role_entry IN SELECT * FROM jsonb_each(shifts) LOOP
    IF NOT (heads ? role_entry.key) OR jsonb_typeof(role_entry.value) <> 'object' THEN RETURN FALSE; END IF;
    role_workers := 0;
    FOR shift_entry IN SELECT * FROM jsonb_each(role_entry.value) LOOP
      IF shift_entry.key NOT IN ('0.5', '1.5', '2') OR jsonb_typeof(shift_entry.value) <> 'number' THEN RETURN FALSE; END IF;
      workers := (shift_entry.value #>> '{}')::numeric;
      IF workers < 0 OR workers <> trunc(workers) THEN RETURN FALSE; END IF;
      role_workers := role_workers + workers;
    END LOOP;
    IF role_workers > (heads ->> role_entry.key)::numeric THEN RETURN FALSE; END IF;
  END LOOP;
  RETURN TRUE;
END;
$$;

ALTER TABLE public.site_labor_daily
ADD CONSTRAINT site_labor_daily_shift_counts_check CHECK (
  public.valid_labor_shift_counts(shift_counts, jsonb_build_object(
    'mason', mason_count,
    'men_helper', men_helper_count,
    'women_helper', women_helper_count,
    'painter', painter_count,
    'carpenter', carpenter_count,
    'plumber', plumber_count,
    'electrician', electrician_count,
    'bar_bender', bar_bender_count,
    'welder', welder_count,
    'flooring', flooring_count
  ))
);

NOTIFY pgrst, 'reload schema';
COMMIT;
