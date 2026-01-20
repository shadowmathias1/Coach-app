import { NextRequest, NextResponse } from 'next/server';
import {
  requireAuth,
  createSupabaseClients,
  ErrorResponses,
  parseJsonBody,
} from '@/lib/api-utils';
import { messageIdSchema, validateRequest } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const body = await parseJsonBody(request);
  const validation = validateRequest(messageIdSchema, body);
  if (!validation.success) {
    return ErrorResponses.badRequest(validation.error);
  }

  const { messageId } = validation.data;
  const { adminClient } = createSupabaseClients();
  const userId = authResult.user.id;
  const { data: message } = await adminClient
    .from('chat_messages')
    .select('id, sender_user_id, thread_id')
    .eq('id', messageId)
    .maybeSingle();
  if (!message) {
    return ErrorResponses.notFound();
  }

  if (message.sender_user_id !== userId) {
    const { data: thread } = await adminClient
      .from('chat_threads')
      .select('coach_id')
      .eq('id', message.thread_id)
      .maybeSingle();
    if (!thread || thread.coach_id !== userId) {
      return ErrorResponses.forbidden();
    }
  }

  const { data: attachmentRows } = await adminClient
    .from('chat_attachments')
    .select('id, file_path')
    .eq('message_id', messageId);

  const filePaths = (attachmentRows || []).map((row) => row.file_path);
  if (filePaths.length > 0) {
    await adminClient.storage.from('chat-attachments').remove(filePaths);
  }

  if ((attachmentRows || []).length > 0) {
    await adminClient
      .from('chat_attachments')
      .delete()
      .eq('message_id', messageId);
  }

  await adminClient.from('chat_messages').delete().eq('id', messageId);

  return NextResponse.json({
    ok: true,
    deletedAttachmentIds: (attachmentRows || []).map((row) => row.id),
  });
}
