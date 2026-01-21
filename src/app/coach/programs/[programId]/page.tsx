'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, ChevronLeft, ChevronRight, Plus, Trash2, Users } from 'lucide-react';
import CoachLayout from '@/components/layout/CoachLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { getCurrentUser, supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useLanguage } from '@/components/shared/LanguageProvider';
import { useUnits } from '@/components/shared/UnitProvider';
import { formatWeight, toMetricWeight, weightInputLabel } from '@/lib/units';

interface Program {
  id: string;
  coach_id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  is_template: boolean;
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

interface ClientSummary {
  id: string;
  display_name: string;
}

interface NewItemFormState {
  exercise_name: string;
  target_sets: string;
  target_reps: string;
  target_weight: string;
  rest_seconds: string;
  notes: string;
}

const emptyItemState: NewItemFormState = {
  exercise_name: '',
  target_sets: '',
  target_reps: '',
  target_weight: '',
  rest_seconds: '',
  notes: '',
};

export default function CoachProgramDetailPage() {
  const router = useRouter();
  const params = useParams();
  const programId = params.programId as string;
  const { language } = useLanguage();
  const { unit } = useUnits();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [program, setProgram] = useState<Program | null>(null);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeMonth, setActiveMonth] = useState(() => new Date());
  const [sessions, setSessions] = useState<ProgramSession[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<ProgramSession | null>(null);
  const [sessionItems, setSessionItems] = useState<SessionItem[]>([]);
  const [sessionSaving, setSessionSaving] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    title: '',
    is_rest_day: false,
    notes: '',
  });
  const [newItem, setNewItem] = useState<NewItemFormState>(emptyItemState);

  const t = language === 'fr'
    ? {
        back: 'Retour',
        descriptionFallback: 'Construis et assigne ton programme',
        overviewTitle: 'Vue rapide',
        overviewBody: 'Etat, client, et dates en un coup d oeil',
        assignedLabel: 'Client',
        assignedEmpty: 'Non assigne',
        dateLabel: 'Periode',
        assignTitle: 'Assigner a un client',
        assignBody: 'Lie ce programme pour le rendre visible chez le client',
        noClient: 'Aucun client',
        saveAssignment: "Enregistrer l'assignation",
        active: 'Actif',
        inactive: 'Inactif',
        template: 'Template',
        start: 'Debut',
        end: 'Fin',
        scheduleTitle: 'Calendrier du programme',
        scheduleBody: 'Clique un jour pour planifier une seance',
        monthLabel: 'Mois',
        sessionTitle: 'Titre de la seance',
        sessionNotes: 'Notes',
        restDay: 'Jour de repos',
        createSession: 'Creer la seance',
        updateSession: 'Mettre a jour',
        deleteSession: 'Supprimer la seance',
        sessionRequired: 'Le titre de la seance est requis',
        exerciseName: "Nom de l'exercice",
        targetReps: 'Reps cible',
        sets: 'Series',
        restSeconds: 'Repos (sec)',
        targetWeight: `Charge cible (${weightInputLabel(unit)})`,
        notes: 'Notes',
        addExercise: 'Ajouter un exercice',
        deleteExercise: 'Supprimer cet exercice ?',
        saveFail: 'Impossible de mettre a jour le programme',
        assignmentSaved: 'Assignation enregistree',
        loadFail: 'Impossible de charger le programme',
        programNotFound: 'Programme introuvable',
        retry: 'Reessayer',
        backPrograms: 'Retour aux programmes',
        restLabel: 'Repos',
        noSession: 'Aucune seance pour ce jour',
        selectDay: 'Selectionne un jour',
        restSummary: 'Ce jour est marque comme repos.',
      }
    : {
        back: 'Back',
        descriptionFallback: 'Build and assign your program',
        overviewTitle: 'Quick overview',
        overviewBody: 'Status, client, and dates at a glance',
        assignedLabel: 'Client',
        assignedEmpty: 'Not assigned',
        dateLabel: 'Timeline',
        assignTitle: 'Assign to client',
        assignBody: 'Link this program to a client to make it visible',
        noClient: 'No client assigned',
        saveAssignment: 'Save assignment',
        active: 'Active',
        inactive: 'Inactive',
        template: 'Template',
        start: 'Start',
        end: 'End',
        scheduleTitle: 'Program calendar',
        scheduleBody: 'Click a day to plan a session',
        monthLabel: 'Month',
        sessionTitle: 'Session title',
        sessionNotes: 'Notes',
        restDay: 'Rest day',
        createSession: 'Create session',
        updateSession: 'Update session',
        deleteSession: 'Delete session',
        sessionRequired: 'Session title is required',
        exerciseName: 'Exercise name',
        targetReps: 'Target reps',
        sets: 'Sets',
        restSeconds: 'Rest (sec)',
        targetWeight: `Target weight (${weightInputLabel(unit)})`,
        notes: 'Notes',
        addExercise: 'Add exercise',
        deleteExercise: 'Delete this exercise?',
        saveFail: 'Failed to update program',
        assignmentSaved: 'Assignment saved',
        loadFail: 'Failed to load program',
        programNotFound: 'Program not found',
        retry: 'Retry',
        backPrograms: 'Back to programs',
        restLabel: 'Rest',
        noSession: 'No session on this day',
        selectDay: 'Select a day',
        restSummary: 'This day is marked as rest.',
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
      setLoadError(null);
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: programData, error: programError } = await supabase
        .from('programs')
        .select(
          'id, coach_id, client_id, title, description, start_date, end_date, is_active, is_template'
        )
        .eq('id', programId)
        .eq('coach_id', user.id)
        .single();

      if (programError) throw programError;
      const programRecord = programData as Program;
      setProgram(programRecord);
      setSelectedClientId(programRecord.client_id || '');

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, display_name')
        .eq('coach_id', user.id)
        .order('display_name', { ascending: true });

      if (clientsError) throw clientsError;
      setClients((clientsData as ClientSummary[]) || []);
    } catch (error: any) {
      console.error('Error loading program:', error);
      const message =
        error?.message ||
        t.loadFail;
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [programId, router, t.loadFail]);

  const loadSessionsForMonth = useCallback(async () => {
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
      toast.error(t.loadFail);
    }
  }, [activeMonth, programId, t.loadFail]);

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
      toast.error(t.loadFail);
    }
  }, [t.loadFail]);

  useEffect(() => {
    loadProgram();
  }, [loadProgram]);

  useEffect(() => {
    loadSessionsForMonth();
  }, [loadSessionsForMonth]);

  useEffect(() => {
    if (!selectedDate) {
      setSelectedSession(null);
      setSessionItems([]);
      setSessionForm({ title: '', is_rest_day: false, notes: '' });
      return;
    }
    const session = sessionsByDate[selectedDate] || null;
    setSelectedSession(session);
    if (session) {
      setSessionForm({
        title: session.title,
        is_rest_day: session.is_rest_day,
        notes: session.notes || '',
      });
      loadSessionItems(session.id);
    } else {
      setSessionItems([]);
      setSessionForm({ title: '', is_rest_day: false, notes: '' });
    }
  }, [selectedDate, sessionsByDate, loadSessionItems]);

  const handleAssign = async () => {
    if (!program) return;

    try {
      setSaving(true);
      const today = new Date().toISOString().split('T')[0];
      const updatePayload =
        selectedClientId && selectedClientId !== ''
          ? {
              client_id: selectedClientId,
              is_active: true,
              start_date: program.start_date || today,
            }
          : {
              client_id: null,
              is_active: false,
            };

      const { error } = await supabase
        .from('programs')
        .update(updatePayload)
        .eq('id', program.id);

      if (error) throw error;

      setProgram({
        ...program,
        client_id: selectedClientId || null,
        is_active: !!selectedClientId,
        start_date: updatePayload.start_date ?? program.start_date,
      });
      toast.success(t.assignmentSaved);
    } catch (error) {
      console.error('Error updating program:', error);
      toast.error(t.saveFail);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSession = async () => {
    if (!selectedDate) return;
    const title =
      sessionForm.title.trim() ||
      (sessionForm.is_rest_day ? t.restLabel : '');
    if (!title) {
      toast.error(t.sessionRequired);
      return;
    }

    try {
      setSessionSaving(true);
      const { data, error } = await supabase
        .from('program_sessions')
        .insert({
          program_id: programId,
          date: selectedDate,
          title,
          is_rest_day: sessionForm.is_rest_day,
          notes: sessionForm.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      const session = data as ProgramSession;
      setSessions((prev) => [...prev, session]);
      setSelectedSession(session);
      setSessionForm({
        title: session.title,
        is_rest_day: session.is_rest_day,
        notes: session.notes || '',
      });
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error(t.saveFail);
    } finally {
      setSessionSaving(false);
    }
  };

  const handleUpdateSession = async () => {
    if (!selectedSession) return;
    const title =
      sessionForm.title.trim() ||
      (sessionForm.is_rest_day ? t.restLabel : '');
    if (!title) {
      toast.error(t.sessionRequired);
      return;
    }

    try {
      setSessionSaving(true);
      const { error } = await supabase
        .from('program_sessions')
        .update({
          title,
          is_rest_day: sessionForm.is_rest_day,
          notes: sessionForm.notes || null,
        })
        .eq('id', selectedSession.id);

      if (error) throw error;
      setSessions((prev) =>
        prev.map((session) =>
          session.id === selectedSession.id
            ? { ...session, title, is_rest_day: sessionForm.is_rest_day, notes: sessionForm.notes || null }
            : session
        )
      );
      setSelectedSession({
        ...selectedSession,
        title,
        is_rest_day: sessionForm.is_rest_day,
        notes: sessionForm.notes || null,
      });
      if (sessionForm.is_rest_day) {
        setSessionItems([]);
      }
      toast.success(t.updateSession);
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error(t.saveFail);
    } finally {
      setSessionSaving(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!selectedSession) return;
    if (!confirm(t.deleteSession)) return;

    try {
      setSessionSaving(true);
      const { error } = await supabase
        .from('program_sessions')
        .delete()
        .eq('id', selectedSession.id);

      if (error) throw error;

      setSessions((prev) => prev.filter((session) => session.id !== selectedSession.id));
      setSelectedSession(null);
      setSessionItems([]);
      setSessionForm({ title: '', is_rest_day: false, notes: '' });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error(t.saveFail);
    } finally {
      setSessionSaving(false);
    }
  };

  const handleAddItem = async () => {
    if (!selectedSession) return;
    if (!newItem.exercise_name.trim()) {
      toast.error(t.exerciseName);
      return;
    }

    const orderIndex = sessionItems.length + 1;
    const weightValue = newItem.target_weight
      ? toMetricWeight(Number(newItem.target_weight), unit)
      : null;

    try {
      const { data, error } = await supabase
        .from('session_items')
        .insert({
          program_session_id: selectedSession.id,
          exercise_name: newItem.exercise_name,
          order_index: orderIndex,
          target_sets: newItem.target_sets ? Number(newItem.target_sets) : null,
          target_reps: newItem.target_reps || null,
          target_weight: weightValue,
          rest_seconds: newItem.rest_seconds ? Number(newItem.rest_seconds) : null,
          notes: newItem.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      setSessionItems((prev) => [...prev, data as SessionItem]);
      setNewItem(emptyItemState);
    } catch (error) {
      console.error('Error adding session item:', error);
      toast.error(t.saveFail);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm(t.deleteExercise)) return;

    try {
      const { error } = await supabase
        .from('session_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      setSessionItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting session item:', error);
      toast.error(t.saveFail);
    }
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

  if (loadError) {
    return (
      <CoachLayout>
        <div className="min-h-screen bg-background flex items-center justify-center px-6">
          <Card className="max-w-xl w-full ">
            <h2 className="text-xl font-semibold mb-2">{t.loadFail}</h2>
            <p className="text-text-secondary text-sm mb-4">{loadError}</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => loadProgram()}>
                {t.retry}
              </Button>
              <Button variant="ghost" onClick={() => router.push('/coach/programs')}>
                {t.backPrograms}
              </Button>
            </div>
          </Card>
        </div>
      </CoachLayout>
    );
  }

  if (!program) {
    return (
      <CoachLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-text-secondary">{t.programNotFound}</p>
        </div>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout>
      <div className="min-h-screen bg-background">
        <header className="bg-background-surface border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/coach/programs')}
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t.back}
                </Button>
                <div>
                  <h1 className="text-3xl font-bold">{program.title}</h1>
                  <p className="text-text-secondary mt-1">
                    {program.description || t.descriptionFallback}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          <Card className="">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">{t.overviewTitle}</h2>
                <p className="text-text-secondary text-sm mt-1">
                  {t.overviewBody}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={program.is_active ? 'success' : 'warning'}>
                  {program.is_active ? t.active : t.inactive}
                </Badge>
                {program.is_template && (
                  <Badge variant="info">{t.template}</Badge>
                )}
                <Badge variant="info">
                  {t.assignedLabel}:{' '}
                  {selectedClientId
                    ? clients.find((client) => client.id === selectedClientId)?.display_name
                    : t.assignedEmpty}
                </Badge>
                {(program.start_date || program.end_date) && (
                  <Badge variant="info">
                    {t.dateLabel}:{' '}
                    {program.start_date || '---'} - {program.end_date || '---'}
                  </Badge>
                )}
              </div>
            </div>
          </Card>

          {!program.is_template && (
            <Card className="">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    {t.assignTitle}
                  </h2>
                  <p className="text-text-secondary text-sm mt-1">
                    {t.assignBody}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="input min-w-[220px]"
                  >
                    <option value="">{t.noClient}</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.display_name}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="primary"
                    onClick={handleAssign}
                    loading={saving}
                  >
                    {t.saveAssignment}
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant={program.is_active ? 'success' : 'warning'}>
                  {program.is_active ? t.active : t.inactive}
                </Badge>
                {program.start_date && (
                  <Badge variant="info">{t.start}: {program.start_date}</Badge>
                )}
                {program.end_date && (
                  <Badge variant="info">{t.end}: {program.end_date}</Badge>
                )}
              </div>
            </Card>
          )}

          <Card className="">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">{t.scheduleTitle}</h2>
                <p className="text-text-secondary text-sm mt-1">
                  {t.scheduleBody}
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
                <div className="text-sm text-text-secondary">
                  {t.monthLabel}: <span className="font-semibold text-text-primary">{monthLabel}</span>
                </div>
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

                  return (
                    <button
                      key={dateKey}
                      onClick={() => setSelectedDate(dateKey)}
                      className={`min-h-[90px] rounded-lg border px-2 py-2 text-left transition-colors ${
                        session
                          ? 'border-primary/40 bg-primary/10'
                          : 'border-border bg-background-surface'
                      } ${isSelected ? 'ring-2 ring-primary/40' : ''}`}
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
                    </button>
                  );
                })}
              </div>
            </Card>

            <div className="mt-6">
              {!selectedDate ? (
                <p className="text-text-secondary">{t.selectDay}</p>
              ) : (
                <Card className="border border-border/60 bg-background-elevated/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="font-semibold">{selectedDate}</span>
                    </div>
                    {selectedSession && (
                      <Button variant="ghost" size="sm" onClick={handleDeleteSession}>
                        <Trash2 className="w-4 h-4 text-danger" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="text"
                      label={t.sessionTitle}
                      value={sessionForm.title}
                      onChange={(e) => setSessionForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))}
                    />
                    <Input
                      type="text"
                      label={t.sessionNotes}
                      value={sessionForm.notes}
                      onChange={(e) => setSessionForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))}
                    />
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <input
                      id="restDayToggle"
                      type="checkbox"
                      checked={sessionForm.is_rest_day}
                      onChange={(e) => setSessionForm((prev) => ({
                        ...prev,
                        is_rest_day: e.target.checked,
                      }))}
                    />
                    <label htmlFor="restDayToggle" className="text-sm text-text-secondary">
                      {t.restDay}
                    </label>
                  </div>

                  <div className="mt-4 flex gap-3">
                    {selectedSession ? (
                      <Button variant="primary" onClick={handleUpdateSession} loading={sessionSaving}>
                        {t.updateSession}
                      </Button>
                    ) : (
                      <Button variant="primary" onClick={handleCreateSession} loading={sessionSaving}>
                        <Plus className="w-4 h-4" />
                        {t.createSession}
                      </Button>
                    )}
                  </div>

                  {selectedSession && (
                    <div className="mt-6 space-y-4">
                      {sessionForm.is_rest_day ? (
                        <p className="text-sm text-text-tertiary">{t.restSummary}</p>
                      ) : (
                        <>
                          {sessionItems.length > 0 && (
                            <div className="space-y-3">
                              {sessionItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-lg border border-border/60 bg-background-surface px-4 py-3"
                                >
                                  <div>
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
                                      {item.rest_seconds && (
                                        <span className="rounded-full border border-border px-2 py-1">
                                          {t.restLabel} {item.rest_seconds}s
                                        </span>
                                      )}
                                    </div>
                                    {item.notes && (
                                      <p className="mt-2 text-sm text-text-tertiary">
                                        {item.notes}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteItem(item.id)}
                                  >
                                    <Trash2 className="w-4 h-4 text-danger" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                              type="text"
                              label={t.exerciseName}
                              value={newItem.exercise_name}
                              onChange={(e) => setNewItem((prev) => ({
                                ...prev,
                                exercise_name: e.target.value,
                              }))}
                            />
                            <Input
                              type="text"
                              label={t.targetReps}
                              value={newItem.target_reps}
                              onChange={(e) => setNewItem((prev) => ({
                                ...prev,
                                target_reps: e.target.value,
                              }))}
                            />
                            <Input
                              type="number"
                              label={t.sets}
                              min={1}
                              value={newItem.target_sets}
                              onChange={(e) => setNewItem((prev) => ({
                                ...prev,
                                target_sets: e.target.value,
                              }))}
                            />
                            <Input
                              type="number"
                              label={t.restSeconds}
                              min={0}
                              value={newItem.rest_seconds}
                              onChange={(e) => setNewItem((prev) => ({
                                ...prev,
                                rest_seconds: e.target.value,
                              }))}
                            />
                            <Input
                              type="number"
                              label={t.targetWeight}
                              min={0}
                              step={0.5}
                              value={newItem.target_weight}
                              onChange={(e) => setNewItem((prev) => ({
                                ...prev,
                                target_weight: e.target.value,
                              }))}
                            />
                            <Input
                              type="text"
                              label={t.notes}
                              value={newItem.notes}
                              onChange={(e) => setNewItem((prev) => ({
                                ...prev,
                                notes: e.target.value,
                              }))}
                            />
                          </div>
                          <div className="mt-4">
                            <Button variant="secondary" onClick={handleAddItem}>
                              <Plus className="w-4 h-4" />
                              {t.addExercise}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </Card>
              )}
            </div>
          </Card>
        </main>
      </div>
    </CoachLayout>
  );
}
