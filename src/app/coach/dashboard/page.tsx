'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import CoachLayout from '@/components/layout/CoachLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useLanguage } from '@/components/shared/LanguageProvider';
import { supabase, getCurrentUser } from '@/lib/supabase';
import {
  Users,
  Dumbbell,
  MessageSquare,
  TrendingUp,
  Copy,
  Check,
  ChevronRight,
  Calendar,
  Activity,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface Client {
  id: string;
  display_name: string;
  last_activity_at: string | null;
  joined_at: string;
}

interface WorkoutLog {
  id: string;
  client_id: string;
  date: string;
  duration_minutes: number;
}

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  workoutsThisWeek: number;
  unreadMessages: number;
  inviteCode: string;
}

interface WeeklyActivity {
  day: string;
  workouts: number;
}

export default function CoachDashboardPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    workoutsThisWeek: 0,
    unreadMessages: 0,
    inviteCode: '',
  });
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity[]>([]);
  const [copied, setCopied] = useState(false);

  const t = useMemo(
    () =>
      language === 'fr'
        ? {
            title: 'Tableau de bord',
            welcome: 'Bienvenue',
            subtitle: 'Voici un apercu de votre activite',
            totalClients: 'Clients totaux',
            activeClients: 'Actifs cette semaine',
            workoutsWeek: 'Seances cette semaine',
            unreadMessages: 'Messages non lus',
            inviteCode: "Code d'invitation",
            copyCode: 'Copier',
            copied: 'Copie !',
            recentClients: 'Clients recents',
            viewAll: 'Voir tout',
            noClients: 'Aucun client pour le moment',
            weeklyActivity: 'Activite hebdomadaire',
            quickActions: 'Actions rapides',
            viewClients: 'Gerer les clients',
            viewPrograms: 'Programmes',
            messages: 'Messages',
            settings: 'Parametres',
            lastActive: 'Derniere activite',
            joined: 'Rejoint le',
            never: 'Jamais',
            days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
          }
        : {
            title: 'Dashboard',
            welcome: 'Welcome',
            subtitle: 'Here is an overview of your activity',
            totalClients: 'Total clients',
            activeClients: 'Active this week',
            workoutsWeek: 'Workouts this week',
            unreadMessages: 'Unread messages',
            inviteCode: 'Invite code',
            copyCode: 'Copy',
            copied: 'Copied!',
            recentClients: 'Recent clients',
            viewAll: 'View all',
            noClients: 'No clients yet',
            weeklyActivity: 'Weekly activity',
            quickActions: 'Quick actions',
            viewClients: 'Manage clients',
            viewPrograms: 'Programs',
            messages: 'Messages',
            settings: 'Settings',
            lastActive: 'Last active',
            joined: 'Joined',
            never: 'Never',
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
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

      const coachId = user.id;

      // Dates for this week
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1);
      startOfWeek.setHours(0, 0, 0, 0);
      const weekStart = startOfWeek.toISOString().split('T')[0];

      // Fetch all data in parallel
      const [
        clientsRes,
        coachRes,
        workoutsRes,
        messagesRes,
      ] = await Promise.all([
        supabase
          .from('clients')
          .select('id, display_name, last_activity_at, joined_at')
          .eq('coach_id', coachId)
          .order('joined_at', { ascending: false }),
        supabase
          .from('coaches')
          .select('invite_code')
          .eq('id', coachId)
          .single(),
        supabase
          .from('workout_logs')
          .select('id, client_id, date, duration_minutes')
          .eq('coach_id', coachId)
          .gte('date', weekStart),
        supabase
          .from('messages')
          .select('id')
          .eq('coach_id', coachId)
          .eq('read_by_coach', false),
      ]);

      const clients = clientsRes.data || [];
      const workouts = workoutsRes.data || [];

      // Calculate active clients (had a workout this week)
      const activeClientIds = new Set(workouts.map((w) => w.client_id));

      // Build weekly activity data
      const activityByDay: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        activityByDay[d.toISOString().split('T')[0]] = 0;
      }
      workouts.forEach((w) => {
        if (activityByDay[w.date] !== undefined) {
          activityByDay[w.date]++;
        }
      });

      const weeklyData = Object.entries(activityByDay).map(([date, count], i) => ({
        day: t.days[i],
        workouts: count,
      }));

      setStats({
        totalClients: clients.length,
        activeClients: activeClientIds.size,
        workoutsThisWeek: workouts.length,
        unreadMessages: messagesRes.data?.length || 0,
        inviteCode: coachRes.data?.invite_code || '',
      });

      setRecentClients(clients.slice(0, 5));
      setWeeklyActivity(weeklyData);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = async () => {
    await navigator.clipboard.writeText(stats.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return t.never;
    return new Date(dateStr).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'short',
    });
  };

  const statCards = [
    {
      label: t.totalClients,
      value: stats.totalClients,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: t.activeClients,
      value: stats.activeClients,
      icon: Activity,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: t.workoutsWeek,
      value: stats.workoutsThisWeek,
      icon: Dumbbell,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: t.unreadMessages,
      value: stats.unreadMessages,
      icon: MessageSquare,
      color: 'text-error',
      bgColor: 'bg-error/10',
    },
  ];

  if (loading) {
    return (
      <CoachLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-pulse text-text-secondary">Loading...</div>
        </div>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout>
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
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Weekly Activity Chart */}
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-text-secondary">{t.weeklyActivity}</p>
                  <h3 className="text-xl font-semibold">{t.workoutsWeek}</h3>
                </div>
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyActivity}>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgb(var(--color-text-secondary))', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgb(var(--color-text-secondary))', fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgb(var(--color-background-elevated))',
                        border: '1px solid rgb(var(--color-border))',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: 'rgb(var(--color-text-primary))' }}
                    />
                    <Bar
                      dataKey="workouts"
                      fill="rgb(var(--color-primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Invite Code Card */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-text-secondary">{t.inviteCode}</p>
              </div>
              <div className="bg-background-elevated rounded-xl p-4 flex items-center justify-between">
                <code className="text-2xl font-mono font-bold tracking-wider text-primary">
                  {stats.inviteCode}
                </code>
                <button
                  onClick={copyInviteCode}
                  className="p-2 hover:bg-background-surface rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-success" />
                  ) : (
                    <Copy className="w-5 h-5 text-text-secondary" />
                  )}
                </button>
              </div>
              <p className="text-xs text-text-tertiary mt-3">
                {language === 'fr'
                  ? 'Partagez ce code avec vos clients pour qu\'ils puissent vous rejoindre'
                  : 'Share this code with your clients so they can join you'}
              </p>
            </Card>
          </div>

          {/* Recent Clients & Quick Actions */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Clients */}
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-text-secondary">{t.recentClients}</p>
                  <h3 className="text-xl font-semibold">
                    {stats.totalClients} {t.totalClients.toLowerCase()}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/coach/clients')}
                >
                  {t.viewAll}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              {recentClients.length > 0 ? (
                <div className="space-y-3">
                  {recentClients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => router.push(`/coach/clients/${client.id}`)}
                      className="flex items-center justify-between p-4 bg-background-elevated rounded-xl hover:bg-background-surface transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-primary font-semibold">
                            {client.display_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{client.display_name}</p>
                          <p className="text-xs text-text-tertiary">
                            {t.joined} {formatDate(client.joined_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-text-tertiary">{t.lastActive}</p>
                        <p className="text-sm">{formatDate(client.last_activity_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-text-secondary">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{t.noClients}</p>
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <Card>
              <p className="text-sm text-text-secondary mb-4">{t.quickActions}</p>
              <div className="space-y-3">
                <Button
                  variant="secondary"
                  fullWidth
                  className="justify-start"
                  onClick={() => router.push('/coach/clients')}
                >
                  <Users className="w-5 h-5 mr-3" />
                  {t.viewClients}
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  className="justify-start"
                  onClick={() => router.push('/coach/programs')}
                >
                  <Calendar className="w-5 h-5 mr-3" />
                  {t.viewPrograms}
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  className="justify-start"
                  onClick={() => router.push('/coach/messages')}
                >
                  <MessageSquare className="w-5 h-5 mr-3" />
                  {t.messages}
                  {stats.unreadMessages > 0 && (
                    <span className="ml-auto bg-error text-white text-xs px-2 py-0.5 rounded-full">
                      {stats.unreadMessages}
                    </span>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </CoachLayout>
  );
}
