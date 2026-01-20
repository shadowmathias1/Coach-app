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

  const formData = await request.formData();
  const threadId = formData.get('threadId');
  const messageId = formData.get('messageId');
  const file = formData.get('file');

  if (typeof threadId !== 'string' || typeof messageId !== 'string' || !(file instanceof File)) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const userId = authData.user.id;
  const { data: membership } = await adminClient
    .from('chat_members')
    .select('id')
    .eq('thread_id', threadId)
    .eq('user_id', userId)
    .maybeSingle();
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const safeName = file.name.replace(/[\\/]/g, '_');
  const path = `${threadId}/${messageId}/${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await adminClient.storage
    .from('chat-attachments')
    .upload(path, buffer, {
      upsert: true,
      contentType: file.type || 'application/octet-stream',
    });

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ path });
}
