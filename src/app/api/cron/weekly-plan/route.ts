import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClients, ErrorResponses } from '@/lib/api-utils';
import { requireCronAuth } from '@/lib/cron-utils';
import { getWeekStartDate, getWeekNumber } from '@/lib/date-utils';

export async function GET(request: NextRequest) {
  const cronAuthError = requireCronAuth(request);
  if (cronAuthError) {
    return cronAuthError;
  }

  try {
    const { adminClient } = createSupabaseClients();

    const { data: programs } = await adminClient
      .from('programs')
      .select('id, coach_id, client_id, title, start_date')
      .eq('is_active', true)
      .not('client_id', 'is', null);

    const weekStart = getWeekStartDate();
    const weekStartDate = new Date(`${weekStart}T00:00:00Z`);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setUTCDate(weekStartDate.getUTCDate() + 6);
    const weekEnd = weekEndDate.toISOString().split('T')[0];

    for (const program of programs || []) {
      if (!program.client_id || !program.start_date) continue;
      const weekNumber = getWeekNumber(program.start_date);

      const { data: sessions } = await adminClient
        .from('program_sessions')
        .select('date, title, is_rest_day')
        .eq('program_id', program.id)
        .gte('date', weekStart)
        .lte('date', weekEnd)
        .order('date', { ascending: true });

      if (!sessions || sessions.length === 0) continue;

      const { data: threadLink } = await adminClient
        .from('chat_members')
        .select('thread_id, chat_threads!inner(id, coach_id, is_group)')
        .eq('user_id', program.client_id)
        .eq('chat_threads.coach_id', program.coach_id)
        .eq('chat_threads.is_group', false)
        .maybeSingle();

      let threadId = threadLink?.thread_id;
      if (!threadId) {
        const { data: clientRow } = await adminClient
          .from('clients')
          .select('display_name')
          .eq('id', program.client_id)
          .maybeSingle();
        const title = clientRow?.display_name || 'Conversation';
        const { data: newThread } = await adminClient
          .from('chat_threads')
          .insert({
            coach_id: program.coach_id,
            title,
            is_group: false,
            created_by: program.coach_id,
          })
          .select()
          .single();
        threadId = newThread?.id;
        if (threadId) {
          await adminClient.from('chat_members').insert([
            { thread_id: threadId, user_id: program.coach_id, role: 'coach' },
            { thread_id: threadId, user_id: program.client_id, role: 'client' },
          ]);
        }
      }

      if (!threadId) continue;

      const { data: existing } = await adminClient
        .from('chat_messages')
        .select('id')
        .eq('thread_id', threadId)
        .eq('message_type', 'system')
        .gte('created_at', `${weekStart}T00:00:00Z`);

      if (existing && existing.length > 0) continue;

      const dayLines = sessions
        .map((session) => {
          const label = session.is_rest_day ? 'Repos' : session.title;
          return `${session.date}: ${label}`;
        })
        .join('\n');
      const text = `Plan semaine ${weekNumber} (${program.title})\n${dayLines}`;

      await adminClient.from('chat_messages').insert({
        thread_id: threadId,
        sender_user_id: program.coach_id,
        text,
        message_type: 'system',
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Weekly plan error:', error);
    return NextResponse.json(
      { error: 'Weekly plan failed.' },
      { status: 500 }
    );
  }
}
