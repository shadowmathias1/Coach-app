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

  const { attachmentId } = (await request.json().catch(() => ({}))) as {
    attachmentId?: string;
  };
  if (!attachmentId) {
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

  const { data: attachment } = await adminClient
    .from('chat_attachments')
    .select('id, file_path, message_id')
    .eq('id', attachmentId)
    .maybeSingle();
  if (!attachment) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const { data: message } = await adminClient
    .from('chat_messages')
    .select('id, sender_user_id, thread_id')
    .eq('id', attachment.message_id)
    .maybeSingle();
  if (!message) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  if (message.sender_user_id !== userId) {
    const { data: thread } = await adminClient
      .from('chat_threads')
      .select('coach_id')
      .eq('id', message.thread_id)
      .maybeSingle();
    if (!thread || thread.coach_id !== userId) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }
  }

  await adminClient.storage.from('chat-attachments').remove([attachment.file_path]);
  await adminClient.from('chat_attachments').delete().eq('id', attachmentId);

  return NextResponse.json({ ok: true });
}
