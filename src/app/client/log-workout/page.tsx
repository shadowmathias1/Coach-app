'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, ChevronLeft, Search, X } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import ClientLayout from '@/components/layout/ClientLayout';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { toast } from 'sonner';
import { useLanguage } from '@/components/shared/LanguageProvider';
import { useUnits } from '@/components/shared/UnitProvider';
import { toMetricWeight, weightInputLabel } from '@/lib/units';

interface ExerciseSet {
  reps: number;
  weight: number;
  rpe: number;
}

interface Exercise {
  id: string;
  name: string;
  exerciseId: string | null; // ID de l'exercice dans la bibliothèque
  sets: ExerciseSet[];
}

interface ExerciseOption {
  id: string;
  name: string;
  muscle_group: string | null;
}

export default function LogWorkoutPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { unit } = useUnits();
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');

  // Exercise library
  const [exerciseLibrary, setExerciseLibrary] = useState<ExerciseOption[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showExercisePicker, setShowExercisePicker] = useState<string | null>(null);

  const t = language === 'fr'
    ? {
        back: 'Retour',
        title: 'Seance',
        durationLabel: 'Duree (minutes)',
        addExercise: 'Ajouter un exercice',
        addSet: 'Ajouter une serie',
        exercisePlaceholder: "Rechercher ou creer un exercice",
        set: 'Serie',
        reps: 'Reps',
        weight: `Poids (${weightInputLabel(unit)})`,
        rpe: 'RPE',
        notesLabel: 'Notes (optionnel)',
        notesPlaceholder: 'Comment etait la seance ?',
        save: 'Enregistrer',
        success: 'Seance enregistree !',
        fail: 'Impossible de sauvegarder la seance',
        selectExercise: 'Choisir un exercice',
        searchExercise: 'Rechercher...',
        noResults: 'Aucun exercice trouve',
        createNew: 'Creer',
        libraryTitle: 'Bibliotheque',
        recentTitle: 'Recents',
        customExercise: 'Exercice personnalise',
      }
    : {
        back: 'Back',
        title: 'Log workout',
        durationLabel: 'Workout duration (minutes)',
        addExercise: 'Add exercise',
        addSet: 'Add set',
        exercisePlaceholder: 'Search or create an exercise',
        set: 'Set',
        reps: 'Reps',
        weight: `Weight (${weightInputLabel(unit)})`,
        rpe: 'RPE',
        notesLabel: 'Workout notes (optional)',
        notesPlaceholder: 'How did you feel? Any observations?',
        save: 'Save workout',
        success: 'Workout logged successfully!',
        fail: 'Failed to save workout',
        selectExercise: 'Select an exercise',
        searchExercise: 'Search...',
        noResults: 'No exercises found',
        createNew: 'Create',
        libraryTitle: 'Library',
        recentTitle: 'Recent',
        customExercise: 'Custom exercise',
      };

  // Load exercise library from coach
  const loadExerciseLibrary = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      // Get coach_id from client
      const { data: clientData } = await supabase
        .from('clients')
        .select('coach_id')
        .eq('id', user.id)
        .single();

      if (!clientData) return;

      // Get exercises from coach's library
      const { data: exercisesData } = await supabase
        .from('exercises')
        .select('id, name, muscle_group')
        .eq('coach_id', clientData.coach_id)
        .order('name', { ascending: true });

      setExerciseLibrary(exercisesData || []);
    } catch (err) {
      console.error('Error loading exercise library:', err);
    } finally {
      setLoadingLibrary(false);
    }
  }, []);

  useEffect(() => {
    loadExerciseLibrary();
  }, [loadExerciseLibrary]);

  const addExercise = () => {
    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      name: '',
      exerciseId: null,
      sets: [{ reps: 0, weight: 0, rpe: 7 }],
    };
    setExercises([...exercises, newExercise]);
    // Ouvrir le picker pour le nouvel exercice
    setShowExercisePicker(newExercise.id);
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter((ex) => ex.id !== id));
    if (showExercisePicker === id) {
      setShowExercisePicker(null);
    }
  };

  const selectExerciseFromLibrary = (exerciseUiId: string, libraryExercise: ExerciseOption) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseUiId
          ? { ...ex, name: libraryExercise.name, exerciseId: libraryExercise.id }
          : ex
      )
    );
    setShowExercisePicker(null);
    setSearchQuery('');
  };

  const createCustomExercise = async (exerciseUiId: string, name: string) => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const { data: clientData } = await supabase
        .from('clients')
        .select('coach_id')
        .eq('id', user.id)
        .single();

      if (!clientData) return;

      // Create new exercise in library
      const { data: newExercise, error } = await supabase
        .from('exercises')
        .insert({
          coach_id: clientData.coach_id,
          name: name.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update local library
      setExerciseLibrary((prev) => [...prev, newExercise as ExerciseOption].sort((a, b) => a.name.localeCompare(b.name)));

      // Select the new exercise
      setExercises(
        exercises.map((ex) =>
          ex.id === exerciseUiId
            ? { ...ex, name: (newExercise as ExerciseOption).name, exerciseId: (newExercise as ExerciseOption).id }
            : ex
        )
      );
      setShowExercisePicker(null);
      setSearchQuery('');
    } catch (err) {
      console.error('Error creating exercise:', err);
      toast.error(language === 'fr' ? 'Erreur lors de la creation' : 'Error creating exercise');
    }
  };

  const addSet = (exerciseId: string) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: [...ex.sets, { reps: 0, weight: 0, rpe: 7 }] }
          : ex
      )
    );
  };

  const removeSet = (exerciseId: string, setIndex: number) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.filter((_, i) => i !== setIndex) }
          : ex
      )
    );
  };

  const updateSet = (
    exerciseId: string,
    setIndex: number,
    field: keyof ExerciseSet,
    value: number
  ) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((set, i) =>
                i === setIndex ? { ...set, [field]: value } : set
              ),
            }
          : ex
      )
    );
  };

  const saveWorkout = async () => {
    try {
      setLoading(true);

      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: clientData } = await supabase
        .from('clients')
        .select('coach_id')
        .eq('id', user.id)
        .single();

      if (!clientData) throw new Error('Client not found');

      const coachId = clientData.coach_id as string;

      const { data: workoutLog, error: logError } = await supabase
        .from('workout_logs')
        .insert({
          client_id: user.id,
          coach_id: coachId,
          date: new Date().toISOString().split('T')[0],
          duration_minutes: duration,
          notes: notes || null,
        })
        .select()
        .single();

      if (logError) throw logError;
      if (!workoutLog) throw new Error('Failed to create workout log');

      const workoutLogId = (workoutLog as { id: string }).id;

      const entries = exercises.map((ex) => ({
        workout_log_id: workoutLogId,
        exercise_id: ex.exerciseId, // Now we include the exercise_id!
        exercise_name: ex.name,
        sets_json: ex.sets.map((set) => ({
          ...set,
          weight: toMetricWeight(set.weight, unit),
        })),
        notes: null,
      }));

      const { error: entriesError } = await supabase
        .from('workout_entries')
        .insert(entries);

      if (entriesError) throw entriesError;

      toast.success(t.success);
      await supabase
        .from('clients')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', user.id);
      router.push('/client/dashboard');
    } catch (error) {
      console.error('Error saving workout:', error);
      toast.error(t.fail);
    } finally {
      setLoading(false);
    }
  };

  // Filter exercises based on search
  const filteredExercises = exerciseLibrary.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canCreateNew = searchQuery.trim().length > 0 &&
    !exerciseLibrary.some((ex) => ex.name.toLowerCase() === searchQuery.toLowerCase().trim());

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
                <p className="text-text-secondary mt-1">
                  {new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-8">
          <Card className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-text-secondary mb-2 block">
                  {t.durationLabel}
                </label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min={1}
                  className="w-32"
                />
              </div>
              <Badge variant="info">{duration} min</Badge>
            </div>
          </Card>

          <div className="space-y-6 mb-6">
            {exercises.map((exercise) => (
              <Card
                key={exercise.id}
                className="group relative overflow-hidden transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-300" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 relative">
                      {/* Exercise selector button */}
                      <button
                        onClick={() => setShowExercisePicker(showExercisePicker === exercise.id ? null : exercise.id)}
                        className="w-full text-left px-4 py-3 bg-background-elevated rounded-lg border border-border hover:border-primary transition-colors"
                      >
                        {exercise.name ? (
                          <span className="font-semibold text-lg">{exercise.name}</span>
                        ) : (
                          <span className="text-text-tertiary">{t.selectExercise}</span>
                        )}
                      </button>

                      {/* Exercise picker dropdown */}
                      {showExercisePicker === exercise.id && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-background-elevated border border-border rounded-xl shadow-xl z-50 max-h-80 overflow-hidden">
                          {/* Search input */}
                          <div className="p-3 border-b border-border">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                              <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t.searchExercise}
                                className="w-full pl-10 pr-4 py-2 bg-background rounded-lg border border-border text-sm focus:border-primary focus:outline-none"
                                autoFocus
                              />
                              {searchQuery && (
                                <button
                                  onClick={() => setSearchQuery('')}
                                  className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                  <X className="w-4 h-4 text-text-tertiary" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Exercise list */}
                          <div className="max-h-56 overflow-y-auto">
                            {filteredExercises.length > 0 ? (
                              <div className="p-2">
                                <p className="text-xs text-text-tertiary px-2 py-1">{t.libraryTitle}</p>
                                {filteredExercises.map((libEx) => (
                                  <button
                                    key={libEx.id}
                                    onClick={() => selectExerciseFromLibrary(exercise.id, libEx)}
                                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-background-surface transition-colors"
                                  >
                                    <span className="font-medium">{libEx.name}</span>
                                    {libEx.muscle_group && (
                                      <span className="text-xs text-text-tertiary ml-2">
                                        {libEx.muscle_group}
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            ) : !canCreateNew ? (
                              <div className="p-4 text-center text-text-tertiary text-sm">
                                {loadingLibrary ? 'Loading...' : t.noResults}
                              </div>
                            ) : null}

                            {/* Create new option */}
                            {canCreateNew && (
                              <div className="p-2 border-t border-border">
                                <button
                                  onClick={() => createCustomExercise(exercise.id, searchQuery)}
                                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-2"
                                >
                                  <Plus className="w-4 h-4 text-primary" />
                                  <span className="text-primary font-medium">
                                    {t.createNew} &ldquo;{searchQuery.trim()}&rdquo;
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExercise(exercise.id)}
                      className="ml-2"
                    >
                      <Trash2 className="w-4 h-4 text-danger" />
                    </Button>
                  </div>

                  {/* Sets - only show if exercise is selected */}
                  {exercise.name && (
                    <>
                      <div className="space-y-3">
                        <div className="grid grid-cols-4 gap-4 text-sm font-medium text-text-secondary px-2">
                          <div>{t.set}</div>
                          <div>{t.reps}</div>
                          <div>{t.weight}</div>
                          <div>{t.rpe}</div>
                        </div>

                        {exercise.sets.map((set, setIndex) => (
                          <div
                            key={setIndex}
                            className="grid grid-cols-4 gap-4 items-center"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="info">{setIndex + 1}</Badge>
                              {exercise.sets.length > 1 && (
                                <button
                                  onClick={() => removeSet(exercise.id, setIndex)}
                                  className="text-danger hover:text-danger-hover"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <Input
                              type="number"
                              value={set.reps || ''}
                              onChange={(e) =>
                                updateSet(
                                  exercise.id,
                                  setIndex,
                                  'reps',
                                  Number(e.target.value)
                                )
                              }
                              min={0}
                              placeholder="0"
                            />
                            <Input
                              type="number"
                              value={set.weight || ''}
                              onChange={(e) =>
                                updateSet(
                                  exercise.id,
                                  setIndex,
                                  'weight',
                                  Number(e.target.value)
                                )
                              }
                              min={0}
                              step={0.5}
                              placeholder="0"
                            />
                            <Input
                              type="number"
                              value={set.rpe || ''}
                              onChange={(e) =>
                                updateSet(
                                  exercise.id,
                                  setIndex,
                                  'rpe',
                                  Number(e.target.value)
                                )
                              }
                              min={1}
                              max={10}
                              placeholder="7"
                            />
                          </div>
                        ))}
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => addSet(exercise.id)}
                        className="mt-4"
                      >
                        <Plus className="w-4 h-4" />
                        {t.addSet}
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <Button
            variant="secondary"
            fullWidth
            onClick={addExercise}
            className="mb-6"
          >
            <Plus className="w-4 h-4" />
            {t.addExercise}
          </Button>

          <Card className="mb-6">
            <label className="text-sm text-text-secondary mb-2 block">
              {t.notesLabel}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.notesPlaceholder}
              className="w-full bg-background-elevated/50 backdrop-blur-md border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-tertiary min-h-[100px] resize-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-background-elevated transition-all duration-200"
            />
          </Card>

          <Button
            variant="primary"
            fullWidth
            onClick={saveWorkout}
            loading={loading}
            disabled={exercises.length === 0 || exercises.some((ex) => !ex.name)}
          >
            <Save className="w-4 h-4" />
            {t.save}
          </Button>
        </main>
      </div>
    </ClientLayout>
  );
}
