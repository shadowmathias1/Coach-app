'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, ChevronLeft, Calendar } from 'lucide-react';
import Card from '@/components/ui/Card';
import ClientLayout from '@/components/layout/ClientLayout';
import { getCurrentUser, supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import { useLanguage } from '@/components/shared/LanguageProvider';
import { useUnits } from '@/components/shared/UnitProvider';
import { formatWeight } from '@/lib/units';

interface Program {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
}

interface ProgramDay {
  id: string;
  program_id: string;
  week_number: number;
  day_number: number;
  title: string;
  notes: string | null;
}

interface ProgramItem {
  id: string;
  program_day_id: string;
  exercise_name: string;
  order_index: number;
  target_sets: number | null;
  target_reps: string | null;
  target_weight: number | null;
  rest_seconds: number | null;
  notes: string | null;
}

export default function ClientProgramPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { unit } = useUnits();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<Program | null>(null);
  const [days, setDays] = useState<ProgramDay[]>([]);
  const [items, setItems] = useState<ProgramItem[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const t = language === 'fr'
    ? {
        back: 'Retour',
        title: 'Mon programme',
        subtitle: 'Consulte ton programme',
        start: 'Debut',
        end: 'Fin',
        programPending: 'Programme en preparation',
        programPendingBody: 'Ton coach construit ton plan',
        weeklyPlan: 'Plan hebdo',
        week: 'Semaine',
        training: 'Entrainement',
        rest: 'Repos',
        today: 'Aujourd hui',
        todayFocus: 'Focus du jour',
        todayRest: 'Jour de repos',
        logWorkout: 'Logger la seance',
        exercises: 'exercices',
        sets: 'series',
        noExercises: 'Aucun exercice pour le moment',
        noProgram: 'Aucun programme pour le moment',
        noProgramBody: 'Ton coach va bientot assigner un programme',
        setsFallback: 'Series non definies',
        restLabel: 'Repos',
      }
    : {
        back: 'Back',
        title: 'Your program',
        subtitle: 'View your training program',
        start: 'Start',
        end: 'End',
        programPending: 'Program not available yet',
        programPendingBody: 'Your coach is building your plan',
        weeklyPlan: 'Weekly plan',
        week: 'Week',
        training: 'Training',
        rest: 'Rest',
        today: 'Today',
        todayFocus: 'Today focus',
        todayRest: 'Rest day',
        logWorkout: 'Log workout',
        exercises: 'exercises',
        sets: 'sets',
        noExercises: 'No exercises added yet',
        noProgram: 'No program assigned yet',
        noProgramBody: 'Your coach will assign you a program soon',
        setsFallback: 'Sets not set',
        restLabel: 'Rest',
      };

  const dayLabels = language === 'fr'
    ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayNames = language === 'fr'
    ? ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const itemsByDay = useMemo(() => {
    return items.reduce<Record<string, ProgramItem[]>>((acc, item) => {
      if (!acc[item.program_day_id]) acc[item.program_day_id] = [];
      acc[item.program_day_id].push(item);
      return acc;
    }, {});
  }, [items]);

  const weeks = useMemo(() => {
    const unique = new Set(days.map((day) => day.week_number));
    return Array.from(unique).sort((a, b) => a - b);
  }, [days]);

  const getCurrentWeekNumber = (startDate: string | null) => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const today = new Date();
    const diffDays = Math.floor(
      (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays >= 0 ? Math.floor(diffDays / 7) + 1 : 1;
  };

  const getCurrentDayNumber = () => {
    const day = new Date().getDay();
    return day === 0 ? 7 : day;
  };

  const loadProgram = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: programData, error: programError } = await supabase
        .from('programs')
        .select('id, title, description, start_date, end_date')
        .eq('client_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (programError) throw programError;
      if (!programData) {
        setProgram(null);
        setDays([]);
        setItems([]);
        return;
      }

      setProgram(programData as Program);

      const { data: daysData, error: daysError } = await supabase
        .from('program_days')
        .select('id, program_id, week_number, day_number, title, notes')
        .eq('program_id', programData.id)
        .order('week_number', { ascending: true })
        .order('day_number', { ascending: true });

      if (daysError) throw daysError;
      const programDays = (daysData as ProgramDay[]) || [];
      setDays(programDays);

      if (programDays.length > 0) {
        const dayIds = programDays.map((day) => day.id);
        const { data: itemsData, error: itemsError } = await supabase
          .from('program_items')
          .select(
            'id, program_day_id, exercise_name, order_index, target_sets, target_reps, target_weight, rest_seconds, notes'
          )
          .in('program_day_id', dayIds)
          .order('order_index', { ascending: true });

        if (itemsError) throw itemsError;
        setItems((itemsData as ProgramItem[]) || []);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error loading program:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadProgram();
  }, [loadProgram]);

  useEffect(() => {
    if (weeks.length === 0) return;
    const currentWeek = getCurrentWeekNumber(program?.start_date || null);
    const nextWeek =
      currentWeek && weeks.includes(currentWeek) ? currentWeek : weeks[0];
    setSelectedWeek((prev) => (prev === null ? nextWeek : prev));
  }, [weeks, program?.start_date]);

  if (loading) {
    return (
      <ClientLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </ClientLayout>
    );
  }

  const activeWeek = selectedWeek || weeks[0];
  const currentWeek = getCurrentWeekNumber(program?.start_date || null);
  const currentDay = getCurrentDayNumber();
  const activeDays = days.filter((day) => day.week_number === activeWeek);
  const dayMap = new Map(activeDays.map((day) => [day.day_number, day]));
  const todayDay =
    currentWeek !== null
      ? days.find(
          (day) =>
            day.week_number === currentWeek && day.day_number === currentDay
        )
      : null;
  const todayItems = todayDay ? itemsByDay[todayDay.id] || [] : [];

  return (
    <ClientLayout>
      <div className="min-h-screen bg-background">
        <header className="bg-background-surface border-b border-border">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/client/dashboard')}
              >
                <ChevronLeft className="w-4 h-4" />
                {t.back}
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{t.title}</h1>
                <p className="text-text-secondary mt-1">{t.subtitle}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-8">
          {program ? (
            <div className="space-y-6">
              <Card className="border-l-4 border-l-primary/30">
                <h2 className="text-2xl font-bold mb-2">{program.title}</h2>
                {program.description && (
                  <p className="text-text-secondary mb-4">{program.description}</p>
                )}
                <div className="flex flex-wrap gap-2 text-sm text-text-tertiary">
                  {program.start_date && (
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {t.start}: {program.start_date}
                    </span>
                  )}
                  {program.end_date && (
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {t.end}: {program.end_date}
                    </span>
                  )}
                </div>
              </Card>

              <Card className="border-l-4 border-l-accent/30">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{t.todayFocus}</h3>
                    <p className="text-sm text-text-tertiary mt-1">
                      {todayDay
                        ? `${dayLabels[todayDay.day_number - 1]} - ${todayDay.title}`
                        : t.todayRest}
                    </p>
                  </div>
                  {todayDay && todayItems.length > 0 && (
                    <Button
                      variant="primary"
                      onClick={() => router.push('/client/log-workout')}
                    >
                      {t.logWorkout}
                    </Button>
                  )}
                </div>
                {todayDay && todayItems.length > 0 && (
                  <p className="text-sm text-text-secondary mt-3">
                    {todayItems.length} {t.exercises}
                  </p>
                )}
              </Card>

              {days.length === 0 ? (
                <Card>
                  <div className="text-center py-10">
                    <p className="text-text-secondary mb-2">
                      {t.programPending}
                    </p>
                    <p className="text-sm text-text-tertiary">
                      {t.programPendingBody}
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-6">
                  <Card className="border-l-4 border-l-secondary/30">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{t.weeklyPlan}</h3>
                        <p className="text-sm text-text-tertiary">
                          {t.week} {activeWeek}
                        </p>
                      </div>
                      {weeks.length > 1 && (
                        <select
                          value={activeWeek}
                          onChange={(e) => setSelectedWeek(Number(e.target.value))}
                          className="input min-w-[160px]"
                        >
                          {weeks.map((week) => (
                            <option key={week} value={week}>
                              {t.week} {week}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </Card>

                  <div className="space-y-4">
                    <Card className="border border-border/60 bg-background-elevated/50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                        {dayNames.map((dayName, index) => {
                          const dayNumber = index + 1;
                          const dayInfo = dayMap.get(dayNumber);
                          const isToday =
                            currentWeek === activeWeek && currentDay === dayNumber;
                          const hasTraining = !!dayInfo;

                          return (
                            <div
                              key={dayName}
                              className={`rounded-lg border px-3 py-4 text-center ${
                                hasTraining
                                  ? 'border-primary/40 bg-primary/10'
                                  : 'border-border bg-background-surface'
                              } ${
                                isToday ? 'ring-2 ring-success/50' : ''
                              }`}
                            >
                              <p className="text-xs text-text-tertiary mb-1">
                                {dayLabels[index]}
                              </p>
                              <p className="font-semibold text-sm">{dayName}</p>
                              <p className="text-xs text-text-tertiary mt-2">
                                {hasTraining ? t.training : t.rest}
                              </p>
                              {isToday && (
                                <p className="text-xs text-success mt-1">{t.today}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </Card>

                    {days
                      .filter((day) => day.week_number === activeWeek)
                      .map((day) => {
                        const dayItems = itemsByDay[day.id] || [];
                        const isToday =
                          currentWeek === day.week_number &&
                          currentDay === day.day_number;

                        return (
                          <Card
                            key={day.id}
                            className={`border-l-4 ${
                              isToday
                                ? 'border-l-success/60 bg-success/5'
                                : 'border-l-secondary/30'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-lg font-semibold">
                                  {dayLabels[day.day_number - 1]} - {day.title}
                                </h3>
                                <p className="text-sm text-text-tertiary">
                                  {dayItems.length} {t.exercises}
                                </p>
                              </div>
                              {isToday && (
                                <span className="text-xs font-semibold text-success">
                                  {t.today}
                                </span>
                              )}
                            </div>

                            {dayItems.length > 0 ? (
                              <div className="space-y-3">
                                {dayItems.map((item) => (
                                  <div
                                    key={item.id}
                                    className="rounded-lg border border-border/60 bg-background-elevated/60 px-4 py-3"
                                  >
                                    <p className="font-semibold">
                                      {item.order_index}. {item.exercise_name}
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-tertiary">
                                      <span className="rounded-full border border-border px-2 py-1">
                                        {item.target_sets ? `${item.target_sets} ${t.sets}` : t.setsFallback}
                                      </span>
                                      {item.target_reps && (
                                        <span className="rounded-full border border-border px-2 py-1">
                                          {item.target_reps} reps
                                        </span>
                                      )}
                                      {item.target_weight && (
                                        <span className="rounded-full border border-border px-2 py-1">
                                          {formatWeight(item.target_weight, unit)}
                                        </span>
                                      )}
                                      {item.rest_seconds && (
                                        <span className="rounded-full border border-border px-2 py-1">
                                          {t.restLabel} {item.rest_seconds}s
                                        </span>
                                      )}
                                    </div>
                                    {item.notes && (
                                      <p className="text-sm text-text-tertiary mt-2">
                                        {item.notes}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-text-tertiary">
                                {t.noExercises}
                              </p>
                            )}
                          </Card>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <div className="text-center py-12">
                <Copy className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                <p className="text-text-secondary mb-2">{t.noProgram}</p>
                <p className="text-sm text-text-tertiary">
                  {t.noProgramBody}
                </p>
              </div>
            </Card>
          )}
        </main>
      </div>
    </ClientLayout>
  );
}
