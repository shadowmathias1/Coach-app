import { NextRequest, NextResponse } from 'next/server';
import {
  requireAuth,
  createSupabaseClients,
  ErrorResponses,
  parseJsonBody,
} from '@/lib/api-utils';
import { coachIdSchema, validateRequest } from '@/lib/validation';
import { sendEmail, getAppBaseUrl } from '@/lib/email-utils';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const body = await parseJsonBody(request);
  const validation = validateRequest(coachIdSchema, body);
  if (!validation.success) {
    return ErrorResponses.badRequest(validation.error);
  }

  const { coachId } = validation.data;
  const { adminClient } = createSupabaseClients();

  try {
        const { data: clientRow } = await adminClient
      .from('clients')
      .select('display_name, coach_id')
      .eq('id', authResult.user.id)
      .maybeSingle();

    if (!clientRow || clientRow.coach_id !== coachId) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const { data: coachUser, error: coachError } =
      await adminClient.auth.admin.getUserById(coachId);
    if (coachError || !coachUser?.user?.email) {
      return NextResponse.json({ error: 'Coach not found.' }, { status: 404 });
    }

    const coachPrefs =
      (coachUser.user.user_metadata?.notifications as
        | { newClient?: boolean }
        | undefined) || {};
    if (coachPrefs.newClient === false) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const displayName = clientRow.display_name || 'Nouveau client';
    
    try {
      await sendEmail({
        to: coachUser.user.email,
        subject: `Nouveau client: ${displayName}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2 style="margin: 0 0 12px;">Un nouveau client vient de rejoindre</h2>
            <p style="margin: 0 0 8px;"><strong>${displayName}</strong> vient d'utiliser ton code d'invitation.</p>
            <p style="margin: 0 0 16px;">Connecte-toi pour personnaliser son programme.</p>
            <a href="${getAppBaseUrl()}/coach/clients" style="display: inline-block; padding: 10px 16px; background: #3b82f6; color: #fff; text-decoration: none; border-radius: 8px;">Voir mes clients</a>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      return ErrorResponses.serverError('Email send failed.');
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json(
      { error: 'Notification failed.' },
      { status: 500 }
    );
  }
}
