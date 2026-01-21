'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, ChevronLeft, Calendar, ChevronRight } from 'lucide-react';
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

interface ProgramSession {
  id: string;
  program_id: string;
  date: string;
  title: string;
  is_rest_day: boolean;
  notes: string | null;
}

interface SessionItem {
  id: string;
  program_session_id: string;
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
  const [sessions, setSessions] = useState<ProgramSession[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<ProgramSession | null>(null);
  const [sessionItems, setSessionItems] = useState<SessionItem[]>([]);
  const [activeMonth, setActiveMonth] = useState(() => new Date());

  const t = language === 'fr'
    ? {
        back: 'Retour',
        title: 'Mon programme',
        subtitle: 'Consulte ton programme',
        start: 'Debut',
        end: 'Fin',
        programPending: 'Programme en preparation',
        programPendingBody: 'Ton coach construit ton plan',
        calendarTitle: 'Calendrier du mois',
        rest: 'Repos',
        today: 'Aujourd hui',
        logWorkout: 'Logger la seance',
        exercises: 'exercices',
        sets: 'series',
        noExercises: 'Aucun exercice pour le moment',
        noProgram: 'Aucun programme pour le moment',
        noProgramBody: 'Ton coach va bientot assigner un programme',
        restLabel: 'Repos',
        selectDay: 'Selectionne un jour',
        sessionNotes: 'Notes',
      }
    : {
        back: 'Back',
        title: 'Your program',
        subtitle: 'View your training program',
        start: 'Start',
        end: 'End',
        programPending: 'Program not available yet',
        programPendingBody: 'Your coach is building your plan',
        calendarTitle: 'Monthly calendar',
        rest: 'Rest',
        today: 'Today',
        logWorkout: 'Log workout',
        exercises: 'exercises',
        sets: 'sets',
        noExercises: 'No exercises added yet',
        noProgram: 'No program assigned yet',
        noProgramBody: 'Your coach will assign you a program soon',
        restLabel: 'Rest',
        selectDay: 'Select a day',
        sessionNotes: 'Notes',
      };

  const dayLabels = language === 'fr'
    ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const monthLabel = activeMonth.toLocaleDateString(
    language === 'fr' ? 'fr-FR' : 'en-US',
    { month: 'long', year: 'numeric' }
  );

  const calendarDays = useMemo(() => {
    const startOfMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1);
    const daysInMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0).getDate();
    const offset = (startOfMonth.getDay() + 6) % 7;
    const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - offset + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) {
        return null;
      }
      return new Date(activeMonth.getFullYear(), activeMonth.getMonth(), dayNumber);
    });
  }, [activeMonth]);

  const sessionsByDate = useMemo(() => {
    return sessions.reduce<Record<string, ProgramSession>>((acc, session) => {
      acc[session.date] = session;
      return acc;
    }, {});
  }, [sessions]);

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
        setSessions([]);
        setSelectedDate(null);
        setSelectedSession(null);
        setSessionItems([]);
        return;
      }

      setProgram(programData as Program);
    } catch (error) {
      console.error('Error loading program:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadSessionsForMonth = useCallback(async (programId: string) => {
    try {
      const startOfMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1);
      const endOfMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0);
      const startKey = formatDateKey(startOfMonth);
      const endKey = formatDateKey(endOfMonth);

      const { data, error } = await supabase
        .from('program_sessions')
        .select('id, program_id, date, title, is_rest_day, notes')
        .eq('program_id', programId)
        .gte('date', startKey)
        .lte('date', endKey)
        .order('date', { ascending: true });

      if (error) throw error;
      setSessions((data as ProgramSession[]) || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }, [activeMonth]);

  const loadSessionItems = useCallback(async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('session_items')
        .select(
          'id, program_session_id, exercise_name, order_index, target_sets, target_reps, target_weight, rest_seconds, notes'
        )
        .eq('program_session_id', sessionId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setSessionItems((data as SessionItem[]) || []);
    } catch (error) {
      console.error('Error loading session items:', error);
    }
  }, []);

  useEffect(() => {
    loadProgram();
  }, [loadProgram]);

  useEffect(() => {
    if (!program) return;
    loadSessionsForMonth(program.id);
  }, [program, activeMonth, loadSessionsForMonth]);

  useEffect(() => {
    if (!selectedDate) {
      setSelectedSession(null);
      setSessionItems([]);
      return;
    }
    const session = sessionsByDate[selectedDate] || null;
    setSelectedSession(session);
    if (session) {
      loadSessionItems(session.id);
    } else {
      setSessionItems([]);
    }
  }, [selectedDate, sessionsByDate, loadSessionItems]);

  useEffect(() => {
    if (selectedDate || sessions.length === 0) return;
    const today = formatDateKey(new Date());
    setSelectedDate(sessionsByDate[today] ? today : sessions[0].date);
  }, [selectedDate, sessions, sessionsByDate]);

  if (loading) {
    return (
      <ClientLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </ClientLayout>
    );
  }

  const todayKey = formatDateKey(new Date());

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
              <Card className="">
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

              <Card className="">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{t.calendarTitle}</h3>
                    <p className="text-sm text-text-tertiary mt-1">
                      {monthLabel}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setActiveMonth(
                          (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                        )
                      }
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setActiveMonth(
                          (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                        )
                      }
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="border border-border/60 bg-background-elevated/50">
                <div className="grid grid-cols-7 gap-2 text-center text-xs text-text-tertiary mb-2">
                  {dayLabels.map((label) => (
                    <div key={label}>{label}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((date, index) => {
                    if (!date) {
                      return <div key={`empty-${index}`} className="min-h-[90px]" />;
                    }
                    const dateKey = formatDateKey(date);
                    const session = sessionsByDate[dateKey];
                    const isSelected = selectedDate === dateKey;
                    const isToday = dateKey === todayKey;

                    return (
                      <button
                        key={dateKey}
                        onClick={() => setSelectedDate(dateKey)}
                        className={`min-h-[90px] rounded-lg border px-2 py-2 text-left transition-colors ${
                          session
                            ? 'border-primary/40 bg-primary/10'
                            : 'border-border bg-background-surface'
                        } ${isSelected ? 'ring-2 ring-primary/40' : ''} ${isToday ? 'ring-2 ring-success/40' : ''}`}
                      >
                        <div className="text-xs text-text-tertiary mb-1">
                          {date.getDate()}
                        </div>
                        {session ? (
                          <div className="text-xs font-semibold text-text-primary">
                            {session.is_rest_day ? t.restLabel : session.title}
                          </div>
                        ) : (
                          <div className="text-[11px] text-text-tertiary">
                            {t.selectDay}
                          </div>
                        )}
                        {isToday && (
                          <div className="text-[11px] text-success mt-1">{t.today}</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card className="border border-border/60 bg-background-elevated/50">
                {!selectedDate ? (
                  <p className="text-text-secondary">{t.selectDay}</p>
                ) : selectedSession ? (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {selectedSession.date} - {selectedSession.title}
                        </h3>
                        {selectedSession.is_rest_day && (
                          <p className="text-sm text-text-tertiary">{t.rest}</p>
                        )}
                      </div>
                      {!selectedSession.is_rest_day && (
                        <Button
                          variant="primary"
                          onClick={() =>
                            router.push(`/client/log-workout?sessionId=${selectedSession.id}`)
                          }
                        >
                          {t.logWorkout}
                        </Button>
                      )}
                    </div>
                    {selectedSession.notes && (
                      <p className="text-sm text-text-tertiary">
                        {t.sessionNotes}: {selectedSession.notes}
                      </p>
                    )}
                    {!selectedSession.is_rest_day && (
                      <>
                        {sessionItems.length > 0 ? (
                          <div className="space-y-3">
                            {sessionItems.map((item) => (
                              <div
                                key={item.id}
                                className="rounded-lg border border-border/60 bg-background-elevated/60 px-4 py-3"
                              >
                                <p className="font-semibold">
                                  {item.order_index}. {item.exercise_name}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-tertiary">
                                  {item.target_sets && (
                                    <span className="rounded-full border border-border px-2 py-1">
                                      {item.target_sets} {t.sets}
                                    </span>
                                  )}
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
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-text-secondary">{t.programPending}</p>
                )}
              </Card>
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
