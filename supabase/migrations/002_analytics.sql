-- =============================================
-- Coach App - Analytics Additions
-- =============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =============================================
-- ANALYTICS HELPERS
-- =============================================

-- Safely parse numeric text (accepts comma decimals)
CREATE OR REPLACE FUNCTION safe_numeric_text(value TEXT)
RETURNS NUMERIC AS $$
DECLARE
  cleaned TEXT;
BEGIN
  IF value IS NULL THEN
    RETURN NULL;
  END IF;

  cleaned := regexp_replace(trim(value), '[^0-9,\\.-]', '', 'g');
  cleaned := replace(cleaned, ',', '.');

  IF cleaned ~ '^[+-]?[0-9]+(\\.[0-9]+)?$' THEN
    RETURN cleaned::NUMERIC;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Estimate 1RM using Epley formula
CREATE OR REPLACE FUNCTION estimate_1rm(weight NUMERIC, reps INTEGER)
RETURNS NUMERIC AS $$
BEGIN
  IF weight IS NULL OR reps IS NULL OR reps <= 0 THEN
    RETURN NULL;
  END IF;
  RETURN weight * (1 + reps / 30.0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Training load ranges per goal based on estimated 1RM
CREATE OR REPLACE FUNCTION training_load_ranges(estimated_1rm NUMERIC)
RETURNS TABLE (
  goal TEXT,
  rep_range TEXT,
  min_percent NUMERIC,
  max_percent NUMERIC,
  min_weight NUMERIC,
  max_weight NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'force', '1-5', 0.85, 1.00,
         round(estimated_1rm * 0.85, 2), round(estimated_1rm * 1.00, 2)
  UNION ALL
  SELECT 'hypertrophie', '6-12', 0.65, 0.85,
         round(estimated_1rm * 0.65, 2), round(estimated_1rm * 0.85, 2)
  UNION ALL
  SELECT 'endurance', '12-20', 0.50, 0.65,
         round(estimated_1rm * 0.50, 2), round(estimated_1rm * 0.65, 2)
  UNION ALL
  SELECT 'volume', '8-15', 0.60, 0.75,
         round(estimated_1rm * 0.60, 2), round(estimated_1rm * 0.75, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- BMI calculator (IMC)
CREATE OR REPLACE FUNCTION calculate_bmi(weight_kg NUMERIC, height_cm NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
  IF weight_kg IS NULL OR height_cm IS NULL OR height_cm <= 0 THEN
    RETURN NULL;
  END IF;
  RETURN round((weight_kg / power(height_cm / 100.0, 2))::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================
-- ANALYTICS VIEWS
-- =============================================

-- Expand workout sets for analysis
CREATE OR REPLACE VIEW public.workout_entry_sets AS
SELECT
  we.id AS workout_entry_id,
  wl.id AS workout_log_id,
  wl.client_id,
  wl.coach_id,
  wl.date,
  we.exercise_id,
  we.exercise_name,
  set_elem_ordinality AS set_index,
  CASE
    WHEN (set_elem->>'reps') ~ '^[0-9]+$' THEN (set_elem->>'reps')::INTEGER
    ELSE NULL
  END AS reps,
  safe_numeric_text(set_elem->>'weight') AS weight,
  safe_numeric_text(set_elem->>'rpe') AS rpe,
  safe_numeric_text(set_elem->>'rir') AS rir,
  CASE
    WHEN (set_elem->>'rest_seconds') ~ '^[0-9]+$' THEN (set_elem->>'rest_seconds')::INTEGER
    ELSE NULL
  END AS rest_seconds,
  CASE
    WHEN (set_elem->>'reps') ~ '^[0-9]+$'
      AND safe_numeric_text(set_elem->>'weight') IS NOT NULL
      THEN (set_elem->>'reps')::INTEGER * safe_numeric_text(set_elem->>'weight')
    ELSE NULL
  END AS set_volume
FROM public.workout_entries we
JOIN public.workout_logs wl ON wl.id = we.workout_log_id
CROSS JOIN LATERAL jsonb_array_elements(we.sets_json) WITH ORDINALITY
  AS set_elem(set_elem, set_elem_ordinality);

-- Best (max) load per exercise per day
CREATE OR REPLACE VIEW public.exercise_best_loads_daily AS
SELECT
  client_id,
  coach_id,
  exercise_id,
  exercise_name,
  date,
  MAX(weight) AS max_weight
FROM public.workout_entry_sets
WHERE weight IS NOT NULL
GROUP BY client_id, coach_id, exercise_id, exercise_name, date;

-- Best estimated 1RM per exercise per day
CREATE OR REPLACE VIEW public.exercise_best_1rm_daily AS
SELECT
  client_id,
  coach_id,
  exercise_id,
  exercise_name,
  date,
  MAX(estimate_1rm(weight, reps)) AS max_estimated_1rm
FROM public.workout_entry_sets
WHERE weight IS NOT NULL AND reps IS NOT NULL
GROUP BY client_id, coach_id, exercise_id, exercise_name, date;

-- Materialized aggregates for fast charting
DROP MATERIALIZED VIEW IF EXISTS public.exercise_perf_daily_agg;
CREATE MATERIALIZED VIEW public.exercise_perf_daily_agg AS
SELECT
  client_id,
  coach_id,
  exercise_id,
  exercise_name,
  date,
  MAX(weight) AS max_weight,
  MAX(estimate_1rm(weight, reps)) AS max_estimated_1rm
FROM public.workout_entry_sets
WHERE weight IS NOT NULL
GROUP BY client_id, coach_id, exercise_id, exercise_name, date;

CREATE INDEX IF NOT EXISTS idx_exercise_perf_daily_agg_client_exercise_date
  ON public.exercise_perf_daily_agg(client_id, exercise_id, date);
CREATE INDEX IF NOT EXISTS idx_exercise_perf_daily_agg_coach_exercise_date
  ON public.exercise_perf_daily_agg(coach_id, exercise_id, date);
CREATE INDEX IF NOT EXISTS idx_exercise_perf_daily_agg_date
  ON public.exercise_perf_daily_agg(date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_exercise_perf_daily_agg_unique
  ON public.exercise_perf_daily_agg(client_id, coach_id, exercise_id, date);

-- Comparison series for front-end (filter by exercise_id in the app)
CREATE OR REPLACE VIEW public.exercise_compare_series AS
SELECT
  client_id,
  coach_id,
  exercise_id,
  exercise_name,
  date,
  'max_weight'::TEXT AS metric,
  max_weight::NUMERIC AS value
FROM public.exercise_perf_daily_agg
UNION ALL
SELECT
  client_id,
  coach_id,
  exercise_id,
  exercise_name,
  date,
  'max_estimated_1rm'::TEXT AS metric,
  max_estimated_1rm::NUMERIC AS value
FROM public.exercise_perf_daily_agg;

-- BMI per client with a caution note
CREATE OR REPLACE VIEW public.client_bmi AS
SELECT
  c.id AS client_id,
  c.coach_id,
  c.display_name,
  c.height,
  lw.weight AS weight,
  calculate_bmi(lw.weight, c.height) AS bmi,
  CASE
    WHEN calculate_bmi(lw.weight, c.height) IS NULL THEN NULL
    ELSE 'IMC indicatif: la masse musculaire peut faire apparaitre une personne comme en surpoids.'
  END AS bmi_note
FROM public.clients c
LEFT JOIN LATERAL (
  SELECT
    chk.weight,
    chk.week_start_date
  FROM public.checkins chk
  WHERE chk.client_id = c.id
  ORDER BY chk.week_start_date DESC
  LIMIT 1
) lw ON TRUE;

-- =============================================
-- ANALYTICS FUNCTIONS
-- =============================================

-- Refresh materialized aggregate
CREATE OR REPLACE FUNCTION refresh_exercise_perf_daily_agg()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.exercise_perf_daily_agg;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Compare two exercises for a client (optionally filter by metric)
CREATE OR REPLACE FUNCTION compare_exercises(
  in_client_id UUID,
  in_exercise_ids UUID[],
  in_metric TEXT DEFAULT NULL
)
RETURNS TABLE (
  date DATE,
  exercise_id UUID,
  exercise_name TEXT,
  metric TEXT,
  value NUMERIC
) AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF auth.uid() <> in_client_id AND NOT EXISTS (
    SELECT 1
    FROM public.clients c
    WHERE c.id = in_client_id
      AND c.coach_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT
    ecs.date,
    ecs.exercise_id,
    ecs.exercise_name,
    ecs.metric,
    ecs.value
  FROM public.exercise_compare_series ecs
  WHERE ecs.client_id = in_client_id
    AND ecs.exercise_id = ANY (in_exercise_ids)
    AND (in_metric IS NULL OR ecs.metric = in_metric)
  ORDER BY ecs.date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- ACCESS CONTROL
-- =============================================

REVOKE ALL ON public.exercise_perf_daily_agg FROM anon, authenticated;
GRANT SELECT ON public.exercise_perf_daily_agg TO service_role;

CREATE OR REPLACE VIEW public.exercise_perf_daily_secure AS
SELECT
  client_id,
  coach_id,
  exercise_id,
  exercise_name,
  date,
  max_weight,
  max_estimated_1rm
FROM public.exercise_perf_daily_agg
WHERE client_id = auth.uid()
   OR coach_id = auth.uid();

GRANT SELECT ON public.exercise_perf_daily_secure TO authenticated;

-- =============================================
-- CRON
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh_exercise_perf_daily_agg_hourly') THEN
    PERFORM cron.unschedule('refresh_exercise_perf_daily_agg_hourly');
  END IF;
END;
$$;

SELECT cron.schedule(
  'refresh_exercise_perf_daily_agg_15min',
  '*/15 * * * *',
  'SELECT public.refresh_exercise_perf_daily_agg();'
);
