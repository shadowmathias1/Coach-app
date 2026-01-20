'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Calendar, Dumbbell, TrendingUp, User, ChevronRight, Scale } from 'lucide-react';
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
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { toast } from 'sonner';
import CoachLayout from '@/components/layout/CoachLayout';
import { useLanguage } from '@/components/shared/LanguageProvider';
import { useUnits } from '@/components/shared/UnitProvider';
import { displayWeightValue, formatHeight, formatWeight, kgToLb, toMetricWeight, weightInputLabel } from '@/lib/units';

interface Client {
  id: string;
  display_name: string;
  age: number | null;
  height: number | null;
  weight: number | null;
  goal: string | null;
  injuries: string | null;
  joined_at: string;
  last_activity_at: string | null;
}

interface WorkoutLog {
  id: string;
  date: string;
  duration_minutes: number;
  notes: string | null;
}

interface Checkin {
  id: string;
  week_start_date: string;
  weight: number | null;
  sleep_quality: number;
  stress_level: number;
  soreness_level: number;
  mood: number;
  notes: string | null;
}

interface TrendPoint {
  week: string;
  count: number;
}

interface WeightPoint {
  week: string;
  weight: number;
}

interface ExerciseOption {
  id: string;
  name: string;
}

interface ExerciseHistoryPoint {
  date: string;
  max_weight: number | null;
  max_reps: number | null;
}

interface ExercisePrRow {
  exercise_id: string | null;
  exercise_name: string;
  max_weight: number | null;
  max_weight_date: string | null;
  max_estimated_1rm: number | null;
  max_estimated_1rm_date: string | null;
}

interface WeeklyVolumeRow {
  week_start: string;
  current_volume: number | null;
  previous_volume: number | null;
  delta_volume: number | null;
}

interface WeeklyMuscleRow {
  week_start: string;
  muscle_group: string;
  total_tonnage: number | null;
}

interface WeeklyGoalSetsRow {
  week_start: string;
  intensity_goal: string;
  set_count: number;
}

interface SuggestionRow {
  goal: string;
  rep_range: string;
  min_weight: number | null;
  max_weight: number | null;
  suggested_weight: number | null;
  last_session_date: string | null;
  last_best_weight: number | null;
  last_best_1rm: number | null;
}

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.clientId as string;
  const { language } = useLanguage();
  const { unit } = useUnits();

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<Client | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'workouts' | 'checkins'>('overview');
  const [workoutTrend, setWorkoutTrend] = useState<TrendPoint[]>([]);
  const [checkinTrend, setCheckinTrend] = useState<TrendPoint[]>([]);
  const [weightTrend, setWeightTrend] = useState<WeightPoint[]>([]);
  const [bmiData, setBmiData] = useState<{ bmi: number | null; bmi_note: string | null } | null>(
    null
  );
  const [exerciseOptions, setExerciseOptions] = useState<ExerciseOption[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseHistoryPoint[]>([]);
  const [calcWeight, setCalcWeight] = useState('');
  const [calcReps, setCalcReps] = useState('');
  const [exercisePrs, setExercisePrs] = useState<ExercisePrRow[]>([]);
  const [weeklyVolume, setWeeklyVolume] = useState<WeeklyVolumeRow[]>([]);
  const [weeklyMuscle, setWeeklyMuscle] = useState<WeeklyMuscleRow[]>([]);
  const [weeklyGoalSets, setWeeklyGoalSets] = useState<WeeklyGoalSetsRow[]>([]);
  const [muscleOptions, setMuscleOptions] = useState<string[]>([]);
  const [selectedMuscle, setSelectedMuscle] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);

  const t = language === 'fr'
    ? {
        loading: 'Chargement...',
        notFound: 'Client introuvable',
        back: 'Retour',
        joined: 'Inscrit le',
        tabs: {
          overview: 'Apercu',
          workouts: 'Seances',
          checkins: 'Check-ins',
        },
        totalWorkouts: 'Total seances',
        totalCheckins: 'Check-ins',
        lastActivity: 'Derniere activite',
        never: 'Jamais',
        workoutsPerWeek: 'Seances par semaine',
        checkinsPerWeek: 'Check-ins par semaine',
        weightTrend: 'Poids dans le temps',
        noWorkouts: 'Aucune seance pour le moment.',
        noCheckins: 'Aucun check-in pour le moment.',
        noWeight: 'Aucune donnee de poids.',
        profileInfo: 'Infos profil',
        age: 'Age',
        height: 'Taille',
        weight: 'Poids',
        goal: 'Objectif',
        injuries: 'Blessures / Notes',
        workoutDate: 'Duree',
        workoutMinutes: 'minutes',
        noWorkoutLogs: 'Aucune seance enregistree',
        weekOf: 'Semaine du',
        sleep: 'Sommeil',
        stress: 'Stress',
        soreness: 'Courbatures',
        mood: 'Humeur',
        performanceTitle: 'Performance par exercice',
        performanceSelect: 'Selectionner un exercice',
        noPerformance: 'Aucune performance pour cet exercice.',
        evolutionSubtitle: 'Poids et repetitions au fil du temps',
        evolutionWeight: 'Charge max',
        evolutionReps: 'Repetitions max',
        metricWeight: 'Charge max',
        metric1rm: '1RM estime',
        bmiTitle: 'IMC',
        bmiLabel: 'Indice de masse corporelle',
        bmiNote:
          "IMC indicatif: la masse musculaire peut faire apparaitre une personne comme en surpoids.",
        noBmi: 'IMC indisponible',
        calculatorTitle: 'Calculateur 1RM',
        calculatorSubtitle: "Estime le 1RM et les zones d'entrainement",
        weightLabel: 'Charge',
        repsLabel: 'Repetitions',
        estimateLabel: '1RM estime',
        calculatorHint: 'Renseigne une charge et des repetitions.',
        goalForce: 'Force',
        goalHypertrophy: 'Hypertrophie',
        goalEndurance: 'Endurance',
        goalVolume: 'Volume',
        prTitle: 'Records personnels',
        prEmpty: 'Aucun record pour le moment.',
        weeklyVolumeTitle: 'Volume hebdo',
        weeklyVolumeSubtitle: 'Volume total par semaine + comparaison S-1',
        weeklyVolumeCurrent: 'Semaine',
        weeklyVolumePrev: 'S-1',
        tonnageTitle: 'Tonnage par groupe musculaire',
        tonnageSelect: 'Choisir un groupe',
        tonnageEmpty: 'Pas de donnees de tonnage.',
        intensityTitle: 'Series par objectif',
        intensitySubtitle: 'Repartition force/hypertrophie/endurance',
        intensityEmpty: 'Pas de donnees de series.',
        suggestionTitle: 'Suggestion de charge',
        suggestionEmpty: 'Selectionne un exercice pour voir les suggestions.',
        suggestionGoal: 'Objectif',
        suggestionRange: 'Reps',
        suggestionMin: 'Min',
        suggestionMax: 'Max',
        suggestionSuggested: 'Suggere',
        lastBest: 'Dernier best',
        lastSession: 'Derniere seance',
        loadFail: 'Impossible de charger le client',
      }
    : {
        loading: 'Loading client data...',
        notFound: 'Client not found',
        back: 'Back',
        joined: 'Joined',
        tabs: {
          overview: 'Overview',
          workouts: 'Workouts',
          checkins: 'Check-ins',
        },
        totalWorkouts: 'Total workouts',
        totalCheckins: 'Check-ins',
        lastActivity: 'Last activity',
        never: 'Never',
        workoutsPerWeek: 'Workouts per week',
        checkinsPerWeek: 'Check-ins per week',
        weightTrend: 'Weight trend',
        noWorkouts: 'No workouts logged yet.',
        noCheckins: 'No check-ins submitted yet.',
        noWeight: 'No weight data yet.',
        profileInfo: 'Profile information',
        age: 'Age',
        height: 'Height',
        weight: 'Weight',
        goal: 'Goal',
        injuries: 'Injuries / Notes',
        workoutDate: 'Duration',
        workoutMinutes: 'minutes',
        noWorkoutLogs: 'No workouts logged yet',
        weekOf: 'Week of',
        sleep: 'Sleep',
        stress: 'Stress',
        soreness: 'Soreness',
        mood: 'Mood',
        performanceTitle: 'Exercise performance',
        performanceSelect: 'Select an exercise',
        noPerformance: 'No performance data for this exercise yet.',
        evolutionSubtitle: 'Weight and reps over time',
        evolutionWeight: 'Max load',
        evolutionReps: 'Max reps',
        metricWeight: 'Max load',
        metric1rm: 'Estimated 1RM',
        bmiTitle: 'BMI',
        bmiLabel: 'Body mass index',
        bmiNote:
          'BMI is indicative: muscular people may appear overweight.',
        noBmi: 'BMI unavailable',
        calculatorTitle: '1RM calculator',
        calculatorSubtitle: 'Estimate 1RM and training zones',
        weightLabel: 'Load',
        repsLabel: 'Repetitions',
        estimateLabel: 'Estimated 1RM',
        calculatorHint: 'Enter a load and reps to calculate.',
        goalForce: 'Strength',
        goalHypertrophy: 'Hypertrophy',
        goalEndurance: 'Endurance',
        goalVolume: 'Volume',
        prTitle: 'Personal records',
        prEmpty: 'No records yet.',
        weeklyVolumeTitle: 'Weekly volume',
        weeklyVolumeSubtitle: 'Total volume per week + comparison vs last week',
        weeklyVolumeCurrent: 'Week',
        weeklyVolumePrev: 'Prev',
        tonnageTitle: 'Muscle group tonnage',
        tonnageSelect: 'Pick a muscle group',
        tonnageEmpty: 'No tonnage data yet.',
        intensityTitle: 'Sets by goal',
        intensitySubtitle: 'Strength/hypertrophy/endurance split',
        intensityEmpty: 'No sets data yet.',
        suggestionTitle: 'Load suggestions',
        suggestionEmpty: 'Select an exercise to see suggestions.',
        suggestionGoal: 'Goal',
        suggestionRange: 'Reps',
        suggestionMin: 'Min',
        suggestionMax: 'Max',
        suggestionSuggested: 'Suggested',
        lastBest: 'Last best',
        lastSession: 'Last session',
        loadFail: 'Failed to load client data',
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

  const loadClientData = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .eq('coach_id', user.id)
        .single();

      if (clientError) throw clientError;
      setClient(clientData as Client);

      const { data: workoutsData } = await supabase
        .from('workout_logs')
        .select('id, date, duration_minutes, notes')
        .eq('client_id', clientId)
        .order('date', { ascending: false })
        .limit(10);

      setWorkouts((workoutsData as WorkoutLog[]) || []);

      const { data: checkinsData } = await supabase
        .from('checkins')
        .select('*')
        .eq('client_id', clientId)
        .order('week_start_date', { ascending: false })
        .limit(10);

      setCheckins((checkinsData as Checkin[]) || []);

      const startRange = new Date();
      startRange.setDate(startRange.getDate() - 42);

      const { data: workoutDates } = await supabase
        .from('workout_logs')
        .select('date')
        .eq('client_id', clientId)
        .gte('date', startRange.toISOString().split('T')[0])
        .order('date', { ascending: true });

      const { data: checkinDates } = await supabase
        .from('checkins')
        .select('week_start_date, weight')
        .eq('client_id', clientId)
        .gte('week_start_date', startRange.toISOString().split('T')[0])
        .order('week_start_date', { ascending: true });

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
      setWeightTrend(
        (checkinDates || [])
          .filter((entry) => entry.weight !== null)
          .map((entry) => ({
            week: formatWeekLabel(entry.week_start_date),
            weight: Number(entry.weight),
          }))
      );

      const { data: bmiRow } = await supabase
        .from('client_bmi')
        .select('bmi, bmi_note')
        .eq('client_id', clientId)
        .maybeSingle();
      setBmiData((bmiRow as { bmi: number | null; bmi_note: string | null }) || null);

      const { data: perfRows } = await supabase
        .from('exercise_perf_daily_secure')
        .select('exercise_id, exercise_name, date, max_weight, max_estimated_1rm')
        .eq('client_id', clientId)
        .order('date', { ascending: true });
      const perfData = (perfRows as ExercisePerfRow[]) || [];
      const filteredPerf = perfData.filter((row) => row.exercise_id);
      const uniqueExercises = Array.from(
        filteredPerf.reduce<Map<string, string>>((acc, row) => {
          if (!row.exercise_id) return acc;
          if (!acc.has(row.exercise_id)) acc.set(row.exercise_id, row.exercise_name);
          return acc;
        }, new Map())
      ).map(([id, name]) => ({ id, name }));
      uniqueExercises.sort((a, b) => a.name.localeCompare(b.name));
      setExerciseOptions(uniqueExercises);

      const { data: prRows } = await supabase
        .from('exercise_prs')
        .select(
          'exercise_id, exercise_name, max_weight, max_weight_date, max_estimated_1rm, max_estimated_1rm_date'
        )
        .eq('client_id', clientId)
        .order('max_weight', { ascending: false });
      setExercisePrs((prRows as ExercisePrRow[]) || []);

      const { data: volumeRows } = await supabase
        .from('client_weekly_volume_compare')
        .select('week_start, current_volume, previous_volume, delta_volume')
        .eq('client_id', clientId)
        .order('week_start', { ascending: true });
      setWeeklyVolume((volumeRows as WeeklyVolumeRow[]) || []);

      const { data: muscleRows } = await supabase
        .from('client_weekly_muscle_tonnage')
        .select('week_start, muscle_group, total_tonnage')
        .eq('client_id', clientId)
        .order('week_start', { ascending: true });
      const muscleData = (muscleRows as WeeklyMuscleRow[]) || [];
      setWeeklyMuscle(muscleData);
      const uniqueMuscles = Array.from(
        new Set(muscleData.map((row) => row.muscle_group))
      );
      uniqueMuscles.sort((a, b) => a.localeCompare(b));
      setMuscleOptions(uniqueMuscles);
      setSelectedMuscle((prev) => (prev ? prev : uniqueMuscles[0] || ''));

      const { data: goalSetsRows } = await supabase
        .from('client_weekly_goal_sets')
        .select('week_start, intensity_goal, set_count')
        .eq('client_id', clientId)
        .order('week_start', { ascending: true });
      setWeeklyGoalSets((goalSetsRows as WeeklyGoalSetsRow[]) || []);
    } catch (error) {
      console.error('Error loading client data:', error);
      toast.error(t.loadFail);
      router.push('/coach/clients');
    } finally {
      setLoading(false);
    }
  }, [clientId, router, t.loadFail]);

  useEffect(() => {
    loadClientData();
  }, [loadClientData]);

  useEffect(() => {
    if (exerciseOptions.length === 0) return;
    const optionIds = new Set(exerciseOptions.map((option) => option.id));
    const primary = exerciseOptions[0].id;

    if (!selectedExerciseId || !optionIds.has(selectedExerciseId)) {
      setSelectedExerciseId(primary);
    }
  }, [exerciseOptions, selectedExerciseId]);

  useEffect(() => {
    const loadSuggestions = async () => {
      if (!selectedExerciseId) {
        setSuggestions([]);
        return;
      }

      const increment =
        unit === 'imperial'
          ? Math.round(toMetricWeight(5, unit) * 100) / 100
          : 2.5;

      const { data, error } = await supabase.rpc('suggest_exercise_loads', {
        in_client_id: clientId,
        in_exercise_id: selectedExerciseId,
        in_increment: increment,
      });

      if (error) {
        console.error('Error loading suggestions:', error);
        setSuggestions([]);
        return;
      }
      setSuggestions((data as SuggestionRow[]) || []);
    };

    loadSuggestions();
  }, [clientId, selectedExerciseId, unit]);

  useEffect(() => {
    const loadExerciseHistory = async () => {
      if (!selectedExerciseId) {
        setExerciseHistory([]);
        return;
      }

      const { data, error } = await supabase
        .from('workout_entries')
        .select('sets_json, workout_logs!inner(date)')
        .eq('exercise_id', selectedExerciseId)
        .eq('workout_logs.client_id', clientId)
        .order('workout_logs.date', { ascending: true });

      if (error) {
        console.error('Error loading exercise history:', error);
        setExerciseHistory([]);
        return;
      }

      const dailyMap = new Map<string, { max_weight: number | null; max_reps: number | null }>();
      (data || []).forEach((row) => {
        const date = (row as { workout_logs?: { date?: string } }).workout_logs?.date;
        if (!date) return;
        const existing = dailyMap.get(date) || { max_weight: null, max_reps: null };
        const sets = (row as { sets_json?: unknown }).sets_json;
        if (Array.isArray(sets)) {
          sets.forEach((set) => {
            const repsRaw = (set as { reps?: string | number }).reps;
            const weightRaw = (set as { weight?: string | number }).weight;
            const repsValue =
              typeof repsRaw === 'number'
                ? repsRaw
                : typeof repsRaw === 'string'
                  ? Number.parseInt(repsRaw, 10)
                  : NaN;
            const weightValue =
              typeof weightRaw === 'number'
                ? weightRaw
                : typeof weightRaw === 'string'
                  ? Number.parseFloat(weightRaw.replace(',', '.'))
                  : NaN;

            if (Number.isFinite(repsValue)) {
              existing.max_reps =
                existing.max_reps === null ? repsValue : Math.max(existing.max_reps, repsValue);
            }
            if (Number.isFinite(weightValue)) {
              existing.max_weight =
                existing.max_weight === null ? weightValue : Math.max(existing.max_weight, weightValue);
            }
          });
        }

        dailyMap.set(date, existing);
      });

      const history = Array.from(dailyMap.entries())
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([date, values]) => ({
          date: formatWeekLabel(date),
          max_weight: values.max_weight,
          max_reps: values.max_reps,
        }));

      setExerciseHistory(history);
    };

    loadExerciseHistory();
  }, [clientId, selectedExerciseId]);

  const weightTrendDisplay = useMemo(() => {
    if (unit === 'imperial') {
      return weightTrend.map((point) => ({
        ...point,
        weight: Math.round(kgToLb(point.weight)),
      }));
    }
    return weightTrend;
  }, [unit, weightTrend]);

  const exerciseHistoryDisplay = useMemo(() => {
    return exerciseHistory.map((row) => ({
      ...row,
      max_weight:
        row.max_weight === null
          ? null
          : unit === 'imperial'
            ? Math.round(kgToLb(row.max_weight))
            : Math.round(row.max_weight),
    }));
  }, [exerciseHistory, unit]);

  const calculator = useMemo(() => {
    const weightValue = Number(calcWeight);
    const repsValue = Number(calcReps);
    if (!Number.isFinite(weightValue) || weightValue <= 0 || !Number.isFinite(repsValue) || repsValue <= 0) {
      return { estimate: null, ranges: [] as Array<{ goal: string; repRange: string; min: number; max: number }> };
    }

    const weightKg = toMetricWeight(weightValue, unit);
    const estimated1rmKg = weightKg * (1 + repsValue / 30);
    const estimatedDisplay = displayWeightValue(estimated1rmKg, unit);
    const ranges = [
      { goal: t.goalForce, repRange: '1-5', minPercent: 0.85, maxPercent: 1.0 },
      { goal: t.goalHypertrophy, repRange: '6-12', minPercent: 0.65, maxPercent: 0.85 },
      { goal: t.goalEndurance, repRange: '12-20', minPercent: 0.5, maxPercent: 0.65 },
      { goal: t.goalVolume, repRange: '8-15', minPercent: 0.6, maxPercent: 0.75 },
    ].map((range) => ({
      goal: range.goal,
      repRange: range.repRange,
      min: displayWeightValue(estimated1rmKg * range.minPercent, unit),
      max: displayWeightValue(estimated1rmKg * range.maxPercent, unit),
    }));

    return { estimate: estimatedDisplay, ranges };
  }, [calcReps, calcWeight, t.goalEndurance, t.goalForce, t.goalHypertrophy, t.goalVolume, unit]);

  const weeklyVolumeChart = useMemo(() => {
    return weeklyVolume.map((row) => ({
      week: formatWeekLabel(row.week_start),
      current_volume:
        row.current_volume === null
          ? null
          : unit === 'imperial'
            ? Math.round(kgToLb(row.current_volume))
            : Math.round(row.current_volume),
      previous_volume:
        row.previous_volume === null
          ? null
          : unit === 'imperial'
            ? Math.round(kgToLb(row.previous_volume))
            : Math.round(row.previous_volume),
    }));
  }, [unit, weeklyVolume]);

  const muscleTonnageChart = useMemo(() => {
    const filtered = selectedMuscle
      ? weeklyMuscle.filter((row) => row.muscle_group === selectedMuscle)
      : weeklyMuscle;
    return filtered.map((row) => ({
      week: formatWeekLabel(row.week_start),
      tonnage:
        row.total_tonnage === null
          ? null
          : unit === 'imperial'
            ? Math.round(kgToLb(row.total_tonnage))
            : Math.round(row.total_tonnage),
    }));
  }, [selectedMuscle, unit, weeklyMuscle]);

  const intensityChart = useMemo(() => {
    const base = new Map<
      string,
      { week: string; force?: number; hypertrophie?: number; endurance?: number; volume?: number }
    >();

    weeklyGoalSets.forEach((row) => {
      const key = row.week_start;
      const existing = base.get(key) || { week: formatWeekLabel(key) };
      if (row.intensity_goal === 'force') {
        existing.force = row.set_count;
      }
      if (row.intensity_goal === 'hypertrophie') {
        existing.hypertrophie = row.set_count;
      }
      if (row.intensity_goal === 'endurance') {
        existing.endurance = row.set_count;
      }
      if (row.intensity_goal === 'volume') {
        existing.volume = row.set_count;
      }
      base.set(key, existing);
    });

    return Array.from(base.values());
  }, [weeklyGoalSets]);

  const formattedSuggestions = useMemo(() => {
    return suggestions.map((row) => ({
      ...row,
      min_weight:
        row.min_weight === null
          ? null
          : unit === 'imperial'
            ? Math.round(kgToLb(row.min_weight))
            : Math.round(row.min_weight),
      max_weight:
        row.max_weight === null
          ? null
          : unit === 'imperial'
            ? Math.round(kgToLb(row.max_weight))
            : Math.round(row.max_weight),
      suggested_weight:
        row.suggested_weight === null
          ? null
          : unit === 'imperial'
            ? Math.round(kgToLb(row.suggested_weight))
            : Math.round(row.suggested_weight),
      last_best_weight:
        row.last_best_weight === null
          ? null
          : unit === 'imperial'
            ? Math.round(kgToLb(row.last_best_weight))
            : Math.round(row.last_best_weight),
      last_best_1rm:
        row.last_best_1rm === null
          ? null
          : unit === 'imperial'
            ? Math.round(kgToLb(row.last_best_1rm))
            : Math.round(row.last_best_1rm),
    }));
  }, [suggestions, unit]);

  if (loading) {
    return (
      <CoachLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">{t.loading}</p>
          </div>
        </div>
      </CoachLayout>
    );
  }

  if (!client) {
    return (
      <CoachLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-text-secondary">{t.notFound}</p>
        </div>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout>
      <div className="min-h-screen bg-background">
        <header className="bg-background-surface border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/coach/clients')}
              >
                <ChevronLeft className="w-4 h-4" />
                {t.back}
              </Button>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-primary/10 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gradient">
                    {client.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{client.display_name}</h1>
                  <p className="text-text-secondary mt-1">
                    {t.joined} {new Date(client.joined_at).toLocaleDateString(locale)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="bg-background-surface border-b border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-6">
              {(['overview', 'workouts', 'checkins'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-2 border-b-2 transition-colors capitalize ${
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {t.tabs[tab]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-6 py-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-secondary text-sm">{t.totalWorkouts}</p>
                      <p className="text-3xl font-bold text-gradient mt-1">
                        {workouts.length}
                      </p>
                    </div>
                    <Dumbbell className="w-8 h-8 text-primary" />
                  </div>
                </Card>

                <Card className="">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-secondary text-sm">{t.totalCheckins}</p>
                      <p className="text-3xl font-bold text-gradient mt-1">
                        {checkins.length}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-success" />
                  </div>
                </Card>

                <Card className="">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-secondary text-sm">{t.lastActivity}</p>
                      <p className="text-lg font-semibold mt-1">
                        {client.last_activity_at
                          ? new Date(client.last_activity_at).toLocaleDateString(locale)
                          : t.never}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-secondary" />
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="">
                  <h3 className="text-lg font-semibold mb-4">{t.workoutsPerWeek}</h3>
                  {workoutTrend.length > 0 ? (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={workoutTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border) / 0.35)" />
                          <XAxis dataKey="week" stroke="rgb(var(--color-text-secondary))" />
                          <YAxis stroke="rgb(var(--color-text-secondary))" allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-text-tertiary">{t.noWorkouts}</p>
                  )}
                </Card>

                <Card className="">
                  <h3 className="text-lg font-semibold mb-4">{t.checkinsPerWeek}</h3>
                  {checkinTrend.length > 0 ? (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={checkinTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border) / 0.35)" />
                          <XAxis dataKey="week" stroke="rgb(var(--color-text-secondary))" />
                          <YAxis stroke="rgb(var(--color-text-secondary))" allowDecimals={false} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#22c55e"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-text-tertiary">{t.noCheckins}</p>
                  )}
                </Card>
              </div>

              <Card className="">
                <div className="flex items-center gap-2 mb-4">
                  <Scale className="w-5 h-5 text-secondary" />
                  <h3 className="text-lg font-semibold">{t.weightTrend}</h3>
                </div>
                {weightTrendDisplay.length > 0 ? (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weightTrendDisplay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border) / 0.35)" />
                        <XAxis dataKey="week" stroke="rgb(var(--color-text-secondary))" />
                        <YAxis stroke="rgb(var(--color-text-secondary))" />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="weight"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-text-tertiary">{t.noWeight}</p>
                )}
              </Card>

              <Card className="">
                <div className="flex flex-col gap-2 mb-4">
                  <h3 className="text-lg font-semibold">{t.performanceTitle}</h3>
                  <p className="text-sm text-text-tertiary">{t.evolutionSubtitle}</p>
                </div>
                {exerciseOptions.length > 0 ? (
                  <>
                    <select
                      className="input mb-4"
                      value={selectedExerciseId}
                      onChange={(event) => setSelectedExerciseId(event.target.value)}
                    >
                      {exerciseOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                    {exerciseHistoryDisplay.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={exerciseHistoryDisplay}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border) / 0.35)" />
                            <XAxis dataKey="date" stroke="rgb(var(--color-text-secondary))" />
                            <YAxis yAxisId="left" stroke="rgb(var(--color-text-secondary))" />
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              stroke="rgb(var(--color-text-secondary))"
                            />
                            <Tooltip />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="max_weight"
                              stroke="rgb(var(--color-primary))"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              name={t.evolutionWeight}
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="max_reps"
                              stroke="rgb(var(--color-accent))"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              name={t.evolutionReps}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-sm text-text-tertiary">{t.noPerformance}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-text-tertiary">{t.noPerformance}</p>
                )}
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="">
                  <h3 className="text-lg font-semibold mb-2">{t.weeklyVolumeTitle}</h3>
                  <p className="text-sm text-text-tertiary mb-4">{t.weeklyVolumeSubtitle}</p>
                  {weeklyVolumeChart.length > 0 ? (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyVolumeChart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border) / 0.35)" />
                          <XAxis dataKey="week" stroke="rgb(var(--color-text-secondary))" />
                          <YAxis stroke="rgb(var(--color-text-secondary))" />
                          <Tooltip />
                          <Bar
                            dataKey="current_volume"
                            fill="#3b82f6"
                            radius={[6, 6, 0, 0]}
                            name={t.weeklyVolumeCurrent}
                          />
                          <Bar
                            dataKey="previous_volume"
                            fill="#94a3b8"
                            radius={[6, 6, 0, 0]}
                            name={t.weeklyVolumePrev}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-text-tertiary">{t.noWorkouts}</p>
                  )}
                </Card>

                <Card className="">
                  <h3 className="text-lg font-semibold mb-2">{t.tonnageTitle}</h3>
                  {muscleOptions.length > 0 ? (
                    <>
                      <select
                        className="input mb-4"
                        value={selectedMuscle}
                        onChange={(event) => setSelectedMuscle(event.target.value)}
                      >
                        {muscleOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {muscleTonnageChart.length > 0 ? (
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={muscleTonnageChart}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border) / 0.35)" />
                              <XAxis dataKey="week" stroke="rgb(var(--color-text-secondary))" />
                              <YAxis stroke="rgb(var(--color-text-secondary))" />
                              <Tooltip />
                              <Line
                                type="monotone"
                                dataKey="tonnage"
                                stroke="#22c55e"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-sm text-text-tertiary">{t.tonnageEmpty}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-text-tertiary">{t.tonnageEmpty}</p>
                  )}
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="">
                  <h3 className="text-lg font-semibold mb-2">{t.intensityTitle}</h3>
                  <p className="text-sm text-text-tertiary mb-4">{t.intensitySubtitle}</p>
                  {intensityChart.length > 0 ? (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={intensityChart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border) / 0.35)" />
                          <XAxis dataKey="week" stroke="rgb(var(--color-text-secondary))" />
                          <YAxis stroke="rgb(var(--color-text-secondary))" allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="force" stackId="a" fill="#2563eb" name={t.goalForce} />
                          <Bar dataKey="hypertrophie" stackId="a" fill="#f97316" name={t.goalHypertrophy} />
                          <Bar dataKey="endurance" stackId="a" fill="#22c55e" name={t.goalEndurance} />
                          <Bar dataKey="volume" stackId="a" fill="#a855f7" name={t.goalVolume} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-text-tertiary">{t.intensityEmpty}</p>
                  )}
                </Card>

                <Card className="">
                  <h3 className="text-lg font-semibold mb-2">{t.prTitle}</h3>
                  {exercisePrs.length > 0 ? (
                    <div className="space-y-3">
                      {exercisePrs.slice(0, 6).map((pr) => (
                        <div
                          key={pr.exercise_id || pr.exercise_name}
                          className="p-3 rounded-lg border border-border bg-background-elevated/60"
                        >
                          <p className="font-semibold">{pr.exercise_name}</p>
                          <p className="text-sm text-text-tertiary">
                            {t.metricWeight}:{' '}
                            {pr.max_weight === null
                              ? '-'
                              : displayWeightValue(pr.max_weight, unit)}{' '}
                            {weightInputLabel(unit)}
                          </p>
                          <p className="text-sm text-text-tertiary">
                            {t.metric1rm}:{' '}
                            {pr.max_estimated_1rm === null
                              ? '-'
                              : displayWeightValue(pr.max_estimated_1rm, unit)}{' '}
                            {weightInputLabel(unit)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-tertiary">{t.prEmpty}</p>
                  )}
                </Card>
              </div>

              <Card className="">
                <h3 className="text-lg font-semibold mb-4">{t.suggestionTitle}</h3>
                {selectedExerciseId ? (
                  formattedSuggestions.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {formattedSuggestions.map((row) => (
                        <div
                          key={row.goal}
                          className="rounded-lg border border-border bg-background-elevated/60 p-4"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-semibold">{row.goal}</p>
                            <span className="text-xs text-text-tertiary">
                              {row.rep_range} reps
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                            <p>
                              {t.suggestionMin}:{' '}
                              {row.min_weight ?? '-'} {weightInputLabel(unit)}
                            </p>
                            <p>
                              {t.suggestionMax}:{' '}
                              {row.max_weight ?? '-'} {weightInputLabel(unit)}
                            </p>
                            <p>
                              {t.suggestionSuggested}:{' '}
                              {row.suggested_weight ?? '-'} {weightInputLabel(unit)}
                            </p>
                            <p>
                              {t.lastBest}:{' '}
                              {row.last_best_weight ?? '-'} {weightInputLabel(unit)}
                            </p>
                          </div>
                          {row.last_session_date && (
                            <p className="text-xs text-text-tertiary mt-2">
                              {t.lastSession}:{' '}
                              {new Date(row.last_session_date).toLocaleDateString(locale)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-tertiary">{t.noPerformance}</p>
                  )
                ) : (
                  <p className="text-sm text-text-tertiary">{t.suggestionEmpty}</p>
                )}
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="">
                  <h3 className="text-lg font-semibold mb-2">{t.bmiTitle}</h3>
                  <p className="text-sm text-text-tertiary mb-4">{t.bmiLabel}</p>
                  {bmiData && bmiData.bmi !== null ? (
                    <div className="space-y-2">
                      <p className="text-3xl font-bold text-gradient">
                        {Number(bmiData.bmi).toFixed(1)}
                      </p>
                      <p className="text-sm text-text-tertiary">{t.bmiNote}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-text-tertiary">{t.noBmi}</p>
                  )}
                </Card>

                <Card className="">
                  <h3 className="text-lg font-semibold">{t.calculatorTitle}</h3>
                  <p className="text-sm text-text-tertiary mb-4">{t.calculatorSubtitle}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label={`${t.weightLabel} (${weightInputLabel(unit)})`}
                      type="number"
                      value={calcWeight}
                      onChange={(event) => setCalcWeight(event.target.value)}
                      placeholder={unit === 'imperial' ? '185' : '80'}
                    />
                    <Input
                      label={t.repsLabel}
                      type="number"
                      value={calcReps}
                      onChange={(event) => setCalcReps(event.target.value)}
                      placeholder="5"
                    />
                  </div>
                  {calculator.estimate ? (
                    <div className="mt-4 space-y-3 text-sm">
                      <p className="font-semibold">
                        {t.estimateLabel}: {calculator.estimate} {weightInputLabel(unit)}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {calculator.ranges.map((range) => (
                          <div
                            key={range.goal}
                            className="rounded-lg border border-border bg-background-elevated/60 px-3 py-2"
                          >
                            <p className="font-semibold">{range.goal}</p>
                            <p className="text-xs text-text-tertiary">
                              {range.repRange} reps
                            </p>
                            <p className="text-sm mt-1">
                              {range.min}-{range.max} {weightInputLabel(unit)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-text-tertiary mt-3">
                      {t.calculatorHint}
                    </p>
                  )}
                </Card>
              </div>

              <Card className="">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  {t.profileInfo}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {client.age && (
                    <div>
                      <p className="text-text-tertiary">{t.age}</p>
                      <p className="font-semibold">{client.age}</p>
                    </div>
                  )}
                  {client.height && (
                    <div>
                      <p className="text-text-tertiary">{t.height}</p>
                      <p className="font-semibold">{formatHeight(client.height, unit)}</p>
                    </div>
                  )}
                  {client.weight && (
                    <div>
                      <p className="text-text-tertiary">{t.weight}</p>
                      <p className="font-semibold">{formatWeight(client.weight, unit)}</p>
                    </div>
                  )}
                  {client.goal && (
                    <div className="col-span-2">
                      <p className="text-text-tertiary">{t.goal}</p>
                      <p className="font-semibold">{client.goal}</p>
                    </div>
                  )}
                  {client.injuries && (
                    <div className="col-span-2">
                      <p className="text-text-tertiary">{t.injuries}</p>
                      <p className="font-semibold">{client.injuries}</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'workouts' && (
            <div className="space-y-4">
              {workouts.length > 0 ? (
                workouts.map((workout) => (
                  <Card
                    key={workout.id}
                    className="group cursor-pointer relative overflow-hidden   transition-all duration-300"
                    onClick={() =>
                      router.push(`/coach/clients/${clientId}/workouts/${workout.id}`)
                    }
                  >
                    <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">
                            {new Date(workout.date).toLocaleDateString(locale, {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-sm text-text-secondary mt-1">
                            {t.workoutDate}: {workout.duration_minutes} {t.workoutMinutes}
                          </p>
                          {workout.notes && (
                            <p className="text-sm text-text-tertiary mt-2">
                              {workout.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="info">{workout.duration_minutes} min</Badge>
                          <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-text-primary transition-colors" />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card>
                  <p className="text-center text-text-secondary py-8">
                    {t.noWorkoutLogs}
                  </p>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'checkins' && (
            <div className="space-y-4">
              {checkins.length > 0 ? (
                checkins.map((checkin) => (
                  <Card
                    key={checkin.id}
                    className="group cursor-pointer relative overflow-hidden   transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-success opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                    <div className="relative z-10">
                      <p className="font-semibold mb-3">
                        {t.weekOf} {new Date(checkin.week_start_date).toLocaleDateString(locale)}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        {checkin.weight && (
                          <div>
                            <p className="text-text-tertiary">{t.weight}</p>
                            <p className="font-semibold">{formatWeight(checkin.weight, unit)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-text-tertiary">{t.sleep}</p>
                          <p className="font-semibold">{checkin.sleep_quality}/5</p>
                        </div>
                        <div>
                          <p className="text-text-tertiary">{t.stress}</p>
                          <p className="font-semibold">{checkin.stress_level}/5</p>
                        </div>
                        <div>
                          <p className="text-text-tertiary">{t.soreness}</p>
                          <p className="font-semibold">{checkin.soreness_level}/5</p>
                        </div>
                        <div>
                          <p className="text-text-tertiary">{t.mood}</p>
                          <p className="font-semibold">{checkin.mood}/5</p>
                        </div>
                      </div>
                      {checkin.notes && (
                        <p className="text-sm text-text-tertiary mt-3 pt-3 border-t border-border">
                          {checkin.notes}
                        </p>
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <Card>
                  <p className="text-center text-text-secondary py-8">
                    {t.noCheckins}
                  </p>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>
    </CoachLayout>
  );
}

