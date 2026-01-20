import { NextRequest, NextResponse } from 'next/server';
import {
  requireAuth,
  createSupabaseClients,
  ErrorResponses,
  parseJsonBody,
} from '@/lib/api-utils';
import { accountDeleteSchema, validateRequest } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const body = await parseJsonBody(request);
  const validation = validateRequest(accountDeleteSchema, body);
  if (!validation.success) {
    return ErrorResponses.badRequest(validation.error);
  }

  const { role } = validation.data;
  const { adminClient } = createSupabaseClients();

  try {
    const userId = authResult.user.id;

    const { data: userRow } = await adminClient
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    const effectiveRole = (userRow?.role || role || 'client') as
      | 'coach'
      | 'client';

    if (effectiveRole === 'coach') {
      const { data: clients } = await adminClient
        .from('clients')
        .select('id')
        .eq('coach_id', userId);

      if (clients && clients.length > 0) {
        return NextResponse.json(
          { error: 'Supprime d abord tes clients ou transfere-les.' },
          { status: 409 }
        );
      }

      await adminClient.from('chat_threads').delete().eq('coach_id', userId);
      await adminClient.from('coach_notes').delete().eq('coach_id', userId);
      await adminClient.from('coach_branding').delete().eq('coach_id', userId);
      await adminClient.from('messages').delete().eq('coach_id', userId);
      await adminClient.from('checkins').delete().eq('coach_id', userId);
      await adminClient.from('workout_logs').delete().eq('coach_id', userId);
      await adminClient.from('programs').delete().eq('coach_id', userId);
      await adminClient.from('exercises').delete().eq('coach_id', userId);
      await adminClient.from('coaches').delete().eq('id', userId);
    } else {
      const { data: workoutLogs } = await adminClient
        .from('workout_logs')
        .select('id')
        .eq('client_id', userId);

      const logIds = workoutLogs?.map((log) => log.id) || [];
      if (logIds.length > 0) {
        await adminClient
          .from('workout_entries')
          .delete()
          .in('workout_log_id', logIds);
      }

      await adminClient.from('checkins').delete().eq('client_id', userId);
      await adminClient.from('chat_reads').delete().eq('user_id', userId);
      await adminClient.from('chat_reactions').delete().eq('user_id', userId);
      await adminClient.from('chat_messages').delete().eq('sender_user_id', userId);
      await adminClient.from('chat_members').delete().eq('user_id', userId);
      await adminClient.from('coach_notes').delete().eq('client_id', userId);
      await adminClient.from('messages').delete().eq('client_id', userId);
      await adminClient.from('workout_logs').delete().eq('client_id', userId);
      await adminClient
        .from('programs')
        .update({ client_id: null })
        .eq('client_id', userId);
      await adminClient.from('clients').delete().eq('id', userId);
    }

    await adminClient.from('users').delete().eq('id', userId);

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(
      userId
    );
    if (deleteError) {
      return NextResponse.json(
        { error: 'Suppression Auth impossible.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Suppression impossible.' },
      { status: 500 }
    );
  }
}
