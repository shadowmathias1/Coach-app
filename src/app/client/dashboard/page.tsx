'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, TrendingUp, MessageSquare, Calendar, Bell, Target, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import Badge from '@/components/ui/Badge';
import MovingButton from '@/components/ui/MovingButton';
import MagicCard from '@/components/ui/MagicCard';
import ClientLayout from '@/components/layout/ClientLayout';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { ensureClientProfile } from '@/lib/clientProfile';
import { toast } from 'sonner';
import { useLanguage } from '@/components/shared/LanguageProvider';
import { useUnits } from '@/components/shared/UnitProvider';
import { kgToLb } from '@/lib/units';

interface ClientData {
  id: string;
  display_name: string;
  goal: string | null;
  coach_id: string;
}

interface CoachData {
  brand_name: string | null;
}

interface WeightPoint {
  week: string;
  weight: number;
}

interface WorkoutPoint {
  week: string;
  count: number;
}

export default function ClientDashboardPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { unit } = useUnits();
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [coachName, setCoachName] = useState<string>('');
  const [status, setStatus] = useState({
    workoutToday: false,
    checkinThisWeek: false,
  });
  const [stats, setStats] = useState({
    workoutsThisWeek: 0,
    totalWorkouts: 0,
    unreadMessages: 0,
  });
  const [weightTrend, setWeightTrend] = useState<WeightPoint[]>([]);
  const [workoutTrend, setWorkoutTrend] = useState<WorkoutPoint[]>([]);

  const t = language === 'fr'
    ? {
        welcome: 'Bienvenue',
        workoutToday: 'Seance du jour',
        completed: 'Termine',
        due: 'A faire',
        workoutDone: 'Bien joue, seance terminee.',
        workoutPrompt: 'Ajoute ta seance pour rester regulier',
        viewProgram: 'Voir le programme',
        checkinWeekly: 'Check-in hebdo',
        checkinDone: 'Check-in de la semaine complete.',
        checkinPrompt: 'Temps pour ton check-in',
        startCheckin: 'Commencer',
        reminders: 'Rappels',
        remindersBody: 'Garde le rythme',
        reminderWorkout: 'Seance aujourd hui',
        reminderWorkoutDone: 'Complete. Bravo !',
        reminderWorkoutTodo: 'Pas encore. Ajoute ta seance.',
        logWorkout: 'Logger la seance',
        reminderCheckin: 'Check-in hebdo',
        reminderCheckinDone: 'Complete pour cette semaine.',
        reminderCheckinTodo: 'En attente. Cela prend 1 minute.',
        workoutsThisWeek: 'Seances cette semaine',
        totalWorkouts: 'Total seances',
        unreadMessages: 'Messages non lus',
        weightTrend: 'Poids dans le temps',
        workoutsPerWeek: 'Seances par semaine',
        noWeight: 'Pas de donnees poids. Fais un check-in.',
        noWorkouts: 'Aucune seance pour le moment.',
        yourGoal: 'Objectif',
        coachLabel: 'Coach',
        loadFail: 'Impossible de charger le tableau de bord',
        loading: 'Chargement...',
      }
    : {
        welcome: 'Welcome back',
        workoutToday: "Today's workout",
        completed: 'Completed',
        due: 'Due',
        workoutDone: 'Nice work! Session completed.',
        workoutPrompt: 'Log your session to stay on track',
        viewProgram: 'View program',
        checkinWeekly: 'Weekly check-in',
        checkinDone: 'Check-in completed for this week.',
        checkinPrompt: 'Time for your weekly progress update',
        startCheckin: 'Start check-in',
        reminders: 'Reminders',
        remindersBody: 'Stay on top of your plan',
        reminderWorkout: 'Workout today',
        reminderWorkoutDone: 'Completed. Great job!',
        reminderWorkoutTodo: 'No log yet. Add your session.',
        logWorkout: 'Log workout',
        reminderCheckin: 'Weekly check-in',
        reminderCheckinDone: 'Completed for this week.',
        reminderCheckinTodo: 'Pending. It only takes a minute.',
        workoutsThisWeek: 'Workouts this week',
        totalWorkouts: 'Total workouts',
        unreadMessages: 'Unread messages',
        weightTrend: 'Weight trend',
        workoutsPerWeek: 'Workouts per week',
        noWeight: 'No weight data yet. Complete your next check-in.',
        noWorkouts: 'No workouts logged yet.',
        yourGoal: 'Your goal',
        coachLabel: 'Coach',
        loadFail: 'Failed to load dashboard',
        loading: 'Loading...',
      };

  const locale = language === 'fr' ? 'fr-FR' : 'en-US';

  const getWeekStartDate = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff)).toISOString().split('T')[0];
  };

  const getWeekStartFromDate = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(date);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  const formatWeekLabel = (dateValue: string) => {
    const date = new Date(dateValue);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const loadDashboard = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const clientProfile = await ensureClientProfile(user);
      if (!clientProfile) throw new Error('Client profile missing');

      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, display_name, goal, coach_id')
        .eq('id', user.id)
        .maybeSingle();

      if (clientError || !client) throw new Error('Client profile missing');
      setClientData(client as ClientData);

      const today = new Date();
      const todayDate = today.toISOString().split('T')[0];
      const weekStartDate = getWeekStartDate();

      const startRange = new Date();
      startRange.setDate(startRange.getDate() - 42);
      const startRangeIso = startRange.toISOString().split('T')[0];

      const coachPromise = client?.coach_id
        ? supabase.from('coaches').select('brand_name').eq('id', client.coach_id).single()
        : Promise.resolve({ data: null });

      const [
        { data: coach },
        { count: weekCount },
        { count: totalCount },
        { count: todayCount },
        { count: checkinCount },
        { data: checkinTrend },
        { data: workoutDates },
        { data: memberThreads },
      ] = await Promise.all([
        coachPromise,
        supabase
          .from('workout_logs')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', user.id)
          .gte('date', weekStartDate),
        supabase
          .from('workout_logs')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', user.id),
        supabase
          .from('workout_logs')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', user.id)
          .eq('date', todayDate),
        supabase
          .from('checkins')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', user.id)
          .eq('week_start_date', weekStartDate),
        supabase
          .from('checkins')
          .select('week_start_date, weight')
          .eq('client_id', user.id)
          .not('weight', 'is', null)
          .order('week_start_date', { ascending: true })
          .limit(8),
        supabase
          .from('workout_logs')
          .select('date')
          .eq('client_id', user.id)
          .gte('date', startRangeIso)
          .order('date', { ascending: true }),
        supabase
          .from('chat_members')
          .select('thread_id')
          .eq('user_id', user.id),
      ]);

      if (coach) {
        setCoachName((coach as CoachData).brand_name || 'Coach');
      }

      const weightPoints =
        checkinTrend?.map((entry) => ({
          week: formatWeekLabel(entry.week_start_date),
          weight: Number(entry.weight),
        })) || [];

      const weeklyMap = new Map<string, number>();
      const currentWeekStart = getWeekStartFromDate(today);
      for (let i = 5; i >= 0; i -= 1) {
        const week = new Date(currentWeekStart);
        week.setDate(currentWeekStart.getDate() - i * 7);
        weeklyMap.set(week.toISOString().split('T')[0], 0);
      }

      (workoutDates || []).forEach((entry) => {
        const weekStart = getWeekStartFromDate(new Date(entry.date));
        const key = weekStart.toISOString().split('T')[0];
        weeklyMap.set(key, (weeklyMap.get(key) || 0) + 1);
      });

      const workoutPoints = Array.from(weeklyMap.entries()).map(([week, count]) => ({
        week: formatWeekLabel(week),
        count,
      }));

      let unreadCount = 0;
      const threadIds = (memberThreads || []).map(
        (row: { thread_id: string }) => row.thread_id
      );
      if (threadIds.length > 0) {
        const { data: messageRows } = await supabase
          .from('chat_messages')
          .select('id, sender_user_id')
          .in('thread_id', threadIds)
          .order('created_at', { ascending: false })
          .limit(200);

        const messageIds = (messageRows || []).map(
          (row: { id: string }) => row.id
        );
        if (messageIds.length > 0) {
          const { data: readRows } = await supabase
            .from('chat_reads')
            .select('message_id')
            .eq('user_id', user.id)
            .in('message_id', messageIds);
          const readSet = new Set(
            (readRows || []).map((row: { message_id: string }) => row.message_id)
          );
          unreadCount = (messageRows || []).filter(
            (row: { id: string; sender_user_id: string }) =>
              row.sender_user_id !== user.id && !readSet.has(row.id)
          ).length;
        }
      }

      setStats({
        workoutsThisWeek: weekCount || 0,
        totalWorkouts: totalCount || 0,
        unreadMessages: unreadCount,
      });
      setStatus({
        workoutToday: (todayCount || 0) > 0,
        checkinThisWeek: (checkinCount || 0) > 0,
      });
      setWeightTrend(weightPoints);
      setWorkoutTrend(workoutPoints);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error(t.loadFail);
    } finally {
      setLoading(false);
    }
  }, [router, t.loadFail]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const weightTrendDisplay = useMemo(() => {
    if (unit === 'imperial') {
      return weightTrend.map((point) => ({
        ...point,
        weight: Math.round(kgToLb(point.weight)),
      }));
    }
    return weightTrend;
  }, [unit, weightTrend]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <ClientLayout>
      <div className="min-h-screen bg-background">
        <header className="bg-background-surface border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div>
              <h1 className="text-3xl font-bold">
                {t.welcome}, {clientData?.display_name}!
              </h1>
              <p className="text-text-secondary mt-1">
                {new Date().toLocaleDateString(locale, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <MagicCard
                className="group cursor-pointer relative overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 p-6"
                onClick={() => router.push('/client/program')}
              >
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 blur-2xl group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow-md group-hover:shadow-glow-lg transition-shadow">
                      <Dumbbell className="w-7 h-7 text-white" />
                    </div>
                    <Badge variant={status.workoutToday ? 'success' : 'warning'}>
                      {status.workoutToday ? t.completed : t.due}
                    </Badge>
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-gradient">
                    {t.workoutToday}
                  </h3>
                  <p className="text-text-secondary text-sm">
                    {status.workoutToday ? t.workoutDone : t.workoutPrompt}
                  </p>
                  <button className="mt-4 text-primary hover:text-primary-light font-bold text-sm transition-colors flex items-center gap-1 group-hover:gap-2 transition-all">
                    {t.viewProgram} <span className="text-lg">&rarr;</span>
                  </button>
                </div>
              </MagicCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <MagicCard
                className="group cursor-pointer relative overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 p-6"
                onClick={() => router.push('/client/checkin')}
              >
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-success/20 to-accent/20 blur-2xl group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-success to-accent flex items-center justify-center shadow-success-glow group-hover:shadow-success-glow-lg transition-shadow">
                      <Calendar className="w-7 h-7 text-white" />
                    </div>
                    <Badge variant={status.checkinThisWeek ? 'success' : 'warning'}>
                      {status.checkinThisWeek ? t.completed : t.due}
                  </Badge>
                </div>
                  <h3 className="text-2xl font-bold mb-2 text-gradient-success">
                    {t.checkinWeekly}
                  </h3>
                  <p className="text-text-secondary text-sm">
                    {status.checkinThisWeek ? t.checkinDone : t.checkinPrompt}
                  </p>
                  <button className="mt-4 text-success hover:text-success-light font-bold text-sm transition-colors flex items-center gap-1 group-hover:gap-2 transition-all">
                    {t.startCheckin} <span className="text-lg">&rarr;</span>
                  </button>
                </div>
              </MagicCard>
            </motion.div>
          </div>

          <MagicCard className="mb-8  p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{t.reminders}</h2>
                <p className="text-text-secondary text-sm">{t.remindersBody}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-background-elevated/60 border border-border">
                <p className="font-semibold mb-1">{t.reminderWorkout}</p>
                <p className="text-sm text-text-tertiary">
                  {status.workoutToday ? t.reminderWorkoutDone : t.reminderWorkoutTodo}
                </p>
                {!status.workoutToday && (
                  <MovingButton
                    text={t.logWorkout}
                    onClick={() => router.push('/client/log-workout')}
                    className="mt-3 w-full sm:w-auto min-w-[180px] text-sm font-semibold"
                  />
                )}
              </div>
              <div className="p-4 rounded-lg bg-background-elevated/60 border border-border">
                <p className="font-semibold mb-1">{t.reminderCheckin}</p>
                <p className="text-sm text-text-tertiary">
                  {status.checkinThisWeek ? t.reminderCheckinDone : t.reminderCheckinTodo}
                </p>
                {!status.checkinThisWeek && (
                  <MovingButton
                    text={t.startCheckin}
                    onClick={() => router.push('/client/checkin')}
                    className="mt-3 w-full sm:w-auto min-w-[180px] text-sm font-semibold"
                  />
                )}
              </div>
            </div>
          </MagicCard>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MagicCard className="relative overflow-hidden border border-border bg-background-surface/80 shadow-lg p-6">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-secondary" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-xs uppercase tracking-[0.2em]">{t.workoutsThisWeek}</p>
                  <p className="text-3xl font-bold text-gradient mt-2">
                    {stats.workoutsThisWeek}
                  </p>
                  <p className="text-xs text-text-tertiary mt-2">7 jours</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
              </div>
            </MagicCard>

            <MagicCard className="relative overflow-hidden border border-border bg-background-surface/80 shadow-lg p-6">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-secondary to-accent" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-xs uppercase tracking-[0.2em]">{t.totalWorkouts}</p>
                  <p className="text-3xl font-bold text-gradient mt-2">
                    {stats.totalWorkouts}
                  </p>
                  <p className="text-xs text-text-tertiary mt-2">Total</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-secondary/15 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </MagicCard>

            <MagicCard className="relative overflow-hidden border border-border bg-background-surface/80 shadow-lg p-6">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent to-primary" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-xs uppercase tracking-[0.2em]">{t.unreadMessages}</p>
                  <p className="text-3xl font-bold text-gradient mt-2">
                    {stats.unreadMessages}
                  </p>
                  <p className="text-xs text-text-tertiary mt-2">À traiter</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-accent" />
                </div>
              </div>
            </MagicCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <MagicCard className=" p-6">
              <h3 className="text-lg font-semibold mb-4">{t.weightTrend}</h3>
              {weightTrendDisplay.length > 0 ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightTrendDisplay} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="clientWeightGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgb(var(--color-primary))" />
                          <stop offset="100%" stopColor="rgb(var(--color-secondary))" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border) / 0.2)" vertical={false} />
                      <XAxis dataKey="week" stroke="rgb(var(--color-text-secondary))" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis stroke="rgb(var(--color-text-secondary))" tickLine={false} axisLine={false} fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgb(var(--color-background-elevated))',
                          border: '1px solid rgb(var(--color-border))',
                          borderRadius: '8px'
                        }}
                        cursor={{ stroke: 'rgb(var(--color-primary) / 0.2)', strokeWidth: 1 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="url(#clientWeightGradient)"
                        strokeWidth={3}
                        dot={{ r: 4, fill: 'rgb(var(--color-primary))', strokeWidth: 2, stroke: 'rgb(var(--color-background-surface))' }}
                        activeDot={{ r: 6, fill: 'rgb(var(--color-secondary))', stroke: 'rgb(var(--color-background-surface))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-text-tertiary">{t.noWeight}</p>
              )}
            </MagicCard>

            <MagicCard className=" p-6">
              <h3 className="text-lg font-semibold mb-4">{t.workoutsPerWeek}</h3>
              {workoutTrend.length > 0 ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={workoutTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="clientWorkoutGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgb(var(--color-success))" />
                          <stop offset="100%" stopColor="rgb(var(--color-accent))" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border) / 0.2)" vertical={false} />
                      <XAxis dataKey="week" stroke="rgb(var(--color-text-secondary))" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis stroke="rgb(var(--color-text-secondary))" allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgb(var(--color-background-elevated))',
                          border: '1px solid rgb(var(--color-border))',
                          borderRadius: '8px'
                        }}
                        cursor={{ fill: 'rgb(var(--color-success) / 0.08)' }}
                      />
                      <Bar dataKey="count" fill="url(#clientWorkoutGradient)" radius={[10, 10, 4, 4]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-text-tertiary">{t.noWorkouts}</p>
              )}
            </MagicCard>
          </div>

          {clientData?.goal && (
            <MagicCard className="mt-6  p-6">
              <h3 className="text-lg font-semibold mb-2">{t.yourGoal}</h3>
              <p className="text-text-secondary">{clientData.goal}</p>
              {coachName && (
                <p className="text-sm text-text-tertiary mt-2">
                  {t.coachLabel}: {coachName}
                </p>
              )}
            </MagicCard>
          )}
        </main>
      </div>
    </ClientLayout>
  );
}
