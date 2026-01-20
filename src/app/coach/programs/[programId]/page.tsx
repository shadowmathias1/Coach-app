'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Trash2, Users, Calendar } from 'lucide-react';
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
  const [days, setDays] = useState<ProgramDay[]>([]);
  const [items, setItems] = useState<ProgramItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [expandedFormByDay, setExpandedFormByDay] = useState<Record<string, boolean>>({});

  const [showAddDay, setShowAddDay] = useState(false);
  const [newDay, setNewDay] = useState({
    week_number: 1,
    day_number: 1,
    title: '',
    notes: '',
  });

  const [newItemsByDay, setNewItemsByDay] = useState<
    Record<string, NewItemFormState>
  >({});

  const t = language === 'fr'
    ? {
        back: 'Retour',
        descriptionFallback: 'Construis et assigne ton programme',
        overviewTitle: 'Vue rapide',
        overviewBody: 'Etat, client, et dates en un coup d oeil',
        assignedLabel: 'Client',
        assignedEmpty: 'Non assigne',
        dateLabel: 'Periode',
        preview: 'Apercu client',
        editMode: 'Mode edition',
        assignTitle: 'Assigner a un client',
        assignBody: 'Lie ce programme pour le rendre visible chez le client',
        noClient: 'Aucun client',
        saveAssignment: "Enregistrer l'assignation",
        active: 'Actif',
        inactive: 'Inactif',
        start: 'Debut',
        end: 'Fin',
        scheduleTitle: 'Planning du programme',
        scheduleBody: 'Ajoute des jours et des exercices',
        addDay: 'Ajouter un jour',
        weeklyOverview: 'Vue semaine',
        week: 'Semaine',
        training: 'Entrainement',
        rest: 'Repos',
        dayLabel: 'Jour',
        dayTitle: 'Titre',
        dayNotes: 'Notes',
        saveDay: 'Enregistrer',
        cancel: 'Annuler',
        noDays: 'Aucun jour pour le moment',
        noDaysBody: 'Cree un jour et ajoute des exercices',
        exerciseName: "Nom de l'exercice",
        targetReps: 'Reps cible',
        sets: 'Series',
        restSeconds: 'Repos (sec)',
        targetWeight: `Charge cible (${weightInputLabel(unit)})`,
        notes: 'Notes',
        options: 'Options',
        hideOptions: 'Masquer',
        addExercise: 'Ajouter un exercice',
        deleteDay: 'Supprimer ce jour et ses exercices ?',
        deleteExercise: 'Supprimer cet exercice ?',
        dayRequired: 'Le titre du jour est requis',
        exerciseRequired: "Le nom de l'exercice est requis",
        dayAdded: 'Jour ajoute',
        dayRemoved: 'Jour supprime',
        exerciseAdded: 'Exercice ajoute',
        exerciseRemoved: 'Exercice supprime',
        saveFail: 'Impossible de mettre a jour le programme',
        assignmentSaved: 'Assignation enregistree',
        loadFail: 'Impossible de charger le programme',
        programNotFound: 'Programme introuvable',
        retry: 'Reessayer',
        backPrograms: 'Retour aux programmes',
        setsFallback: 'Series non definies',
        restLabel: 'Repos',
      }
    : {
        back: 'Back',
        descriptionFallback: 'Build and assign your program',
        overviewTitle: 'Quick overview',
        overviewBody: 'Status, client, and dates at a glance',
        assignedLabel: 'Client',
        assignedEmpty: 'Not assigned',
        dateLabel: 'Timeline',
        preview: 'Client preview',
        editMode: 'Edit mode',
        assignTitle: 'Assign to client',
        assignBody: 'Link this program to a client to make it visible',
        noClient: 'No client assigned',
        saveAssignment: 'Save assignment',
        active: 'Active',
        inactive: 'Inactive',
        start: 'Start',
        end: 'End',
        scheduleTitle: 'Program schedule',
        scheduleBody: 'Add training days and exercises',
        addDay: 'Add day',
        weeklyOverview: 'Weekly overview',
        week: 'Week',
        training: 'Training',
        rest: 'Rest',
        dayLabel: 'Day',
        dayTitle: 'Title',
        dayNotes: 'Notes',
        saveDay: 'Save day',
        cancel: 'Cancel',
        noDays: 'No training days yet',
        noDaysBody: 'Create a day and start adding exercises',
        exerciseName: 'Exercise name',
        targetReps: 'Target reps',
        sets: 'Sets',
        restSeconds: 'Rest (sec)',
        targetWeight: `Target weight (${weightInputLabel(unit)})`,
        notes: 'Notes',
        options: 'Options',
        hideOptions: 'Hide',
        addExercise: 'Add exercise',
        deleteDay: 'Delete this day and its exercises?',
        deleteExercise: 'Delete this exercise?',
        dayRequired: 'Day title is required',
        exerciseRequired: 'Exercise name is required',
        dayAdded: 'Day added',
        dayRemoved: 'Day removed',
        exerciseAdded: 'Exercise added',
        exerciseRemoved: 'Exercise removed',
        saveFail: 'Failed to update program',
        assignmentSaved: 'Assignment saved',
        loadFail: 'Failed to load program',
        programNotFound: 'Program not found',
        retry: 'Retry',
        backPrograms: 'Back to programs',
        setsFallback: 'Sets not set',
        restLabel: 'Rest',
      };

  const dayLabels = language === 'fr'
    ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayNames = language === 'fr'
    ? ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayOptions = dayNames.map((name, index) => ({
    value: index + 1,
    label: name,
  }));

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

  const assignedClient = useMemo(() => {
    return clients.find((client) => client.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

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
          'id, coach_id, client_id, title, description, start_date, end_date, is_active'
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

      const { data: daysData, error: daysError } = await supabase
        .from('program_days')
        .select('id, program_id, week_number, day_number, title, notes')
        .eq('program_id', programId)
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

  useEffect(() => {
    loadProgram();
  }, [loadProgram]);

  useEffect(() => {
    if (weeks.length === 0) return;
    setSelectedWeek((prev) => (prev === null ? weeks[0] : prev));
  }, [weeks]);

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

  const handleAddDay = async () => {
    if (!newDay.title.trim()) {
      toast.error(t.dayRequired);
      return;
    }

    try {
      if (!selectedWeek) {
        setSelectedWeek(newDay.week_number);
      }
      const { data, error } = await supabase
        .from('program_days')
        .insert({
          program_id: programId,
          week_number: newDay.week_number,
          day_number: newDay.day_number,
          title: newDay.title,
          notes: newDay.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      setDays((prev) => [...prev, data as ProgramDay]);
      setShowAddDay(false);
      setNewDay({ week_number: 1, day_number: 1, title: '', notes: '' });
      toast.success(t.dayAdded);
    } catch (error) {
      console.error('Error adding day:', error);
      toast.error(t.saveFail);
    }
  };

  const handleDeleteDay = async (dayId: string) => {
    if (!confirm(t.deleteDay)) return;

    try {
      const { error } = await supabase
        .from('program_days')
        .delete()
        .eq('id', dayId);

      if (error) throw error;

      setDays((prev) => prev.filter((day) => day.id !== dayId));
      setItems((prev) => prev.filter((item) => item.program_day_id !== dayId));
      toast.success(t.dayRemoved);
    } catch (error) {
      console.error('Error deleting day:', error);
      toast.error(t.saveFail);
    }
  };

  const handleAddItem = async (day: ProgramDay) => {
    const formState = newItemsByDay[day.id] || emptyItemState;
    if (!formState.exercise_name.trim()) {
      toast.error(t.exerciseRequired);
      return;
    }

    const dayItems = itemsByDay[day.id] || [];
    const orderIndex = dayItems.length + 1;

    const weightValue = formState.target_weight
      ? toMetricWeight(Number(formState.target_weight), unit)
      : null;

    try {
      const { data, error } = await supabase
        .from('program_items')
        .insert({
          program_day_id: day.id,
          exercise_name: formState.exercise_name,
          order_index: orderIndex,
          target_sets: formState.target_sets
            ? Number(formState.target_sets)
            : null,
          target_reps: formState.target_reps || null,
          target_weight: weightValue,
          rest_seconds: formState.rest_seconds
            ? Number(formState.rest_seconds)
            : null,
          notes: formState.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      setItems((prev) => [...prev, data as ProgramItem]);
      setNewItemsByDay((prev) => ({
        ...prev,
        [day.id]: { ...emptyItemState },
      }));
      toast.success(t.exerciseAdded);
    } catch (error) {
      console.error('Error adding exercise:', error);
      toast.error(t.saveFail);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm(t.deleteExercise)) return;

    try {
      const { error } = await supabase
        .from('program_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems((prev) => prev.filter((item) => item.id !== itemId));
      toast.success(t.exerciseRemoved);
    } catch (error) {
      console.error('Error deleting exercise:', error);
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

  const activeWeek = selectedWeek || weeks[0];
  const activeDays = days.filter((day) => day.week_number === activeWeek);
  const dayMap = new Map(activeDays.map((day) => [day.day_number, day]));

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
              <Button
                variant={previewMode ? 'secondary' : 'ghost'}
                onClick={() => setPreviewMode((prev) => !prev)}
              >
                {previewMode ? t.editMode : t.preview}
              </Button>
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
                <Badge variant="info">
                  {t.assignedLabel}:{' '}
                  {assignedClient?.display_name || t.assignedEmpty}
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

          {!previewMode && (
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">{t.scheduleTitle}</h2>
                <p className="text-text-secondary text-sm mt-1">
                  {t.scheduleBody}
                </p>
              </div>
              {!previewMode && (
                <Button
                  variant="secondary"
                  onClick={() => setShowAddDay((prev) => !prev)}
                >
                  <Plus className="w-4 h-4" />
                  {t.addDay}
                </Button>
              )}
            </div>

            {weeks.length > 0 && (
              <Card className="mb-6 border border-border/60 bg-background-elevated/50">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{t.weeklyOverview}</h3>
                      <p className="text-sm text-text-tertiary">
                        {t.week} {activeWeek}
                      </p>
                    </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 mt-4">
                  {dayNames.map((dayName, index) => {
                    const dayNumber = index + 1;
                    const dayInfo = dayMap.get(dayNumber);
                    const hasTraining = !!dayInfo;

                    return (
                      <div
                        key={dayName}
                        className={`rounded-lg border px-3 py-4 text-center ${
                          hasTraining
                            ? 'border-primary/40 bg-primary/10'
                            : 'border-border bg-background-surface'
                        }`}
                      >
                        <p className="text-xs text-text-tertiary mb-1">
                          {dayLabels[index]}
                        </p>
                        <p className="font-semibold text-sm">{dayName}</p>
                        <p className="text-xs text-text-tertiary mt-2">
                          {hasTraining ? t.training : t.rest}
                        </p>
                        {dayInfo && (
                          <p className="text-xs text-text-secondary mt-1">
                            {dayInfo.title}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {showAddDay && !previewMode && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Input
                  type="number"
                  label={t.week}
                  min={1}
                  value={newDay.week_number}
                  onChange={(e) =>
                    setNewDay({
                      ...newDay,
                      week_number: Number(e.target.value),
                    })
                  }
                />
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t.dayLabel}
                  </label>
                  <select
                    className="input"
                    value={newDay.day_number}
                    onChange={(e) =>
                      setNewDay({
                        ...newDay,
                        day_number: Number(e.target.value),
                      })
                    }
                  >
                    {dayOptions.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  type="text"
                  label={t.dayTitle}
                  value={newDay.title}
                  onChange={(e) => setNewDay({ ...newDay, title: e.target.value })}
                />
                <Input
                  type="text"
                  label={t.dayNotes}
                  value={newDay.notes}
                  onChange={(e) => setNewDay({ ...newDay, notes: e.target.value })}
                />
                <div className="md:col-span-4 flex gap-3">
                  <Button variant="primary" onClick={handleAddDay}>
                    {t.saveDay}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowAddDay(false)}
                  >
                    {t.cancel}
                  </Button>
                </div>
              </div>
            )}

            {days.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-text-secondary mb-2">{t.noDays}</p>
                <p className="text-sm text-text-tertiary">{t.noDaysBody}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {days
                  .filter((day) => day.week_number === activeWeek)
                  .map((day) => {
                    const dayItems = itemsByDay[day.id] || [];
                    const formState = newItemsByDay[day.id] || emptyItemState;

                    return (
                      <Card
                        key={day.id}
                        className="border border-border/60 bg-background-elevated/50"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {t.week} {day.week_number} - {dayNames[day.day_number - 1]} - {day.title}
                            </h3>
                            {day.notes && (
                              <p className="text-sm text-text-tertiary">
                                {day.notes}
                              </p>
                            )}
                          </div>
                          {!previewMode && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDay(day.id)}
                            >
                              <Trash2 className="w-4 h-4 text-danger" />
                            </Button>
                          )}
                        </div>

                        {dayItems.length > 0 && (
                          <div className="space-y-3 mb-6">
                            {dayItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-lg border border-border/60 bg-background-surface px-4 py-3"
                              >
                                <div>
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
                                    <p className="mt-2 text-sm text-text-tertiary">
                                      {item.notes}
                                    </p>
                                  )}
                                </div>
                                {!previewMode && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteItem(item.id)}
                                  >
                                    <Trash2 className="w-4 h-4 text-danger" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {!previewMode && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Input
                                type="text"
                                label={t.exerciseName}
                                value={formState.exercise_name}
                                onChange={(e) =>
                                  setNewItemsByDay((prev) => ({
                                    ...prev,
                                    [day.id]: {
                                      ...formState,
                                      exercise_name: e.target.value,
                                    },
                                  }))
                                }
                              />
                              <Input
                                type="text"
                                label={t.targetReps}
                                placeholder="e.g. 8-10"
                                value={formState.target_reps}
                                onChange={(e) =>
                                  setNewItemsByDay((prev) => ({
                                    ...prev,
                                    [day.id]: {
                                      ...formState,
                                      target_reps: e.target.value,
                                    },
                                  }))
                                }
                              />
                              <Input
                                type="number"
                                label={t.sets}
                                min={1}
                                value={formState.target_sets}
                                onChange={(e) =>
                                  setNewItemsByDay((prev) => ({
                                    ...prev,
                                    [day.id]: {
                                      ...formState,
                                      target_sets: e.target.value,
                                    },
                                  }))
                                }
                              />
                            </div>
                            {expandedFormByDay[day.id] && (
                              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input
                                  type="number"
                                  label={t.restSeconds}
                                  min={0}
                                  value={formState.rest_seconds}
                                  onChange={(e) =>
                                    setNewItemsByDay((prev) => ({
                                      ...prev,
                                      [day.id]: {
                                        ...formState,
                                        rest_seconds: e.target.value,
                                      },
                                    }))
                                  }
                                />
                                <Input
                                  type="number"
                                  label={t.targetWeight}
                                  min={0}
                                  step={0.5}
                                  value={formState.target_weight}
                                  onChange={(e) =>
                                    setNewItemsByDay((prev) => ({
                                      ...prev,
                                      [day.id]: {
                                        ...formState,
                                        target_weight: e.target.value,
                                      },
                                    }))
                                  }
                                />
                                <Input
                                  type="text"
                                  label={t.notes}
                                  value={formState.notes}
                                  onChange={(e) =>
                                    setNewItemsByDay((prev) => ({
                                      ...prev,
                                      [day.id]: {
                                        ...formState,
                                        notes: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              </div>
                            )}
                            <div className="mt-4 flex flex-wrap gap-3">
                              <Button variant="secondary" onClick={() => handleAddItem(day)}>
                                <Plus className="w-4 h-4" />
                                {t.addExercise}
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() =>
                                  setExpandedFormByDay((prev) => ({
                                    ...prev,
                                    [day.id]: !prev[day.id],
                                  }))
                                }
                              >
                                {expandedFormByDay[day.id] ? t.hideOptions : t.options}
                              </Button>
                            </div>
                          </>
                        )}
                      </Card>
                    );
                  })}
              </div>
            )}
          </Card>
        </main>
      </div>
    </CoachLayout>
  );
}
