'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ClientLayout from '@/components/layout/ClientLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useLanguage } from '@/components/shared/LanguageProvider';
import { supabase, getCurrentUser } from '@/lib/supabase';
import {
  Dumbbell,
  TrendingUp,
  Scale,
  Target,
  ChevronRight,
  Calendar,
  MessageSquare,
  Trophy,
  Flame,
  Clock,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface WeeklyVolume {
  week_start: string;
  total_volume: number | null;
}

interface CheckIn {
  id: string;
  week_start_date: string;
  weight: number | null;
  mood: number;
  sleep_quality: number;
}

interface PR {
  exercise_name: string;
  max_weight: number | null;
  max_weight_date: string | null;
}

interface WorkoutLog {
  id: string;
  date: string;
  duration_minutes: number;
}

interface DashboardStats {
  workoutsThisWeek: number;
  totalWorkoutsMonth: number;
  currentWeight: number | null;
  weeklyStreak: number;
  hasProgram: boolean;
}

export default function ClientDashboardPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    workoutsThisWeek: 0,
    totalWorkoutsMonth: 0,
    currentWeight: null,
    weeklyStreak: 0,
    hasProgram: false,
  });
  const [volumeData, setVolumeData] = useState<{ week: string; volume: number }[]>([]);
  const [weightData, setWeightData] = useState<{ date: string; weight: number }[]>([]);
  const [recentPRs, setRecentPRs] = useState<PR[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutLog[]>([]);

  const t = useMemo(
    () =>
      language === 'fr'
        ? {
            title: 'Tableau de bord',
            welcome: 'Salut',
            subtitle: 'Voici ton resume de la semaine',
            workoutsWeek: 'Seances cette semaine',
            workoutsMonth: 'Seances ce mois',
            currentWeight: 'Poids actuel',
            streak: 'Semaines consecutives',
            volumeProgress: 'Volume hebdomadaire',
            weightProgress: 'Evolution du poids',
            recentPRs: 'Records personnels',
            noPRs: 'Pas encore de PR',
            quickActions: 'Actions rapides',
            logWorkout: 'Logger une seance',
            viewProgram: 'Voir le programme',
            messages: 'Messages',
            checkIn: 'Check-in',
            viewProgress: 'Voir ma progression',
            recentWorkouts: 'Seances recentes',
            noWorkouts: 'Aucune seance enregistree',
            kg: 'kg',
            weeks: 'semaines',
            viewAll: 'Tout voir',
            duration: 'min',
            noProgram: 'Pas de programme actif',
          }
        : {
            title: 'Dashboard',
            welcome: 'Hey',
            subtitle: 'Here is your weekly summary',
            workoutsWeek: 'Workouts this week',
            workoutsMonth: 'Workouts this month',
            currentWeight: 'Current weight',
            streak: 'Week streak',
            volumeProgress: 'Weekly volume',
            weightProgress: 'Weight progress',
            recentPRs: 'Personal records',
            noPRs: 'No PRs yet',
            quickActions: 'Quick actions',
            logWorkout: 'Log workout',
            viewProgram: 'View program',
            messages: 'Messages',
            checkIn: 'Check-in',
            viewProgress: 'View progress',
            recentWorkouts: 'Recent workouts',
            noWorkouts: 'No workouts logged',
            kg: 'kg',
            weeks: 'weeks',
            viewAll: 'View all',
            duration: 'min',
            noProgram: 'No active program',
          },
    [language]
  );

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const clientId = user.id;

      // Dates
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1);
      startOfWeek.setHours(0, 0, 0, 0);
      const weekStart = startOfWeek.toISOString().split('T')[0];

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthStart = startOfMonth.toISOString().split('T')[0];

      // Fetch all data in parallel
      const [
        workoutsWeekRes,
        workoutsMonthRes,
        checkInsRes,
        volumeRes,
        prsRes,
        programRes,
      ] = await Promise.all([
        supabase
          .from('workout_logs')
          .select('id, date, duration_minutes')
          .eq('client_id', clientId)
          .gte('date', weekStart)
          .order('date', { ascending: false }),
        supabase
          .from('workout_logs')
          .select('id, date')
          .eq('client_id', clientId)
          .gte('date', monthStart),
        supabase
          .from('checkins')
          .select('id, week_start_date, weight, mood, sleep_quality')
          .eq('client_id', clientId)
          .order('week_start_date', { ascending: false })
          .limit(8),
        supabase
          .from('client_weekly_volume')
          .select('week_start, total_volume')
          .eq('client_id', clientId)
          .order('week_start', { ascending: false })
          .limit(8),
        supabase
          .from('exercise_prs')
          .select('exercise_name, max_weight, max_weight_date')
          .eq('client_id', clientId)
          .not('max_weight', 'is', null)
          .order('max_weight_date', { ascending: false })
          .limit(5),
        supabase
          .from('programs')
          .select('id')
          .eq('client_id', clientId)
          .eq('is_active', true)
          .limit(1),
      ]);

      const workoutsWeek = workoutsWeekRes.data || [];
      const workoutsMonth = workoutsMonthRes.data || [];
      const checkIns = checkInsRes.data || [];
      const volume = volumeRes.data || [];
      const prs = prsRes.data || [];
      const programs = programRes.data || [];

      // Calculate streak (weeks with at least one workout)
      let streak = 0;
      const workoutsByWeek = new Map<string, boolean>();
      workoutsMonth.forEach((w) => {
        const d = new Date(w.date);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay() + 1);
        workoutsByWeek.set(weekStart.toISOString().split('T')[0], true);
      });
      // Count consecutive weeks from current
      let checkWeek = new Date(startOfWeek);
      while (workoutsByWeek.has(checkWeek.toISOString().split('T')[0])) {
        streak++;
        checkWeek.setDate(checkWeek.getDate() - 7);
      }

      // Current weight from latest check-in
      const latestWeight = checkIns.find((c) => c.weight)?.weight || null;

      // Volume chart data (reversed for chronological order)
      const volumeChartData = volume
        .slice()
        .reverse()
        .map((v) => ({
          week: new Date(v.week_start).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
            day: 'numeric',
            month: 'short',
          }),
          volume: v.total_volume || 0,
        }));

      // Weight chart data
      const weightChartData = checkIns
        .filter((c) => c.weight)
        .slice()
        .reverse()
        .map((c) => ({
          date: new Date(c.week_start_date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
            day: 'numeric',
            month: 'short',
          }),
          weight: c.weight!,
        }));

      setStats({
        workoutsThisWeek: workoutsWeek.length,
        totalWorkoutsMonth: workoutsMonth.length,
        currentWeight: latestWeight,
        weeklyStreak: streak,
        hasProgram: programs.length > 0,
      });

      setVolumeData(volumeChartData);
      setWeightData(weightChartData);
      setRecentPRs(prs);
      setRecentWorkouts(workoutsWeek.slice(0, 3));
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const statCards = [
    {
      label: t.workoutsWeek,
      value: stats.workoutsThisWeek,
      icon: Dumbbell,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: t.workoutsMonth,
      value: stats.totalWorkoutsMonth,
      icon: Calendar,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: t.currentWeight,
      value: stats.currentWeight ? `${stats.currentWeight}` : '-',
      suffix: stats.currentWeight ? t.kg : '',
      icon: Scale,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: t.streak,
      value: stats.weeklyStreak,
      suffix: t.weeks,
      icon: Flame,
      color: 'text-error',
      bgColor: 'bg-error/10',
    },
  ];

  if (loading) {
    return (
      <ClientLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-pulse text-text-secondary">Loading...</div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-background-surface border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <p className="text-sm uppercase tracking-[0.3em] text-text-tertiary">
              {t.title}
            </p>
            <h1 className="text-3xl font-bold mt-2">{t.welcome}</h1>
            <p className="text-text-secondary mt-1">{t.subtitle}</p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <Card key={stat.label} className="relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">
                      {stat.value}
                      {stat.suffix && (
                        <span className="text-lg font-normal text-text-secondary ml-1">
                          {stat.suffix}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Volume Chart */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-text-secondary">{t.volumeProgress}</p>
                  <h3 className="text-xl font-semibold">
                    {language === 'fr' ? 'Tonnage total' : 'Total tonnage'}
                  </h3>
                </div>
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div className="h-48">
                {volumeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={volumeData}>
                      <defs>
                        <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="rgb(var(--color-primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="rgb(var(--color-primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="week"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'rgb(var(--color-text-secondary))', fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'rgb(var(--color-text-secondary))', fontSize: 11 }}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgb(var(--color-background-elevated))',
                          border: '1px solid rgb(var(--color-border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`${value.toLocaleString()} kg`, 'Volume']}
                      />
                      <Area
                        type="monotone"
                        dataKey="volume"
                        stroke="rgb(var(--color-primary))"
                        strokeWidth={2}
                        fill="url(#volumeGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-text-tertiary">
                    {t.noWorkouts}
                  </div>
                )}
              </div>
            </Card>

            {/* Weight Chart */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-text-secondary">{t.weightProgress}</p>
                  <h3 className="text-xl font-semibold">
                    {stats.currentWeight ? `${stats.currentWeight} ${t.kg}` : '-'}
                  </h3>
                </div>
                <Scale className="w-5 h-5 text-warning" />
              </div>
              <div className="h-48">
                {weightData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightData}>
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'rgb(var(--color-text-secondary))', fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'rgb(var(--color-text-secondary))', fontSize: 11 }}
                        domain={['dataMin - 2', 'dataMax + 2']}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgb(var(--color-background-elevated))',
                          border: '1px solid rgb(var(--color-border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`${value} ${t.kg}`, t.currentWeight]}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="rgb(var(--color-warning))"
                        strokeWidth={2}
                        dot={{ fill: 'rgb(var(--color-warning))', strokeWidth: 0, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-text-tertiary">
                    {language === 'fr' ? 'Pas de donnees de poids' : 'No weight data'}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent PRs */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-text-secondary">{t.recentPRs}</p>
                  <h3 className="text-lg font-semibold">
                    <Trophy className="w-4 h-4 inline mr-2 text-warning" />
                    {language === 'fr' ? 'Tes records' : 'Your records'}
                  </h3>
                </div>
              </div>
              {recentPRs.length > 0 ? (
                <div className="space-y-3">
                  {recentPRs.map((pr, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-background-elevated rounded-lg"
                    >
                      <span className="text-sm font-medium truncate flex-1">
                        {pr.exercise_name}
                      </span>
                      <span className="text-primary font-bold ml-2">
                        {pr.max_weight} {t.kg}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-text-tertiary">
                  <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t.noPRs}</p>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                className="mt-4"
                onClick={() => router.push('/client/progress')}
              >
                {t.viewProgress}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Card>

            {/* Recent Workouts */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-text-secondary">{t.recentWorkouts}</p>
                  <h3 className="text-lg font-semibold">
                    <Dumbbell className="w-4 h-4 inline mr-2 text-primary" />
                    {language === 'fr' ? 'Dernieres seances' : 'Latest sessions'}
                  </h3>
                </div>
              </div>
              {recentWorkouts.length > 0 ? (
                <div className="space-y-3">
                  {recentWorkouts.map((workout) => (
                    <div
                      key={workout.id}
                      className="flex items-center justify-between p-3 bg-background-elevated rounded-lg"
                    >
                      <span className="text-sm">{formatDate(workout.date)}</span>
                      <span className="text-text-secondary text-sm flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {workout.duration_minutes} {t.duration}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-text-tertiary">
                  <Dumbbell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t.noWorkouts}</p>
                </div>
              )}
              <Button
                variant="primary"
                size="sm"
                fullWidth
                className="mt-4"
                onClick={() => router.push('/client/log-workout')}
              >
                {t.logWorkout}
              </Button>
            </Card>

            {/* Quick Actions */}
            <Card>
              <p className="text-sm text-text-secondary mb-4">{t.quickActions}</p>
              <div className="space-y-3">
                <Button
                  variant="secondary"
                  fullWidth
                  className="justify-start"
                  onClick={() => router.push('/client/log-workout')}
                >
                  <Dumbbell className="w-5 h-5 mr-3" />
                  {t.logWorkout}
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  className="justify-start"
                  onClick={() => router.push('/client/program')}
                >
                  <Calendar className="w-5 h-5 mr-3" />
                  {t.viewProgram}
                  {!stats.hasProgram && (
                    <span className="ml-auto text-xs text-text-tertiary">
                      {t.noProgram}
                    </span>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  className="justify-start"
                  onClick={() => router.push('/client/checkin')}
                >
                  <Target className="w-5 h-5 mr-3" />
                  {t.checkIn}
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  className="justify-start"
                  onClick={() => router.push('/client/messages')}
                >
                  <MessageSquare className="w-5 h-5 mr-3" />
                  {t.messages}
                </Button>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </ClientLayout>
  );
}
