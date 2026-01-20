import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClients, ErrorResponses } from '@/lib/api-utils';
import { requireCronAuth } from '@/lib/cron-utils';
import { sendEmail, getAppBaseUrl } from '@/lib/email-utils';
import { getWeekStartDate } from '@/lib/date-utils';

export async function GET(request: NextRequest) {
  const cronAuthError = requireCronAuth(request);
  if (cronAuthError) {
    return cronAuthError;
  }

  try {
    const { adminClient } = createSupabaseClients();
    const weekStart = getWeekStartDate();
    const [{ data: coaches }, { data: clients }, { data: checkins }] =
      await Promise.all([
        adminClient.from('coaches').select('id, brand_name'),
        adminClient.from('clients').select('id, coach_id, display_name'),
        adminClient
          .from('checkins')
          .select('client_id, coach_id')
          .eq('week_start_date', weekStart),
      ]);

    const clientsByCoach = new Map<string, typeof clients>();
    (clients || []).forEach((client) => {
      const group = clientsByCoach.get(client.coach_id) || [];
      group.push(client);
      clientsByCoach.set(client.coach_id, group);
    });

    const checkinsByCoach = new Map<string, Set<string>>();
    (checkins || []).forEach((checkin) => {
      const set = checkinsByCoach.get(checkin.coach_id) || new Set<string>();
      set.add(checkin.client_id);
      checkinsByCoach.set(checkin.coach_id, set);
    });

    for (const coach of coaches || []) {
      const coachClients = clientsByCoach.get(coach.id) || [];
      if (coachClients.length === 0) continue;
      const checked = checkinsByCoach.get(coach.id) || new Set<string>();
      const missing = coachClients.filter((client) => !checked.has(client.id));
      if (missing.length === 0) continue;

      const { data: coachUser } = await adminClient.auth.admin.getUserById(
        coach.id
      );
      const coachEmail = coachUser?.user?.email;
      if (!coachEmail) continue;

      const prefs =
        (coachUser?.user?.user_metadata?.notifications as
          | { checkinReminders?: boolean }
          | undefined) || {};
      if (prefs.checkinReminders === false) continue;

      const preview = missing.slice(0, 5).map((client) => client.display_name);
      const extraCount = Math.max(0, missing.length - preview.length);

      await sendEmail({
        to: coachEmail,
        subject: `Check-in en attente (${missing.length})`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2 style="margin: 0 0 12px;">Check-ins en attente cette semaine</h2>
            <p style="margin: 0 0 12px;">${missing.length} client(s) n'ont pas encore complete leur check-in.</p>
            <ul style="padding-left: 18px; margin: 0 0 12px;">
              ${preview.map((name) => `<li>${name}</li>`).join('')}
            </ul>
            ${
              extraCount > 0
                ? `<p style="margin: 0 0 12px;">+${extraCount} autre(s)</p>`
                : ''
            }
            <a href="${getAppBaseUrl()}/coach/clients" style="display: inline-block; padding: 10px 16px; background: #f59e0b; color: #fff; text-decoration: none; border-radius: 8px;">Relancer mes clients</a>
          </div>
        `,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Checkin reminder error:', error);
    return NextResponse.json(
      { error: 'Notification failed.' },
      { status: 500 }
    );
  }
}
