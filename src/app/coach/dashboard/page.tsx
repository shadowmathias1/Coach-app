'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserCheck, Copy, Bell, Target, TrendingUp, Zap } from 'lucide-react';
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
import Button from '@/components/ui/Button';
import MagicCard from '@/components/ui/MagicCard';
import ShinyButton from '@/components/ui/ShinyButton';
import CoachLayout from '@/components/layout/CoachLayout';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { toast } from 'sonner';
import { useLanguage } from '@/components/shared/LanguageProvider';

interface Client {
  id: string;
  display_name: string;
  joined_at: string;
  last_activity_at: string | null;
}

interface TrendPoint {
  week: string;
  count: number;
}

interface GoalProgress {
  id: string;
  client_id: string;
  goal_type: string;
  status: string;
  target_value: number;
  target_unit: string | null;
  target_date: string | null;
  exercise_id: string | null;
  performance_metric: string | null;
  current_value: number | null;
  progress_ratio: number | null;
  is_met: boolean | null;
}

export default function CoachDashboardPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
  });
  const [pendingCheckins, setPendingCheckins] = useState(0);
  const [inactiveClients, setInactiveClients] = useState(0);
  const [workoutTrend, setWorkoutTrend] = useState<TrendPoint[]>([]);
  const [checkinTrend, setCheckinTrend] = useState<TrendPoint[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [goalSummary, setGoalSummary] = useState({
    total: 0,
    met: 0,
    atRisk: 0,
  });
  const [goalHighlights, setGoalHighlights] = useState<GoalProgress[]>([]);
  const [goalClientNames, setGoalClientNames] = useState<Record<string, string>>(
    {}
  );
  const [goalExerciseNames, setGoalExerciseNames] = useState<Record<string, string>>(
    {}
  );

  const t = language === 'fr'
    ? {
        title: 'Tableau de bord',
        welcome: 'Bienvenue coach',
        totalClients: 'Clients',
        activeClients: 'Actifs (7 jours)',
        inviteCode: 'Code invitation',
        inviteCodeHint: 'Partage ce code avec tes clients',
        loading: 'Chargement...',
        quickActions: 'Actions rapides',
        quickActionsBody: 'Acces rapide aux taches courantes',
        newProgram: 'Nouveau programme',
        inviteClient: 'Inviter un client',
        viewClients: 'Voir les clients',
        reminders: 'Rappels',
        remindersBody: 'Garde tes clients sur la bonne voie',
        checkinsPending: 'Check-ins en attente',
        inactiveClients: 'Clients inactifs',
        stillDue: 'clients en attente',
        noActivity: 'clients sans activite depuis 7 jours',
        reviewActivity: 'Voir activite',
        workoutsPerWeek: 'Seances par semaine',
        checkinsPerWeek: 'Check-ins par semaine',
        noWorkouts: 'Aucune seance pour le moment.',
        noCheckins: 'Aucun check-in pour le moment.',
        recentClients: 'Clients recents',
        viewAll: 'Tout voir',
        joined: 'Inscrit le',
        active: 'Actif',
        never: 'Jamais',
        noClients: 'Aucun client pour le moment',
        noClientsBody: "Partage ton code pour demarrer",
        copyInvite: 'Copier le code',
        copySuccess: 'Code copie !',
        goalsTitle: 'Objectifs clients',
        goalsSubtitle: 'Suivi rapide des objectifs actifs',
        goalsTotal: 'Objectifs actifs',
        goalsMet: 'Atteints',
        goalsAtRisk: 'A surveiller',
        goalsEmpty: 'Aucun objectif actif pour le moment',
        goalWeight: 'Poids',
        goalFrequency: 'Frequence',
        goalPerformance: 'Performance',
        sessionsPerWeek: 'seances/sem',
        targetDate: 'Echeance',
        current: 'Actuel',
        loadFail: 'Impossible de charger le tableau de bord',
      }
    : {
        title: 'Dashboard',
        welcome: 'Welcome back, coach',
        totalClients: 'Total clients',
        activeClients: 'Active (7 days)',
        inviteCode: 'Invite code',
        inviteCodeHint: 'Share this code with new clients',
        loading: 'Loading...',
        quickActions: 'Quick actions',
        quickActionsBody: 'Jump into your most common tasks',
        newProgram: 'New program',
        inviteClient: 'Invite client',
        viewClients: 'View clients',
        reminders: 'Reminders',
        remindersBody: 'Keep clients on track this week',
        checkinsPending: 'Check-ins pending',
        inactiveClients: 'Inactive clients',
        stillDue: 'clients still due',
        noActivity: 'clients with no activity in 7 days',
        reviewActivity: 'Review activity',
        workoutsPerWeek: 'Workouts per week',
        checkinsPerWeek: 'Check-ins per week',
        noWorkouts: 'No workouts logged yet.',
        noCheckins: 'No check-ins submitted yet.',
        recentClients: 'Recent clients',
        viewAll: 'View all',
        joined: 'Joined',
        active: 'Active',
        never: 'Never',
        noClients: 'No clients yet',
        noClientsBody: 'Share your invite code to get started',
        copyInvite: 'Copy invite code',
        copySuccess: 'Invite code copied!',
        goalsTitle: 'Client goals',
        goalsSubtitle: 'Quick view of active goals',
        goalsTotal: 'Active goals',
        goalsMet: 'Met',
        goalsAtRisk: 'Needs attention',
        goalsEmpty: 'No active goals yet',
        goalWeight: 'Weight',
        goalFrequency: 'Frequency',
        goalPerformance: 'Performance',
        sessionsPerWeek: 'sessions/wk',
        targetDate: 'Target date',
        current: 'Current',
        loadFail: 'Failed to load dashboard',
      };

  const locale = language === 'fr' ? 'fr-FR' : 'en-US';

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

  const getWeekStartDate = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff)).toISOString().split('T')[0];
  };

  const formatGoalTitle = (goal: GoalProgress) => {
    if (goal.goal_type === 'weight') {
      const unit = goal.target_unit ? ` ${goal.target_unit}` : '';
      return `${t.goalWeight} ${goal.target_value}${unit}`;
    }
    if (goal.goal_type === 'frequency') {
      return `${t.goalFrequency} ${goal.target_value} ${t.sessionsPerWeek}`;
    }
    const exerciseName = goal.exercise_id
      ? goalExerciseNames[goal.exercise_id] || ''
      : '';
    const metricLabel =
      goal.performance_metric === 'weekly_volume'
        ? 'Volume'
        : 'Max';
    return `${t.goalPerformance} ${metricLabel}${exerciseName ? ` - ${exerciseName}` : ''}`;
  };

  const formatCurrentValue = (goal: GoalProgress) => {
    if (goal.current_value === null || goal.current_value === undefined) {
      return '-';
    }
    if (goal.goal_type === 'frequency') {
      return `${goal.current_value} ${t.sessionsPerWeek}`;
    }
    const unit = goal.target_unit ? ` ${goal.target_unit}` : '';
    return `${goal.current_value}${unit}`;
  };

  const loadDashboard = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoIso = sevenDaysAgo.toISOString();
      const weekStartDate = getWeekStartDate();
      const startRange = new Date();
      startRange.setDate(startRange.getDate() - 42);
      const startRangeIso = startRange.toISOString().split('T')[0];

      const [
        { data: coach },
        { data: recentClients },
        { count: totalCount },
        { count: activeCount },
        { count: checkinsCount },
        { data: workoutDates },
        { data: checkinDates },
        { data: goalProgress },
      ] = await Promise.all([
        supabase.from('coaches').select('invite_code').eq('id', user.id).single(),
        supabase
          .from('clients')
          .select('id, display_name, joined_at, last_activity_at')
          .eq('coach_id', user.id)
          .order('joined_at', { ascending: false })
          .limit(5),
        supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('coach_id', user.id),
        supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('coach_id', user.id)
          .gte('last_activity_at', sevenDaysAgoIso),
        supabase
          .from('checkins')
          .select('id', { count: 'exact', head: true })
          .eq('coach_id', user.id)
          .eq('week_start_date', weekStartDate),
        supabase
          .from('workout_logs')
          .select('date')
          .eq('coach_id', user.id)
          .gte('date', startRangeIso)
          .order('date', { ascending: true }),
        supabase
          .from('checkins')
          .select('week_start_date')
          .eq('coach_id', user.id)
          .gte('week_start_date', startRangeIso)
          .order('week_start_date', { ascending: true }),
        supabase
          .from('client_goal_progress')
          .select(
            'id, client_id, goal_type, status, target_value, target_unit, target_date, exercise_id, performance_metric, current_value, progress_ratio, is_met'
          )
          .eq('coach_id', user.id)
          .eq('status', 'active')
          .order('target_date', { ascending: true }),
      ]);

      if (coach) {
        setInviteCode((coach as { invite_code: string }).invite_code);
      }

      const total = totalCount || 0;
      const active = activeCount || 0;

      setStats({ totalClients: total, activeClients: active });
      setRecentClients((recentClients as Client[]) || []);
      setInactiveClients(total - active);
      setPendingCheckins(total - (checkinsCount || 0));

      const baseMap = new Map<string, number>();
      const currentWeekStart = getWeekStartFromDate(new Date());
      for (let i = 5; i >= 0; i -= 1) {
        const week = new Date(currentWeekStart);
        week.setDate(currentWeekStart.getDate() - i * 7);
        baseMap.set(week.toISOString().split('T')[0], 0);
      }

      const workoutMap = new Map(baseMap);
      (workoutDates || []).forEach((entry) => {
        const weekStart = getWeekStartFromDate(new Date(entry.date));
        const key = weekStart.toISOString().split('T')[0];
        workoutMap.set(key, (workoutMap.get(key) || 0) + 1);
      });

      const checkinMap = new Map(baseMap);
      (checkinDates || []).forEach((entry) => {
        const weekStart = getWeekStartFromDate(
          new Date(entry.week_start_date)
        );
        const key = weekStart.toISOString().split('T')[0];
        checkinMap.set(key, (checkinMap.get(key) || 0) + 1);
      });

      setWorkoutTrend(
        Array.from(workoutMap.entries()).map(([week, count]) => ({
          week: formatWeekLabel(week),
          count,
        }))
      );
      setCheckinTrend(
        Array.from(checkinMap.entries()).map(([week, count]) => ({
          week: formatWeekLabel(week),
          count,
        }))
      );

      const activeGoals = (goalProgress as GoalProgress[]) || [];
      if (activeGoals.length > 0) {
        const clientIds = Array.from(
          new Set(activeGoals.map((goal) => goal.client_id))
        );
        const exerciseIds = Array.from(
          new Set(
            activeGoals
              .map((goal) => goal.exercise_id)
              .filter((id): id is string => Boolean(id))
          )
        );

        const [{ data: goalClients }, { data: goalExercises }] =
          await Promise.all([
            supabase
              .from('clients')
              .select('id, display_name')
              .in('id', clientIds),
            exerciseIds.length > 0
              ? supabase.from('exercises').select('id, name').in('id', exerciseIds)
              : Promise.resolve({ data: [] as { id: string; name: string }[] }),
          ]);

        const clientNameMap: Record<string, string> = {};
        (goalClients || []).forEach((client) => {
          clientNameMap[client.id] = client.display_name;
        });

        const exerciseNameMap: Record<string, string> = {};
        (goalExercises || []).forEach((exercise) => {
          exerciseNameMap[exercise.id] = exercise.name;
        });

        setGoalClientNames(clientNameMap);
        setGoalExerciseNames(exerciseNameMap);

        const metCount = activeGoals.filter((goal) => goal.is_met).length;
        const now = new Date();
        const atRiskCount = activeGoals.filter((goal) => {
          if (goal.is_met) return false;
          if (goal.progress_ratio !== null && goal.progress_ratio < 0.5) return true;
          if (goal.target_date) {
            const diffDays =
              (new Date(goal.target_date).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24);
            return diffDays <= 14;
          }
          return false;
        }).length;

        setGoalSummary({
          total: activeGoals.length,
          met: metCount,
          atRisk: atRiskCount,
        });

        const sortedGoals = [...activeGoals].sort((a, b) => {
          const aRatio = a.progress_ratio ?? 0;
          const bRatio = b.progress_ratio ?? 0;
          return aRatio - bRatio;
        });
        setGoalHighlights(sortedGoals.slice(0, 5));
      } else {
        setGoalSummary({ total: 0, met: 0, atRisk: 0 });
        setGoalHighlights([]);
        setGoalClientNames({});
        setGoalExerciseNames({});
      }
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

  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success(t.copySuccess);
  };

  if (loading) {
    return (
      <CoachLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout>
      <div className="min-h-screen bg-background">
        <header className="bg-background-surface border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="text-text-secondary mt-1">{t.welcome}</p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <MagicCard className="p-6 relative overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-background-surface/80">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 blur-2xl group-hover:scale-150 transition-transform duration-500" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-xs font-semibold uppercase tracking-[0.2em]">{t.totalClients}</p>
                    <p className="text-4xl font-bold text-gradient mt-2">
                      {stats.totalClients}
                    </p>
                    <p className="mt-2 text-xs text-text-tertiary">Actif</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow-md group-hover:shadow-glow-lg transition-shadow">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                </div>
              </MagicCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <MagicCard className="p-6 relative overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-background-surface/80">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-success/20 to-accent/20 blur-2xl group-hover:scale-150 transition-transform duration-500" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-xs font-semibold uppercase tracking-[0.2em]">{t.activeClients}</p>
                    <p className="text-4xl font-bold text-success mt-2">
                      {stats.activeClients}
                    </p>
                    <p className="mt-2 text-xs text-text-tertiary">7 jours</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-success to-accent flex items-center justify-center shadow-success-glow group-hover:shadow-success-glow-lg transition-shadow">
                    <UserCheck className="w-7 h-7 text-white" />
                  </div>
                </div>
              </MagicCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <MagicCard className="p-6 relative overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-background-surface/80">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-secondary/20 to-primary/20 blur-2xl group-hover:scale-150 transition-transform duration-500" />
                <div className="relative">
                  <p className="text-text-secondary text-xs font-semibold uppercase tracking-[0.2em] mb-3">{t.inviteCode}</p>
                  <div className="flex items-center gap-2">
                    <code className="text-2xl font-bold text-primary tracking-wider font-mono">
                      {inviteCode || t.loading}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyInviteCode}
                      className="hover:bg-primary/10 hover:scale-110 transition-all"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-text-tertiary mt-3 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {t.inviteCodeHint}
                  </p>
                </div>
              </MagicCard>
            </motion.div>
          </div>

          <MagicCard className="mb-8 p-6 bg-background-surface/80 border border-border/70 shadow-lg">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">{t.quickActions}</h2>
                <p className="text-text-secondary text-sm mt-1">
                  {t.quickActionsBody}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  onClick={() => router.push('/coach/programs')}
                >
                  {t.newProgram}
                </Button>
                <ShinyButton
                  onClick={copyInviteCode}
                  className="min-h-[44px] min-w-[170px] px-4 text-sm font-semibold bg-gradient-to-r from-primary to-secondary text-white shadow-glow-sm hover:shadow-glow-lg hover:scale-105"
                >
                  <span className="flex items-center gap-2 px-2">
                    <Copy className="w-4 h-4" />
                    {t.inviteClient}
                  </span>
                </ShinyButton>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/coach/clients')}
                >
                  {t.viewClients}
                </Button>
              </div>
            </div>
          </MagicCard>

          <MagicCard className="mb-8  p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{t.reminders}</h2>
                <p className="text-text-secondary text-sm">{t.remindersBody}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-background-surface/70 border border-border/70">
                <p className="font-semibold mb-1">{t.checkinsPending}</p>
                <p className="text-sm text-text-tertiary">
                  {pendingCheckins} {t.stillDue}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => router.push('/coach/clients')}
                >
                  {t.viewClients}
                </Button>
              </div>
              <div className="p-4 rounded-lg bg-background-surface/70 border border-border/70">
                <p className="font-semibold mb-1">{t.inactiveClients}</p>
                <p className="text-sm text-text-tertiary">
                  {inactiveClients} {t.noActivity}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => router.push('/coach/clients')}
                >
                  {t.reviewActivity}
                </Button>
              </div>
            </div>
          </MagicCard>

          <MagicCard className="mb-8  p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{t.goalsTitle}</h2>
                <p className="text-text-secondary text-sm">{t.goalsSubtitle}</p>
              </div>
            </div>
            {goalSummary.total > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-background-elevated/60 border border-border">
                    <p className="text-sm text-text-tertiary">{t.goalsTotal}</p>
                    <p className="text-2xl font-semibold">{goalSummary.total}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background-elevated/60 border border-border">
                    <p className="text-sm text-text-tertiary">{t.goalsMet}</p>
                    <p className="text-2xl font-semibold text-success">
                      {goalSummary.met}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-background-elevated/60 border border-border">
                    <p className="text-sm text-text-tertiary">{t.goalsAtRisk}</p>
                    <p className="text-2xl font-semibold text-warning">
                      {goalSummary.atRisk}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {goalHighlights.map((goal) => {
                    const progress = goal.progress_ratio ?? 0;
                    const progressPercent = Math.min(
                      100,
                      Math.max(0, Math.round(progress * 100))
                    );
                    const clientName =
                      goalClientNames[goal.client_id] || 'Client';
                    return (
                      <div
                        key={goal.id}
                        className="p-4 rounded-lg bg-background-elevated border border-border"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm text-text-tertiary">
                              {clientName}
                            </p>
                            <p className="font-semibold">{formatGoalTitle(goal)}</p>
                            <p className="text-sm text-text-tertiary">
                              {t.current}: {formatCurrentValue(goal)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-text-tertiary">
                              {progressPercent}%
                            </p>
                            {goal.target_date && (
                              <p className="text-xs text-text-tertiary">
                                {t.targetDate}:{' '}
                                {new Date(goal.target_date).toLocaleDateString(
                                  locale
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 h-2 w-full rounded-full bg-background-surface">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-sm text-text-tertiary">{t.goalsEmpty}</p>
            )}
          </MagicCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <MagicCard className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300 p-6">
                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 blur-3xl group-hover:scale-150 transition-transform duration-700" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold">{t.workoutsPerWeek}</h3>
                  </div>
                  {workoutTrend.length > 0 ? (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={workoutTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="coachWorkoutGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgb(var(--color-primary))" />
                              <stop offset="100%" stopColor="rgb(var(--color-secondary))" />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border) / 0.2)" vertical={false} />
                          <XAxis dataKey="week" stroke="rgb(var(--color-text-secondary))" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="rgb(var(--color-text-secondary))" allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgb(var(--color-background-elevated))',
                              border: '1px solid rgb(var(--color-border))',
                              borderRadius: '8px'
                            }}
                            cursor={{ fill: 'rgb(var(--color-primary) / 0.08)' }}
                          />
                          <Bar dataKey="count" fill="url(#coachWorkoutGradient)" radius={[10, 10, 4, 4]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-text-tertiary">{t.noWorkouts}</p>
                  )}
                </div>
              </MagicCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <MagicCard className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300 p-6">
                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-success/10 to-accent/10 blur-3xl group-hover:scale-150 transition-transform duration-700" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success to-accent flex items-center justify-center">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold">{t.checkinsPerWeek}</h3>
                  </div>
                  {checkinTrend.length > 0 ? (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={checkinTrend} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="coachCheckinGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgb(var(--color-success))" />
                              <stop offset="100%" stopColor="rgb(var(--color-accent))" />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border) / 0.2)" vertical={false} />
                          <XAxis dataKey="week" stroke="rgb(var(--color-text-secondary))" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="rgb(var(--color-text-secondary))" allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgb(var(--color-background-elevated))',
                              border: '1px solid rgb(var(--color-border))',
                              borderRadius: '8px'
                            }}
                            cursor={{ stroke: 'rgb(var(--color-success) / 0.2)', strokeWidth: 1 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke="url(#coachCheckinGradient)"
                            strokeWidth={3}
                            dot={{ r: 4, fill: 'rgb(var(--color-success))', strokeWidth: 2, stroke: 'rgb(var(--color-background-surface))' }}
                            activeDot={{ r: 6, fill: 'rgb(var(--color-accent))', stroke: 'rgb(var(--color-background-surface))' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-text-tertiary">{t.noCheckins}</p>
                  )}
                </div>
              </MagicCard>
            </motion.div>
          </div>

          <MagicCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">{t.recentClients}</h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push('/coach/clients')}
              >
                {t.viewAll} &rarr;
              </Button>
            </div>

            {recentClients.length > 0 ? (
              <div className="space-y-4">
                {recentClients.map((client, idx) => (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                    className="group relative overflow-hidden rounded-2xl bg-background-elevated hover:bg-background-surface border-2 border-border hover:border-primary/40 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
                    onClick={() => router.push(`/coach/clients/${client.id}`)}
                  >
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-primary/5 to-secondary/5 blur-2xl group-hover:scale-150 transition-transform duration-500" />
                    <div className="relative flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow-sm group-hover:shadow-glow-md transition-shadow">
                          <span className="text-lg font-bold text-white">
                            {client.display_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-lg group-hover:text-gradient transition-all">{client.display_name}</p>
                          <p className="text-sm text-text-tertiary">
                            {t.joined}{' '}
                            {new Date(client.joined_at).toLocaleDateString(locale)}
                          </p>
                        </div>
                      </div>
                      <Badge variant={client.last_activity_at ? 'success' : 'default'}>
                        {client.last_activity_at ? t.active : t.never}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                <p className="text-text-secondary mb-2">{t.noClients}</p>
                <p className="text-sm text-text-tertiary mb-4">
                  {t.noClientsBody}
                </p>
                <Button variant="primary" onClick={copyInviteCode}>
                  <Copy className="w-4 h-4" />
                  {t.copyInvite}
                </Button>
              </div>
            )}
          </MagicCard>
        </main>
      </div>
    </CoachLayout>
  );
}
