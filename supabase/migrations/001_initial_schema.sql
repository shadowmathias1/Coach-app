-- =============================================
-- Coach App - Initial Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('coach', 'client')),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Coaches table
CREATE TABLE public.coaches (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  brand_name TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  age INTEGER CHECK (age >= 0),
  height DECIMAL(5, 2) CHECK (height > 0),
  weight DECIMAL(5, 2) CHECK (weight > 0),
  goal TEXT,
  injuries TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exercises library (per coach)
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  muscle_group TEXT,
  equipment TEXT,
  video_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Programs
CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_template BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT programs_template_requires_no_client CHECK (NOT is_template OR client_id IS NULL)
);

-- Program days (structure: week -> day)
CREATE TABLE public.program_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number >= 1),
  day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 7),
  title TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(program_id, week_number, day_number)
);

-- Program items (exercises in a day)
CREATE TABLE public.program_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_day_id UUID NOT NULL REFERENCES public.program_days(id) ON DELETE CASCADE,
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

-- Workout logs (client's completed sessions)
CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  program_day_id UUID REFERENCES public.program_days(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  duration_minutes INTEGER CHECK (duration_minutes >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_id, date, program_day_id)
);

-- Workout entries (sets/reps/weight per exercise)
CREATE TABLE public.workout_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_log_id UUID NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  exercise_name TEXT NOT NULL,
  sets_json JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Check-ins (weekly client feedback)
CREATE TABLE public.checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  weight DECIMAL(5, 2) CHECK (weight > 0),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
  soreness_level INTEGER CHECK (soreness_level >= 1 AND soreness_level <= 5),
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, week_start_date)
);

-- Messages (coach <-> client chat)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  read_by_coach BOOLEAN NOT NULL DEFAULT FALSE,
  read_by_client BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_clients_coach_id ON public.clients(coach_id);
CREATE INDEX idx_clients_coach_id_joined_at ON public.clients(coach_id, joined_at);
CREATE INDEX idx_exercises_coach_id ON public.exercises(coach_id);
CREATE INDEX idx_programs_coach_id ON public.programs(coach_id);
CREATE INDEX idx_programs_client_id ON public.programs(client_id);
CREATE INDEX idx_program_days_program_id ON public.program_days(program_id);
CREATE INDEX idx_program_items_program_day_id ON public.program_items(program_day_id);
CREATE INDEX idx_workout_logs_client_id ON public.workout_logs(client_id);
CREATE INDEX idx_workout_logs_coach_id ON public.workout_logs(coach_id);
CREATE INDEX idx_workout_logs_client_id_date ON public.workout_logs(client_id, date);
CREATE INDEX idx_workout_logs_coach_id_date ON public.workout_logs(coach_id, date);
CREATE INDEX idx_workout_logs_date ON public.workout_logs(date);
CREATE INDEX idx_workout_entries_workout_log_id ON public.workout_entries(workout_log_id);
CREATE INDEX idx_checkins_client_id ON public.checkins(client_id);
CREATE INDEX idx_checkins_client_id_week_start_date ON public.checkins(client_id, week_start_date);
CREATE INDEX idx_checkins_coach_id_week_start_date ON public.checkins(coach_id, week_start_date);
CREATE INDEX idx_checkins_week_start_date ON public.checkins(week_start_date);
CREATE INDEX idx_messages_coach_id ON public.messages(coach_id);
CREATE INDEX idx_messages_client_id ON public.messages(client_id);
CREATE INDEX idx_messages_sender_user_id ON public.messages(sender_user_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Coaches policies
CREATE POLICY "Coaches can view their own profile"
  ON public.coaches FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Coaches can insert their own profile"
  ON public.coaches FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Coaches can update their own profile"
  ON public.coaches FOR UPDATE
  USING (auth.uid() = id);

-- Clients policies
CREATE POLICY "Clients can view their own profile"
  ON public.clients FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Clients can update their own profile"
  ON public.clients FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Coaches can view their clients"
  ON public.clients FOR SELECT
  USING (coach_id IN (SELECT id FROM public.coaches WHERE id = auth.uid()));

CREATE POLICY "Coaches can update their clients"
  ON public.clients FOR UPDATE
  USING (coach_id IN (SELECT id FROM public.coaches WHERE id = auth.uid()));

CREATE POLICY "Coaches can insert clients"
  ON public.clients FOR INSERT
  WITH CHECK (coach_id IN (SELECT id FROM public.coaches WHERE id = auth.uid()));

CREATE POLICY "Coaches can delete their clients"
  ON public.clients FOR DELETE
  USING (coach_id IN (SELECT id FROM public.coaches WHERE id = auth.uid()));

-- Exercises policies
CREATE POLICY "Coaches can manage their exercises"
  ON public.exercises FOR ALL
  USING (coach_id = auth.uid());

CREATE POLICY "Clients can view their coach's exercises"
  ON public.exercises FOR SELECT
  USING (coach_id IN (SELECT coach_id FROM public.clients WHERE id = auth.uid()));

-- Programs policies
CREATE POLICY "Coaches can manage their programs"
  ON public.programs FOR ALL
  USING (coach_id = auth.uid());

CREATE POLICY "Clients can view their programs"
  ON public.programs FOR SELECT
  USING (client_id = auth.uid());

-- Program days policies
CREATE POLICY "Coaches can manage program days"
  ON public.program_days FOR ALL
  USING (program_id IN (SELECT id FROM public.programs WHERE coach_id = auth.uid()));

CREATE POLICY "Clients can view their program days"
  ON public.program_days FOR SELECT
  USING (program_id IN (SELECT id FROM public.programs WHERE client_id = auth.uid()));

-- Program items policies
CREATE POLICY "Coaches can manage program items"
  ON public.program_items FOR ALL
  USING (program_day_id IN (
    SELECT pd.id FROM public.program_days pd
    JOIN public.programs p ON pd.program_id = p.id
    WHERE p.coach_id = auth.uid()
  ));

CREATE POLICY "Clients can view their program items"
  ON public.program_items FOR SELECT
  USING (program_day_id IN (
    SELECT pd.id FROM public.program_days pd
    JOIN public.programs p ON pd.program_id = p.id
    WHERE p.client_id = auth.uid()
  ));

-- Workout logs policies
CREATE POLICY "Clients can manage their workout logs"
  ON public.workout_logs FOR ALL
  USING (client_id = auth.uid());

CREATE POLICY "Coaches can view their clients' workout logs"
  ON public.workout_logs FOR SELECT
  USING (coach_id = auth.uid());

-- Workout entries policies
CREATE POLICY "Clients can manage their workout entries"
  ON public.workout_entries FOR ALL
  USING (workout_log_id IN (SELECT id FROM public.workout_logs WHERE client_id = auth.uid()));

CREATE POLICY "Coaches can view their clients' workout entries"
  ON public.workout_entries FOR SELECT
  USING (workout_log_id IN (SELECT id FROM public.workout_logs WHERE coach_id = auth.uid()));

-- Check-ins policies
CREATE POLICY "Clients can manage their check-ins"
  ON public.checkins FOR ALL
  USING (client_id = auth.uid());

CREATE POLICY "Coaches can view their clients' check-ins"
  ON public.checkins FOR SELECT
  USING (coach_id = auth.uid());

-- Messages policies
CREATE POLICY "Coaches can view their messages"
  ON public.messages FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Clients can view their messages"
  ON public.messages FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Coaches can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (coach_id = auth.uid() AND sender_user_id = auth.uid());

CREATE POLICY "Clients can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (client_id = auth.uid() AND sender_user_id = auth.uid());

CREATE POLICY "Users can update their message read status"
  ON public.messages FOR UPDATE
  USING (coach_id = auth.uid() OR client_id = auth.uid())
  WITH CHECK (coach_id = auth.uid() OR client_id = auth.uid());

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to prevent editing immutable message fields
CREATE OR REPLACE FUNCTION restrict_message_updates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.text IS DISTINCT FROM OLD.text
     OR NEW.coach_id IS DISTINCT FROM OLD.coach_id
     OR NEW.client_id IS DISTINCT FROM OLD.client_id
     OR NEW.sender_user_id IS DISTINCT FROM OLD.sender_user_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Only read status can be updated';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coaches_updated_at BEFORE UPDATE ON public.coaches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON public.programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_program_days_updated_at BEFORE UPDATE ON public.program_days
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_program_items_updated_at BEFORE UPDATE ON public.program_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_logs_updated_at BEFORE UPDATE ON public.workout_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checkins_updated_at BEFORE UPDATE ON public.checkins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-generate invite code on coach creation
CREATE OR REPLACE FUNCTION create_coach_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    LOOP
      NEW.invite_code := generate_invite_code();
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM public.coaches WHERE invite_code = NEW.invite_code
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_invite_code_on_coach_insert
  BEFORE INSERT ON public.coaches
  FOR EACH ROW EXECUTE FUNCTION create_coach_invite_code();

CREATE TRIGGER restrict_message_updates_on_change
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION restrict_message_updates();
