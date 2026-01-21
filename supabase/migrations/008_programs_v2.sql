-- =============================================
-- Programs v2 - Monthly sessions
-- =============================================

-- Drop legacy day-based tables
DROP TABLE IF EXISTS public.program_items CASCADE;
DROP TABLE IF EXISTS public.program_days CASCADE;

-- Program sessions (monthly calendar)
CREATE TABLE IF NOT EXISTS public.program_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  is_rest_day BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(program_id, date)
);

-- Session items (exercises in a session)
CREATE TABLE IF NOT EXISTS public.session_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_session_id UUID NOT NULL REFERENCES public.program_sessions(id) ON DELETE CASCADE,
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

-- Update workout logs to link sessions instead of days
ALTER TABLE public.workout_logs
  DROP CONSTRAINT IF EXISTS workout_logs_client_id_date_program_day_id_key;

ALTER TABLE public.workout_logs
  DROP COLUMN IF EXISTS program_day_id,
  ADD COLUMN IF NOT EXISTS program_session_id UUID REFERENCES public.program_sessions(id) ON DELETE SET NULL;

ALTER TABLE public.workout_logs
  ADD CONSTRAINT workout_logs_client_date_session_key UNIQUE (client_id, date, program_session_id);

CREATE INDEX IF NOT EXISTS idx_program_sessions_program_id ON public.program_sessions(program_id);
CREATE INDEX IF NOT EXISTS idx_program_sessions_date ON public.program_sessions(date);
CREATE INDEX IF NOT EXISTS idx_session_items_program_session_id ON public.session_items(program_session_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_program_session_id ON public.workout_logs(program_session_id);

ALTER TABLE public.program_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage program sessions"
  ON public.program_sessions FOR ALL
  USING (program_id IN (SELECT id FROM public.programs WHERE coach_id = auth.uid()));

CREATE POLICY "Clients can view their program sessions"
  ON public.program_sessions FOR SELECT
  USING (program_id IN (SELECT id FROM public.programs WHERE client_id = auth.uid()));

CREATE POLICY "Coaches can manage session items"
  ON public.session_items FOR ALL
  USING (program_session_id IN (
    SELECT ps.id FROM public.program_sessions ps
    JOIN public.programs p ON ps.program_id = p.id
    WHERE p.coach_id = auth.uid()
  ));

CREATE POLICY "Clients can view their session items"
  ON public.session_items FOR SELECT
  USING (program_session_id IN (
    SELECT ps.id FROM public.program_sessions ps
    JOIN public.programs p ON ps.program_id = p.id
    WHERE p.client_id = auth.uid()
  ));

CREATE TRIGGER update_program_sessions_updated_at BEFORE UPDATE ON public.program_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_items_updated_at BEFORE UPDATE ON public.session_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
