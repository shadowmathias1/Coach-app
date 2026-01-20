-- =============================================
-- Chat + Branding schema
-- =============================================

-- Chat threads
CREATE TABLE public.chat_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_group BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat members
CREATE TABLE public.chat_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('coach', 'client')),
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(thread_id, user_id)
);

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text TEXT,
  message_type TEXT NOT NULL DEFAULT 'text',
  parent_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat attachments
CREATE TABLE public.chat_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat reactions
CREATE TABLE public.chat_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Read receipts
CREATE TABLE public.chat_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Private coach notes per client
CREATE TABLE public.coach_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(coach_id, client_id)
);

-- Coach branding
CREATE TABLE public.coach_branding (
  coach_id UUID PRIMARY KEY REFERENCES public.coaches(id) ON DELETE CASCADE,
  brand_name TEXT,
  logo_url TEXT,
  primary_color TEXT,
  accent_color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_chat_threads_coach_id ON public.chat_threads(coach_id);
CREATE INDEX idx_chat_members_thread_id ON public.chat_members(thread_id);
CREATE INDEX idx_chat_members_user_id ON public.chat_members(user_id);
CREATE INDEX idx_chat_messages_thread_id ON public.chat_messages(thread_id);
CREATE INDEX idx_chat_messages_thread_id_created_at ON public.chat_messages(thread_id, created_at);
CREATE INDEX idx_chat_messages_parent_id ON public.chat_messages(parent_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX idx_chat_attachments_message_id ON public.chat_attachments(message_id);
CREATE INDEX idx_chat_reactions_message_id ON public.chat_reactions(message_id);
CREATE INDEX idx_chat_reads_message_id ON public.chat_reads(message_id);
CREATE INDEX idx_coach_notes_coach_id ON public.coach_notes(coach_id);
CREATE INDEX idx_coach_notes_client_id ON public.coach_notes(client_id);

-- =============================================
-- RLS
-- =============================================

ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_branding ENABLE ROW LEVEL SECURITY;

-- Helper to avoid RLS recursion when checking membership
CREATE OR REPLACE FUNCTION public.is_chat_member(_thread_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_members cm
    WHERE cm.thread_id = _thread_id
      AND cm.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_chat_owner(_thread_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_threads ct
    WHERE ct.id = _thread_id
      AND ct.coach_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_read_message(_message_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_messages m
    LEFT JOIN public.chat_members cm ON cm.thread_id = m.thread_id
    JOIN public.chat_threads ct ON ct.id = m.thread_id
    WHERE m.id = _message_id
      AND (
        cm.user_id = auth.uid()
        OR ct.coach_id = auth.uid()
      )
  );
$$;

-- Threads
CREATE POLICY "Members can view threads"
  ON public.chat_threads FOR SELECT
  USING (
    coach_id = auth.uid()
    OR public.is_chat_member(id)
  );

CREATE POLICY "Coaches can create threads"
  ON public.chat_threads FOR INSERT
  WITH CHECK (coach_id = auth.uid() AND created_by = auth.uid());

CREATE POLICY "Coaches can update threads"
  ON public.chat_threads FOR UPDATE
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete threads"
  ON public.chat_threads FOR DELETE
  USING (coach_id = auth.uid());

-- Members
CREATE POLICY "Members can view members"
  ON public.chat_members FOR SELECT
  USING (
    public.is_chat_member(thread_id)
    OR public.is_chat_owner(thread_id)
  );

CREATE POLICY "Coaches can add members"
  ON public.chat_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_threads ct
      WHERE ct.id = thread_id
      AND ct.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update members"
  ON public.chat_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads ct
      WHERE ct.id = chat_members.thread_id
      AND ct.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can remove members"
  ON public.chat_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads ct
      WHERE ct.id = chat_members.thread_id
      AND ct.coach_id = auth.uid()
    )
  );

CREATE POLICY "Members can leave threads"
  ON public.chat_members FOR DELETE
  USING (user_id = auth.uid());

-- Messages
CREATE POLICY "Members can view messages"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_members cm
      WHERE cm.thread_id = chat_messages.thread_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can send messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    sender_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chat_members cm
      WHERE cm.thread_id = chat_messages.thread_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Senders can update messages"
  ON public.chat_messages FOR UPDATE
  USING (sender_user_id = auth.uid());

CREATE POLICY "Senders can delete messages"
  ON public.chat_messages FOR DELETE
  USING (sender_user_id = auth.uid());

-- Attachments
CREATE POLICY "Members can view attachments"
  ON public.chat_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_messages m
      JOIN public.chat_members cm ON cm.thread_id = m.thread_id
      WHERE m.id = chat_attachments.message_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Message sender can add attachments"
  ON public.chat_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_messages m
      WHERE m.id = chat_attachments.message_id
      AND m.sender_user_id = auth.uid()
    )
  );

-- Reactions
CREATE POLICY "Members can view reactions"
  ON public.chat_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_messages m
      JOIN public.chat_members cm ON cm.thread_id = m.thread_id
      WHERE m.id = chat_reactions.message_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can react"
  ON public.chat_reactions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chat_messages m
      JOIN public.chat_members cm ON cm.thread_id = m.thread_id
      WHERE m.id = chat_reactions.message_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove reactions"
  ON public.chat_reactions FOR DELETE
  USING (user_id = auth.uid());

-- Read receipts
CREATE POLICY "Members can view reads"
  ON public.chat_reads FOR SELECT
  USING (
    public.can_read_message(message_id)
  );

CREATE POLICY "Members can add reads"
  ON public.chat_reads FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND public.can_read_message(message_id)
  );

CREATE POLICY "Members can update reads"
  ON public.chat_reads FOR UPDATE
  USING (
    user_id = auth.uid()
    AND public.can_read_message(message_id)
  );

-- Coach notes
CREATE POLICY "Coaches manage notes"
  ON public.coach_notes FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Branding
CREATE POLICY "Coaches manage branding"
  ON public.coach_branding FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Clients can view branding"
  ON public.coach_branding FOR SELECT
  USING (coach_id IN (SELECT coach_id FROM public.clients WHERE id = auth.uid()));

-- =============================================
-- Storage buckets + policies
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('branding-assets', 'branding-assets', TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Chat attachments upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND auth.role() = 'service_role'
  );

CREATE POLICY "Chat attachments read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-attachments'
    AND EXISTS (
      SELECT 1 FROM public.chat_attachments a
      JOIN public.chat_messages m ON m.id = a.message_id
      JOIN public.chat_members cm ON cm.thread_id = m.thread_id
      WHERE a.file_path = storage.objects.name
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Branding upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'branding-assets'
    AND auth.uid() IN (SELECT id FROM public.coaches)
  );

CREATE POLICY "Branding read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'branding-assets');

-- =============================================
-- Triggers
-- =============================================

CREATE TRIGGER update_coach_notes_updated_at BEFORE UPDATE ON public.coach_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_branding_updated_at BEFORE UPDATE ON public.coach_branding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
