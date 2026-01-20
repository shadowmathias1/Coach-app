import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Missing Supabase configuration.' },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { threadId } = (await request.json().catch(() => ({}))) as {
    threadId?: string;
  };
  if (!threadId) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const anonClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
  const { data: authData, error: authError } = await anonClient.auth.getUser(
    token
  );
  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const userId = authData.user.id;
  const { data: member } = await adminClient
    .from('chat_members')
    .select('id')
    .eq('thread_id', threadId)
    .eq('user_id', userId)
    .maybeSingle();
  if (!member) {
    const { data: thread } = await adminClient
      .from('chat_threads')
      .select('coach_id')
      .eq('id', threadId)
      .maybeSingle();
    if (!thread || thread.coach_id !== userId) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }
  }

  const { count } = await adminClient
    .from('chat_members')
    .select('id', { count: 'exact', head: true })
    .eq('thread_id', threadId);

  if ((count || 0) > 0) {
    return NextResponse.json({ ok: true, deleted: false });
  }

  const { data: attachmentRows } = await adminClient
    .from('chat_attachments')
    .select('file_path, chat_messages!inner(thread_id)')
    .eq('chat_messages.thread_id', threadId);

  const filePaths = (attachmentRows || []).map((row) => row.file_path);
  if (filePaths.length > 0) {
    await adminClient.storage.from('chat-attachments').remove(filePaths);
  }

  await adminClient.from('chat_threads').delete().eq('id', threadId);

  return NextResponse.json({ ok: true, deleted: true });
}
