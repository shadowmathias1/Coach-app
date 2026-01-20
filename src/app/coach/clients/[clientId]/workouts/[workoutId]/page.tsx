'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, TrendingUp, Dumbbell } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import CoachLayout from '@/components/layout/CoachLayout';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { toast } from 'sonner';
import { useLanguage } from '@/components/shared/LanguageProvider';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

interface SetData {
  reps?: number;
  weight_kg?: number;
  duration_seconds?: number;
  distance_meters?: number;
}

interface WorkoutEntry {
  id: string;
  workout_log_id: string;
  exercise_name: string;
  sets_json: SetData[];
  notes: string | null;
  created_at: string;
}

interface Workout {
  id: string;
  client_id: string;
  date: string;
  notes: string | null;
  duration_minutes: number;
  created_at: string;
}

interface Client {
  id: string;
  display_name: string;
}

export default function WorkoutDetailPage() {
  const router = useRouter();
  const params = useParams();
  const workoutId = params.workoutId as string;
  const clientId = params.clientId as string;
  const { language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [entries, setEntries] = useState<WorkoutEntry[]>([]);
  const [client, setClient] = useState<Client | null>(null);

  const t = language === 'fr'
    ? {
        backToClient: 'Retour au client',
        workoutDetails: 'Détails de la séance',
        date: 'Date',
        duration: 'Durée',
        minutes: 'min',
        notes: 'Notes',
        noNotes: 'Aucune note',
        exercises: 'Exercices',
        sets: 'Séries',
        reps: 'Reps',
        weight: 'Poids',
        time: 'Temps',
        distance: 'Distance',
        noExercises: 'Aucun exercice enregistré',
        loadFail: 'Impossible de charger la séance',
        totalVolume: 'Volume total',
        exerciseCount: 'Exercices',
      }
    : {
        backToClient: 'Back to client',
        workoutDetails: 'Workout details',
        date: 'Date',
        duration: 'Duration',
        minutes: 'min',
        notes: 'Notes',
        noNotes: 'No notes',
        exercises: 'Exercises',
        sets: 'Sets',
        reps: 'Reps',
        weight: 'Weight',
        time: 'Time',
        distance: 'Distance',
        noExercises: 'No exercises recorded',
        loadFail: 'Failed to load workout',
        totalVolume: 'Total volume',
        exerciseCount: 'Exercises',
      };

  const loadWorkout = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Load workout
      const { data: workoutData, error: workoutError } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('id', workoutId)
        .eq('coach_id', user.id)
        .single();

      if (workoutError) throw workoutError;
      setWorkout(workoutData);

      // Load entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('workout_entries')
        .select('*')
        .eq('workout_log_id', workoutId)
        .order('order_index', { ascending: true });

      if (entriesError) throw entriesError;

      // Type assertion pour sets_json
      const typedEntries = (entriesData || []).map(entry => ({
        ...entry,
        sets_json: Array.isArray(entry.sets_json) ? entry.sets_json as SetData[] : []
      }));

      setEntries(typedEntries);

      // Load client info
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, display_name')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);
    } catch (error) {
      console.error('Error loading workout:', error);
      toast.error(t.loadFail);
      router.push(`/coach/clients/${clientId}`);
    } finally {
      setLoading(false);
    }
  }, [workoutId, clientId, router, t.loadFail]);

  useEffect(() => {
    loadWorkout();
  }, [loadWorkout]);

  // Calculate total volume from sets_json
  const totalVolume = entries.reduce((sum, entry) => {
    const sets = Array.isArray(entry.sets_json) ? entry.sets_json : [];
    const entryVolume = sets.reduce((setSum, set) => {
      if (set.weight_kg && set.reps) {
        return setSum + (set.weight_kg * set.reps);
      }
      return setSum;
    }, 0);
    return sum + entryVolume;
  }, 0);

  if (loading) {
    return (
      <CoachLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </CoachLayout>
    );
  }

  if (!workout || !client) {
    return null;
  }

  const workoutDate = new Date(workout.date);
  const locale = language === 'fr' ? fr : enUS;

  return (
    <CoachLayout>
      <div className="container-app py-8 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/coach/clients/${clientId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.backToClient}
          </Button>
        </div>

        {/* Client info */}
        <Card className="border-2 border-primary/20">
          <h1 className="text-3xl font-bold text-gradient">{client.display_name}</h1>
          <p className="text-text-secondary mt-1">{t.workoutDetails}</p>
        </Card>

        {/* Workout summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-5 h-5 text-primary" />
              <p className="stat-label">{t.exerciseCount}</p>
            </div>
            <p className="stat-value">{entries.length}</p>
          </div>

          {workout.duration_minutes && (
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-secondary" />
                <p className="stat-label">{t.duration}</p>
              </div>
              <p className="stat-value">{workout.duration_minutes}<span className="text-lg ml-1">{t.minutes}</span></p>
            </div>
          )}

          {totalVolume > 0 && (
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-success" />
                <p className="stat-label">{t.totalVolume}</p>
              </div>
              <p className="stat-value">{totalVolume.toLocaleString()}<span className="text-lg ml-1">kg</span></p>
            </div>
          )}

          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-info" />
              <p className="stat-label">{t.date}</p>
            </div>
            <p className="text-lg font-bold mt-2">{format(workoutDate, 'dd MMM', { locale })}</p>
          </div>
        </div>

        {/* Workout info */}
        <Card className="bg-gradient-to-br from-background-surface to-background-elevated">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">
                {format(workoutDate, 'PPPP', { locale })}
              </h2>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-text-secondary">
                <Calendar className="w-5 h-5" />
                <span>{format(workoutDate, 'PPP', { locale })}</span>
              </div>
              {workout.duration_minutes && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Clock className="w-5 h-5" />
                  <span>
                    {workout.duration_minutes} {t.minutes}
                  </span>
                </div>
              )}
            </div>

            {workout.notes && (
              <div className="mt-4 p-6 bg-background-elevated rounded-2xl border-2 border-border">
                <p className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">{t.notes}</p>
                <p className="text-text-primary leading-relaxed">{workout.notes}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Exercises */}
        <Card>
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-gradient">{t.exercises}</span>
            <Badge variant="info">{entries.length}</Badge>
          </h3>

          {entries.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-background-elevated mb-4">
                <Dumbbell className="w-10 h-10 text-text-tertiary" />
              </div>
              <p className="text-text-tertiary text-lg">{t.noExercises}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry, index) => {
                const sets = Array.isArray(entry.sets_json) ? entry.sets_json : [];
                const totalSets = sets.length;

                // Calculer les moyennes
                const avgWeight = totalSets > 0
                  ? sets.reduce((sum, set) => sum + (set.weight_kg || 0), 0) / totalSets
                  : 0;
                const avgReps = totalSets > 0
                  ? sets.reduce((sum, set) => sum + (set.reps || 0), 0) / totalSets
                  : 0;
                const avgDuration = totalSets > 0
                  ? sets.reduce((sum, set) => sum + (set.duration_seconds || 0), 0) / totalSets
                  : 0;
                const avgDistance = totalSets > 0
                  ? sets.reduce((sum, set) => sum + (set.distance_meters || 0), 0) / totalSets
                  : 0;

                // Volume total pour cet exercice
                const exerciseVolume = sets.reduce((sum, set) => {
                  if (set.weight_kg && set.reps) {
                    return sum + (set.weight_kg * set.reps);
                  }
                  return sum;
                }, 0);

                return (
                  <div
                    key={entry.id}
                    className="relative p-6 bg-gradient-to-br from-background-surface to-background-elevated rounded-2xl border-2 border-border hover:border-primary/40 transition-all duration-300 group overflow-hidden"
                  >
                    {/* Decorative orb */}
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 blur-2xl group-hover:scale-150 transition-transform duration-500" />

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary border-2 border-primary/20">
                            #{index + 1}
                          </span>
                          <div>
                            <h4 className="text-xl font-bold">{entry.exercise_name}</h4>
                            {entry.notes && (
                              <p className="text-sm text-text-tertiary mt-1">{entry.notes}</p>
                            )}
                          </div>
                        </div>
                        {avgWeight > 0 && (
                          <Badge variant="info" className="text-base px-4 py-2">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            {avgWeight.toFixed(1)} kg
                          </Badge>
                        )}
                      </div>

                      {/* Stats globales */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="p-4 bg-background-elevated rounded-xl border-2 border-border hover:border-primary/30 transition-colors">
                          <p className="text-xs text-text-tertiary font-bold uppercase tracking-wider mb-2">
                            {t.sets}
                          </p>
                          <p className="text-3xl font-bold text-gradient">{totalSets}</p>
                        </div>

                        {avgReps > 0 && (
                          <div className="p-4 bg-background-elevated rounded-xl border-2 border-border hover:border-secondary/30 transition-colors">
                            <p className="text-xs text-text-tertiary font-bold uppercase tracking-wider mb-2">
                              {t.reps} (moy)
                            </p>
                            <p className="text-3xl font-bold text-gradient-secondary">{Math.round(avgReps)}</p>
                          </div>
                        )}

                        {avgDuration > 0 && (
                          <div className="p-4 bg-background-elevated rounded-xl border-2 border-border hover:border-accent/30 transition-colors">
                            <p className="text-xs text-text-tertiary font-bold uppercase tracking-wider mb-2">
                              {t.time}
                            </p>
                            <p className="text-3xl font-bold text-accent">
                              {Math.floor(avgDuration / 60)}:{(Math.round(avgDuration % 60)).toString().padStart(2, '0')}
                            </p>
                          </div>
                        )}

                        {avgDistance > 0 && (
                          <div className="p-4 bg-background-elevated rounded-xl border-2 border-border hover:border-success/30 transition-colors">
                            <p className="text-xs text-text-tertiary font-bold uppercase tracking-wider mb-2">
                              {t.distance}
                            </p>
                            <p className="text-3xl font-bold text-success">
                              {Math.round(avgDistance)}m
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Détail de chaque série */}
                      {totalSets > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Détail des séries</p>
                          <div className="grid gap-2">
                            {sets.map((set, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-background-elevated rounded-lg border border-border/50">
                                <span className="text-sm text-text-secondary font-medium">Série {idx + 1}</span>
                                <div className="flex gap-4 text-sm">
                                  {set.reps && <span className="text-text-primary"><strong>{set.reps}</strong> reps</span>}
                                  {set.weight_kg && <span className="text-text-primary"><strong>{set.weight_kg}</strong> kg</span>}
                                  {set.duration_seconds && (
                                    <span className="text-text-primary">
                                      <strong>{Math.floor(set.duration_seconds / 60)}:{(set.duration_seconds % 60).toString().padStart(2, '0')}</strong>
                                    </span>
                                  )}
                                  {set.distance_meters && <span className="text-text-primary"><strong>{set.distance_meters}</strong> m</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Volume total */}
                      {exerciseVolume > 0 && (
                        <div className="mt-4 p-3 bg-success/5 border border-success/20 rounded-lg">
                          <p className="text-xs text-success font-semibold">
                            Volume total: {exerciseVolume.toLocaleString()} kg
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </CoachLayout>
  );
}
