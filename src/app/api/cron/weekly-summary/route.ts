import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClients, ErrorResponses } from '@/lib/api-utils';
import { requireCronAuth } from '@/lib/cron-utils';
import { sendEmail, getAppBaseUrl } from '@/lib/email-utils';
import { getRangeStartDate } from '@/lib/date-utils';

export async function GET(request: NextRequest) {
  const cronAuthError = requireCronAuth(request);
  if (cronAuthError) {
    return cronAuthError;
  }

  try {
    const { adminClient } = createSupabaseClients();

    const rangeStart = getRangeStartDate(7);
    const [{ data: coaches }, { data: clients }, { data: workouts }, { data: checkins }] =
      await Promise.all([
        adminClient.from('coaches').select('id, brand_name'),
        adminClient.from('clients').select('id, coach_id'),
        adminClient
          .from('workout_logs')
          .select('coach_id, client_id')
          .gte('date', rangeStart),
        adminClient
          .from('checkins')
          .select('coach_id, client_id')
          .gte('week_start_date', rangeStart),
      ]);

    const clientCountByCoach = new Map<string, number>();
    (clients || []).forEach((client) => {
      clientCountByCoach.set(
        client.coach_id,
        (clientCountByCoach.get(client.coach_id) || 0) + 1
      );
    });

    const workoutCountByCoach = new Map<string, number>();
    const checkinCountByCoach = new Map<string, number>();
    const activeByCoach = new Map<string, Set<string>>();

    (workouts || []).forEach((row) => {
      workoutCountByCoach.set(
        row.coach_id,
        (workoutCountByCoach.get(row.coach_id) || 0) + 1
      );
      const set = activeByCoach.get(row.coach_id) || new Set<string>();
      set.add(row.client_id);
      activeByCoach.set(row.coach_id, set);
    });

    (checkins || []).forEach((row) => {
      checkinCountByCoach.set(
        row.coach_id,
        (checkinCountByCoach.get(row.coach_id) || 0) + 1
      );
      const set = activeByCoach.get(row.coach_id) || new Set<string>();
      set.add(row.client_id);
      activeByCoach.set(row.coach_id, set);
    });

    for (const coach of coaches || []) {
      const { data: coachUser } = await adminClient.auth.admin.getUserById(
        coach.id
      );
      const coachEmail = coachUser?.user?.email;
      if (!coachEmail) continue;

      const prefs =
        (coachUser?.user?.user_metadata?.notifications as
          | { weeklySummary?: boolean }
          | undefined) || {};
      if (prefs.weeklySummary === false) continue;

      const totalClients = clientCountByCoach.get(coach.id) || 0;
      const activeClients = activeByCoach.get(coach.id)?.size || 0;
      const workoutsCount = workoutCountByCoach.get(coach.id) || 0;
      const checkinsCount = checkinCountByCoach.get(coach.id) || 0;

      await sendEmail({
        to: coachEmail,
        subject: 'Resume hebdo de tes clients',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2 style="margin: 0 0 12px;">Resume hebdo</h2>
            <p style="margin: 0 0 12px;">Activite des 7 derniers jours.</p>
            <ul style="padding-left: 18px; margin: 0 0 12px;">
              <li>Clients actifs: ${activeClients}/${totalClients}</li>
              <li>Workouts enregistres: ${workoutsCount}</li>
              <li>Check-ins completes: ${checkinsCount}</li>
            </ul>
            <a href="${getAppBaseUrl()}/coach/dashboard" style="display: inline-block; padding: 10px 16px; background: #22c55e; color: #fff; text-decoration: none; border-radius: 8px;">Voir le dashboard</a>
          </div>
        `,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Weekly summary error:', error);
    return NextResponse.json(
      { error: 'Notification failed.' },
      { status: 500 }
    );
  }
}
