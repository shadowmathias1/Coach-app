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

  try {
    const userId = authData.user.id;

    const { data: userRow } = await adminClient
      .from('users')
      .select('role, name')
      .eq('id', userId)
      .maybeSingle();
    if (!userRow || userRow.role !== 'client') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const { data: clientRow } = await adminClient
      .from('clients')
      .select('coach_id')
      .eq('id', userId)
      .single();
    if (!clientRow) {
      return NextResponse.json({ error: 'Client not found.' }, { status: 404 });
    }

    const { data: existing } = await adminClient
      .from('chat_members')
      .select('thread_id, chat_threads!inner(id, coach_id, is_group)')
      .eq('user_id', userId)
      .eq('chat_threads.coach_id', clientRow.coach_id)
      .eq('chat_threads.is_group', false)
      .maybeSingle();

    if (existing?.thread_id) {
      return NextResponse.json({ threadId: existing.thread_id });
    }

    const { data: coachUser } = await adminClient
      .from('users')
      .select('name')
      .eq('id', clientRow.coach_id)
      .maybeSingle();
    const title = coachUser?.name || 'Coach';

    const { data: thread, error: threadError } = await adminClient
      .from('chat_threads')
      .insert({
        coach_id: clientRow.coach_id,
        title,
        is_group: false,
        created_by: clientRow.coach_id,
      })
      .select()
      .single();
    if (threadError || !thread) throw threadError;

    await adminClient.from('chat_members').insert([
      { thread_id: thread.id, user_id: clientRow.coach_id, role: 'coach' },
      { thread_id: thread.id, user_id: userId, role: 'client' },
    ]);

    return NextResponse.json({ threadId: thread.id });
  } catch (error) {
    console.error('Bootstrap error:', error);
    return NextResponse.json(
      { error: 'Bootstrap failed.' },
      { status: 500 }
    );
  }
}
