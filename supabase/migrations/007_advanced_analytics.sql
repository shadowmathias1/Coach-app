-- =============================================
-- Coach App - Advanced Analytics & Templates
-- =============================================

-- =============================================
-- MUSCLE GROUPS
-- =============================================

CREATE TABLE public.muscle_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID REFERENCES public.coaches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(coach_id, name)
);

CREATE TABLE public.exercise_muscles (
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  muscle_group_id UUID NOT NULL REFERENCES public.muscle_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (exercise_id, muscle_group_id)
);

-- =============================================
-- CLIENT GOALS
-- =============================================

CREATE TABLE public.client_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('weight', 'frequency', 'performance')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  target_value NUMERIC NOT NULL,
  target_unit TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  performance_metric TEXT CHECK (performance_metric IN ('max_weight', 'weekly_volume')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT client_goals_performance_requires_exercise
    CHECK (goal_type <> 'performance' OR (exercise_id IS NOT NULL AND performance_metric IS NOT NULL)),
  CONSTRAINT client_goals_weight_no_exercise
    CHECK (goal_type <> 'weight' OR exercise_id IS NULL),
  CONSTRAINT client_goals_frequency_no_exercise
    CHECK (goal_type <> 'frequency' OR exercise_id IS NULL)
);

-- =============================================
-- WORKOUT TEMPLATES
-- =============================================

CREATE TABLE public.workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID REFERENCES public.coaches(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_shared BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT workout_templates_owner_check
    CHECK ((coach_id IS NOT NULL AND client_id IS NULL) OR (client_id IS NOT NULL)),
  CONSTRAINT workout_templates_client_not_shared
    CHECK (client_id IS NULL OR is_shared = FALSE)
);

CREATE TABLE public.workout_template_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number >= 1),
  day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 7),
  title TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(template_id, week_number, day_number)
);

CREATE TABLE public.workout_template_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_day_id UUID NOT NULL REFERENCES public.workout_template_days(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  exercise_name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  target_sets INTEGER,
  target_reps TEXT,
  target_rpe INTEGER CHECK (target_rpe >= 1 AND target_rpe <= 10),
  target_weight DECIMAL(6, 2),
  rest_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_muscle_groups_coach_id ON public.muscle_groups(coach_id);
CREATE INDEX idx_exercise_muscles_muscle_group_id ON public.exercise_muscles(muscle_group_id);

CREATE INDEX idx_client_goals_client_id ON public.client_goals(client_id);
CREATE INDEX idx_client_goals_coach_id ON public.client_goals(coach_id);
CREATE INDEX idx_client_goals_goal_type ON public.client_goals(goal_type);

CREATE INDEX idx_workout_templates_coach_id ON public.workout_templates(coach_id);
CREATE INDEX idx_workout_templates_client_id ON public.workout_templates(client_id);
CREATE INDEX idx_workout_template_days_template_id ON public.workout_template_days(template_id);
CREATE INDEX idx_workout_template_items_template_day_id ON public.workout_template_items(template_day_id);

-- =============================================
-- RLS
-- =============================================

ALTER TABLE public.muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_muscles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_template_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_template_items ENABLE ROW LEVEL SECURITY;

-- Muscle groups policies
CREATE POLICY "Coaches can view global or their muscle groups"
  ON public.muscle_groups FOR SELECT
  USING (
    coach_id IS NULL
    OR coach_id = auth.uid()
    OR coach_id IN (SELECT coach_id FROM public.clients WHERE id = auth.uid())
  );

CREATE POLICY "Coaches can manage their muscle groups"
  ON public.muscle_groups FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Exercise muscles policies
CREATE POLICY "Coaches can manage exercise muscles"
  ON public.exercise_muscles FOR ALL
  USING (
    exercise_id IN (SELECT id FROM public.exercises WHERE coach_id = auth.uid())
  )
  WITH CHECK (
    exercise_id IN (SELECT id FROM public.exercises WHERE coach_id = auth.uid())
  );

CREATE POLICY "Clients can view exercise muscles"
  ON public.exercise_muscles FOR SELECT
  USING (
    exercise_id IN (
      SELECT id FROM public.exercises
      WHERE coach_id IN (SELECT coach_id FROM public.clients WHERE id = auth.uid())
    )
  );

-- Client goals policies
CREATE POLICY "Clients can view their goals"
  ON public.client_goals FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Coaches can view their clients' goals"
  ON public.client_goals FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Clients can manage their goals"
  ON public.client_goals FOR INSERT
  WITH CHECK (
    client_id = auth.uid()
    AND coach_id = (SELECT coach_id FROM public.clients WHERE id = auth.uid())
  );

CREATE POLICY "Coaches can manage their clients' goals"
  ON public.client_goals FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Clients can update their goals"
  ON public.client_goals FOR UPDATE
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Workout templates policies
CREATE POLICY "Coaches can manage their templates"
  ON public.workout_templates FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Clients can manage their templates"
  ON public.workout_templates FOR ALL
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid() AND coach_id IS NULL);

CREATE POLICY "Clients can view shared coach templates"
  ON public.workout_templates FOR SELECT
  USING (
    client_id = auth.uid()
    OR (
      coach_id IN (SELECT coach_id FROM public.clients WHERE id = auth.uid())
      AND is_shared = TRUE
    )
  );

-- Workout template days policies
CREATE POLICY "Owners can manage template days"
  ON public.workout_template_days FOR ALL
  USING (
    template_id IN (
      SELECT id FROM public.workout_templates
      WHERE coach_id = auth.uid() OR client_id = auth.uid()
    )
  )
  WITH CHECK (
    template_id IN (
      SELECT id FROM public.workout_templates
      WHERE coach_id = auth.uid() OR client_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view shared template days"
  ON public.workout_template_days FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM public.workout_templates
      WHERE coach_id IN (SELECT coach_id FROM public.clients WHERE id = auth.uid())
        AND is_shared = TRUE
    )
  );

-- Workout template items policies
CREATE POLICY "Owners can manage template items"
  ON public.workout_template_items FOR ALL
  USING (
    template_day_id IN (
      SELECT wtd.id
      FROM public.workout_template_days wtd
      JOIN public.workout_templates wt ON wt.id = wtd.template_id
      WHERE wt.coach_id = auth.uid() OR wt.client_id = auth.uid()
    )
  )
  WITH CHECK (
    template_day_id IN (
      SELECT wtd.id
      FROM public.workout_template_days wtd
      JOIN public.workout_templates wt ON wt.id = wtd.template_id
      WHERE wt.coach_id = auth.uid() OR wt.client_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view shared template items"
  ON public.workout_template_items FOR SELECT
  USING (
    template_day_id IN (
      SELECT wtd.id
      FROM public.workout_template_days wtd
      JOIN public.workout_templates wt ON wt.id = wtd.template_id
      WHERE wt.coach_id IN (SELECT coach_id FROM public.clients WHERE id = auth.uid())
        AND wt.is_shared = TRUE
    )
  );

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER update_muscle_groups_updated_at BEFORE UPDATE ON public.muscle_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_goals_updated_at BEFORE UPDATE ON public.client_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_templates_updated_at BEFORE UPDATE ON public.workout_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_template_days_updated_at BEFORE UPDATE ON public.workout_template_days
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_template_items_updated_at BEFORE UPDATE ON public.workout_template_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ANALYTICS VIEWS
-- =============================================

CREATE OR REPLACE VIEW public.exercise_prs AS
WITH base AS (
  SELECT
    client_id,
    coach_id,
    exercise_id,
    exercise_name,
    date,
    weight,
    reps,
    estimate_1rm(weight, reps) AS estimated_1rm
  FROM public.workout_entry_sets
  WHERE weight IS NOT NULL
),
max_weight AS (
  SELECT DISTINCT ON (client_id, coach_id, exercise_id)
    client_id,
    coach_id,
    exercise_id,
    exercise_name,
    weight AS max_weight,
    date AS max_weight_date
  FROM base
  ORDER BY client_id, coach_id, exercise_id, weight DESC, date DESC
),
max_1rm AS (
  SELECT DISTINCT ON (client_id, coach_id, exercise_id)
    client_id,
    coach_id,
    exercise_id,
    exercise_name,
    estimated_1rm AS max_estimated_1rm,
    date AS max_estimated_1rm_date
  FROM base
  WHERE estimated_1rm IS NOT NULL
  ORDER BY client_id, coach_id, exercise_id, estimated_1rm DESC, date DESC
)
SELECT
  COALESCE(mw.client_id, m1.client_id) AS client_id,
  COALESCE(mw.coach_id, m1.coach_id) AS coach_id,
  COALESCE(mw.exercise_id, m1.exercise_id) AS exercise_id,
  COALESCE(mw.exercise_name, m1.exercise_name) AS exercise_name,
  mw.max_weight,
  mw.max_weight_date,
  m1.max_estimated_1rm,
  m1.max_estimated_1rm_date
FROM max_weight mw
FULL JOIN max_1rm m1
  ON mw.client_id = m1.client_id
 AND mw.coach_id = m1.coach_id
 AND mw.exercise_id = m1.exercise_id;

CREATE OR REPLACE VIEW public.exercise_last_best AS
WITH daily_best AS (
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
  GROUP BY client_id, coach_id, exercise_id, exercise_name, date
),
latest AS (
  SELECT DISTINCT ON (client_id, coach_id, exercise_id)
    client_id,
    coach_id,
    exercise_id,
    exercise_name,
    date AS last_date,
    max_weight AS last_max_weight,
    max_estimated_1rm AS last_max_estimated_1rm
  FROM daily_best
  ORDER BY client_id, coach_id, exercise_id, date DESC
)
SELECT * FROM latest;

CREATE OR REPLACE VIEW public.client_weekly_volume AS
SELECT
  client_id,
  coach_id,
  date_trunc('week', date)::date AS week_start,
  SUM(weight * reps) AS total_volume,
  SUM(reps) AS total_reps,
  COUNT(*) FILTER (WHERE weight IS NOT NULL AND reps IS NOT NULL) AS set_count
FROM public.workout_entry_sets
WHERE weight IS NOT NULL AND reps IS NOT NULL
GROUP BY client_id, coach_id, date_trunc('week', date);

CREATE OR REPLACE VIEW public.client_weekly_volume_compare AS
SELECT
  cur.client_id,
  cur.coach_id,
  cur.week_start,
  cur.total_volume AS current_volume,
  prev.total_volume AS previous_volume,
  (cur.total_volume - COALESCE(prev.total_volume, 0)) AS delta_volume
FROM public.client_weekly_volume cur
LEFT JOIN public.client_weekly_volume prev
  ON prev.client_id = cur.client_id
 AND prev.coach_id = cur.coach_id
 AND prev.week_start = (cur.week_start - INTERVAL '7 days')::date;

CREATE OR REPLACE VIEW public.workout_entry_sets_with_muscles AS
SELECT
  wes.*,
  mg.name AS muscle_group
FROM public.workout_entry_sets wes
JOIN public.exercise_muscles em ON em.exercise_id = wes.exercise_id
JOIN public.muscle_groups mg ON mg.id = em.muscle_group_id
UNION ALL
SELECT
  wes.*,
  ex.muscle_group AS muscle_group
FROM public.workout_entry_sets wes
JOIN public.exercises ex ON ex.id = wes.exercise_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercise_muscles em WHERE em.exercise_id = wes.exercise_id
)
AND ex.muscle_group IS NOT NULL;

CREATE OR REPLACE VIEW public.client_weekly_muscle_tonnage AS
SELECT
  client_id,
  coach_id,
  date_trunc('week', date)::date AS week_start,
  muscle_group,
  SUM(weight * reps) AS total_tonnage
FROM public.workout_entry_sets_with_muscles
WHERE weight IS NOT NULL AND reps IS NOT NULL AND muscle_group IS NOT NULL
GROUP BY client_id, coach_id, date_trunc('week', date), muscle_group;

CREATE OR REPLACE VIEW public.workout_set_intensity AS
WITH daily_best AS (
  SELECT
    client_id,
    coach_id,
    exercise_id,
    date,
    max_estimated_1rm
  FROM public.exercise_best_1rm_daily
)
SELECT
  wes.*,
  db.max_estimated_1rm,
  CASE
    WHEN db.max_estimated_1rm IS NULL OR wes.weight IS NULL THEN NULL
    ELSE ROUND((wes.weight / NULLIF(db.max_estimated_1rm, 0))::numeric, 4)
  END AS intensity_percent,
  CASE
    WHEN db.max_estimated_1rm IS NULL OR wes.weight IS NULL THEN NULL
    WHEN wes.weight / NULLIF(db.max_estimated_1rm, 0) >= 0.85 THEN 'force'
    WHEN wes.weight / NULLIF(db.max_estimated_1rm, 0) >= 0.65 THEN 'hypertrophie'
    WHEN wes.weight / NULLIF(db.max_estimated_1rm, 0) >= 0.50 THEN 'endurance'
    ELSE 'volume'
  END AS intensity_goal
FROM public.workout_entry_sets wes
LEFT JOIN daily_best db
  ON db.client_id = wes.client_id
 AND db.coach_id = wes.coach_id
 AND db.exercise_id = wes.exercise_id
 AND db.date = wes.date;

CREATE OR REPLACE VIEW public.client_weekly_goal_sets AS
SELECT
  client_id,
  coach_id,
  date_trunc('week', date)::date AS week_start,
  intensity_goal,
  COUNT(*) AS set_count
FROM public.workout_set_intensity
WHERE intensity_goal IS NOT NULL
GROUP BY client_id, coach_id, date_trunc('week', date), intensity_goal;

CREATE OR REPLACE VIEW public.client_goal_progress AS
WITH latest_weight AS (
  SELECT DISTINCT ON (client_id)
    client_id,
    weight,
    week_start_date
  FROM public.checkins
  ORDER BY client_id, week_start_date DESC
),
weekly_sessions AS (
  SELECT
    client_id,
    coach_id,
    COUNT(*) AS sessions_last_7d
  FROM public.workout_logs
  WHERE date >= CURRENT_DATE - INTERVAL '6 days'
  GROUP BY client_id, coach_id
),
current_week_volume AS (
  SELECT client_id, coach_id, total_volume
  FROM public.client_weekly_volume
  WHERE week_start = date_trunc('week', CURRENT_DATE)::date
),
current_max_weight AS (
  SELECT client_id, coach_id, exercise_id, max_weight
  FROM public.exercise_prs
),
base AS (
  SELECT
    g.*,
    lw.weight AS current_weight,
    ws.sessions_last_7d,
    CASE
      WHEN g.goal_type = 'weight' THEN lw.weight
      WHEN g.goal_type = 'frequency' THEN ws.sessions_last_7d::numeric
      WHEN g.goal_type = 'performance' AND g.performance_metric = 'max_weight' THEN cmw.max_weight
      WHEN g.goal_type = 'performance' AND g.performance_metric = 'weekly_volume' THEN cwv.total_volume
      ELSE NULL
    END AS current_value,
    CASE
      WHEN g.target_value IS NULL THEN NULL
      WHEN g.goal_type = 'weight' AND lw.weight IS NOT NULL THEN ROUND((lw.weight / g.target_value)::numeric, 4)
      WHEN g.goal_type = 'frequency' AND ws.sessions_last_7d IS NOT NULL THEN ROUND((ws.sessions_last_7d::numeric / g.target_value)::numeric, 4)
      WHEN g.goal_type = 'performance' AND g.performance_metric = 'max_weight' AND cmw.max_weight IS NOT NULL THEN ROUND((cmw.max_weight / g.target_value)::numeric, 4)
      WHEN g.goal_type = 'performance' AND g.performance_metric = 'weekly_volume' AND cwv.total_volume IS NOT NULL THEN ROUND((cwv.total_volume / g.target_value)::numeric, 4)
      ELSE NULL
    END AS progress_ratio
  FROM public.client_goals g
  LEFT JOIN latest_weight lw ON lw.client_id = g.client_id
  LEFT JOIN weekly_sessions ws ON ws.client_id = g.client_id AND ws.coach_id = g.coach_id
  LEFT JOIN current_week_volume cwv ON cwv.client_id = g.client_id AND cwv.coach_id = g.coach_id
  LEFT JOIN current_max_weight cmw ON cmw.client_id = g.client_id AND cmw.coach_id = g.coach_id AND cmw.exercise_id = g.exercise_id
)
SELECT
  base.*,
  CASE
    WHEN base.progress_ratio IS NULL THEN NULL
    ELSE base.progress_ratio >= 1
  END AS is_met
FROM base;

-- =============================================
-- ANALYTICS FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION round_to_increment(value NUMERIC, increment NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
  IF value IS NULL OR increment IS NULL OR increment <= 0 THEN
    RETURN value;
  END IF;
  RETURN round(value / increment) * increment;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION suggest_exercise_loads(
  in_client_id UUID,
  in_exercise_id UUID,
  in_goal TEXT DEFAULT NULL,
  in_increment NUMERIC DEFAULT 2.5
)
RETURNS TABLE (
  goal TEXT,
  rep_range TEXT,
  min_weight NUMERIC,
  max_weight NUMERIC,
  suggested_weight NUMERIC,
  last_session_date DATE,
  last_best_weight NUMERIC,
  last_best_1rm NUMERIC
) AS $$
DECLARE
  base_1rm NUMERIC;
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

  SELECT
    COALESCE(elb.last_max_estimated_1rm, prs.max_estimated_1rm)
  INTO base_1rm
  FROM public.exercise_last_best elb
  FULL JOIN public.exercise_prs prs
    ON prs.client_id = in_client_id
   AND prs.exercise_id = in_exercise_id
   AND prs.coach_id = COALESCE(elb.coach_id, prs.coach_id)
  WHERE (elb.client_id = in_client_id AND elb.exercise_id = in_exercise_id)
     OR (prs.client_id = in_client_id AND prs.exercise_id = in_exercise_id)
  LIMIT 1;

  RETURN QUERY
  SELECT
    tlr.goal,
    tlr.rep_range,
    tlr.min_weight,
    tlr.max_weight,
    CASE
      WHEN tlr.min_weight IS NULL OR tlr.max_weight IS NULL THEN NULL
      WHEN elb.last_max_weight IS NULL THEN round_to_increment((tlr.min_weight + tlr.max_weight) / 2, in_increment)
      WHEN elb.last_max_weight < tlr.min_weight THEN round_to_increment(tlr.min_weight, in_increment)
      WHEN elb.last_max_weight > tlr.max_weight THEN round_to_increment(tlr.max_weight, in_increment)
      ELSE round_to_increment(elb.last_max_weight, in_increment)
    END AS suggested_weight,
    elb.last_date,
    elb.last_max_weight,
    elb.last_max_estimated_1rm
  FROM public.training_load_ranges(base_1rm) tlr
  LEFT JOIN public.exercise_last_best elb
    ON elb.client_id = in_client_id
   AND elb.exercise_id = in_exercise_id
  WHERE in_goal IS NULL OR tlr.goal = in_goal;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
