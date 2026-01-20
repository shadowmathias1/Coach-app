'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Dumbbell, Scale, TrendingUp } from 'lucide-react';
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
import ClientLayout from '@/components/layout/ClientLayout';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { getCurrentUser, supabase } from '@/lib/supabase';
import { useLanguage } from '@/components/shared/LanguageProvider';
import { useUnits } from '@/components/shared/UnitProvider';
import { displayWeightValue, kgToLb, toMetricWeight, weightInputLabel } from '@/lib/units';

interface WorkoutLog {
  id: string;
  date: string;
  duration_minutes: number | null;
}

interface Checkin {
  id: string;
  week_start_date: string;
  weight: number | null;
  sleep_quality: number;
  stress_level: number;
  soreness_level: number;
  mood: number;
}

interface TrendPoint {
  week: string;
  count: number;
}

interface WeightPoint {
  week: string;
  weight: number;
}

interface ExercisePerfRow {
  exercise_id: string | null;
  exercise_name: string;
  date: string;
  max_weight: number | null;
  max_estimated_1rm: number | null;
}

interface ExerciseOption {
  id: string;
  name: string;
}

interface ComparisonPoint {
  date: string;
  exercise_id: string;
  exercise_name: string;
  metric: string;
  value: number | null;
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

export default function ClientProgressPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { unit } = useUnits();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [workoutTrend, setWorkoutTrend] = useState<TrendPoint[]>([]);
  const [checkinTrend, setCheckinTrend] = useState<TrendPoint[]>([]);
  const [weightTrend, setWeightTrend] = useState<WeightPoint[]>([]);
  const [bmiData, setBmiData] = useState<{ bmi: number | null; bmi_note: string | null } | null>(
    null
  );
  const [exercisePerf, setExercisePerf] = useState<ExercisePerfRow[]>([]);
  const [exerciseOptions, setExerciseOptions] = useState<ExerciseOption[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [compareExerciseA, setCompareExerciseA] = useState('');
  const [compareExerciseB, setCompareExerciseB] = useState('');
  const [compareMetric, setCompareMetric] = useState<'max_weight' | 'max_estimated_1rm'>(
    'max_weight'
  );
  const [compareSeries, setCompareSeries] = useState<ComparisonPoint[]>([]);
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
        title: 'Progression',
        subtitle: 'Suis tes habitudes et tes resultats',
        workouts30: 'Seances (30j)',
        checkins30: 'Check-ins (30j)',
        lastCheckin: 'Dernier check-in',
        none: 'Aucun',
        workoutsPerWeek: 'Seances par semaine',
        checkinsPerWeek: 'Check-ins par semaine',
        noWorkouts: 'Aucune seance enregistree.',
        noCheckins: 'Aucun check-in pour le moment.',
        weightTrend: 'Poids dans le temps',
        noWeight: 'Aucune donnee de poids.',
        performanceTitle: 'Performance par exercice',
        performanceSelect: 'Selectionner un exercice',
        noPerformance: 'Aucune performance pour cet exercice.',
        compareTitle: 'Comparer deux exercices',
        compareMetric: 'Metrice',
        metricWeight: 'Charge max',
        metric1rm: '1RM estime',
        bmiTitle: 'IMC',
        bmiLabel: 'Indice de masse corporelle',
        bmiNote:
          "IMC indicatif: la masse musculaire peut faire apparaitre une personne comme en surpoids.",
        noBmi: 'IMC indisponible',
        calculatorTitle: 'Calculateur 1RM',
        calculatorSubtitle: "Estime ton 1RM et tes zones d'entrainement",
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
      }
    : {
        title: 'Progress',
        subtitle: 'Track your habits and results',
        workouts30: 'Workouts (30d)',
        checkins30: 'Check-ins (30d)',
        lastCheckin: 'Last check-in',
        none: 'None',
        workoutsPerWeek: 'Workouts per week',
        checkinsPerWeek: 'Check-ins per week',
        noWorkouts: 'No workouts logged yet.',
        noCheckins: 'No check-ins yet.',
        weightTrend: 'Weight trend',
        noWeight: 'No weight data yet.',
        performanceTitle: 'Exercise performance',
        performanceSelect: 'Select an exercise',
        noPerformance: 'No performance data for this exercise yet.',
        compareTitle: 'Compare exercises',
        compareMetric: 'Metric',
        metricWeight: 'Max load',
        metric1rm: 'Estimated 1RM',
        bmiTitle: 'BMI',
        bmiLabel: 'Body mass index',
        bmiNote:
          'BMI is indicative: muscular people may appear overweight.',
        noBmi: 'BMI unavailable',
        calculatorTitle: '1RM calculator',
        calculatorSubtitle: 'Estimate your 1RM and training zones',
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

  const loadProgress = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUserId(user.id);

      const { data: workoutsData } = await supabase
        .from('workout_logs')
        .select('id, date, duration_minutes')
        .eq('client_id', user.id)
        .order('date', { ascending: false })
        .limit(12);

      setWorkouts((workoutsData as WorkoutLog[]) || []);

      const { data: checkinsData } = await supabase
        .from('checkins')
        .select('id, week_start_date, weight, sleep_quality, stress_level, soreness_level, mood')
        .eq('client_id', user.id)
        .order('week_start_date', { ascending: false })
        .limit(12);

      setCheckins((checkinsData as Checkin[]) || []);

      const startRange = new Date();
      startRange.setDate(startRange.getDate() - 42);

      const { data: workoutDates } = await supabase
        .from('workout_logs')
        .select('date')
        .eq('client_id', user.id)
        .gte('date', startRange.toISOString().split('T')[0])
        .order('date', { ascending: true });

      const { data: checkinDates } = await supabase
        .from('checkins')
        .select('week_start_date, weight')
        .eq('client_id', user.id)
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
        .eq('client_id', user.id)
        .maybeSingle();
      setBmiData((bmiRow as { bmi: number | null; bmi_note: string | null }) || null);

      const { data: perfRows } = await supabase
        .from('exercise_perf_daily_secure')
        .select('exercise_id, exercise_name, date, max_weight, max_estimated_1rm')
        .eq('client_id', user.id)
        .order('date', { ascending: true });
      const perfData = (perfRows as ExercisePerfRow[]) || [];
      const filteredPerf = perfData.filter((row) => row.exercise_id);
      setExercisePerf(filteredPerf);
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
        .eq('client_id', user.id)
        .order('max_weight', { ascending: false });
      setExercisePrs((prRows as ExercisePrRow[]) || []);

      const { data: volumeRows } = await supabase
        .from('client_weekly_volume_compare')
        .select('week_start, current_volume, previous_volume, delta_volume')
        .eq('client_id', user.id)
        .order('week_start', { ascending: true });
      setWeeklyVolume((volumeRows as WeeklyVolumeRow[]) || []);

      const { data: muscleRows } = await supabase
        .from('client_weekly_muscle_tonnage')
        .select('week_start, muscle_group, total_tonnage')
        .eq('client_id', user.id)
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
        .eq('client_id', user.id)
        .order('week_start', { ascending: true });
      setWeeklyGoalSets((goalSetsRows as WeeklyGoalSetsRow[]) || []);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  useEffect(() => {
    if (exerciseOptions.length === 0) return;
    // Forcer l'initialisation si les valeurs sont vides
    if (!selectedExerciseId) {
      setSelectedExerciseId(exerciseOptions[0].id);
    }
    if (!compareExerciseA) {
      setCompareExerciseA(exerciseOptions[0].id);
    }
    if (!compareExerciseB) {
      setCompareExerciseB(exerciseOptions[1]?.id || exerciseOptions[0].id);
    }
  }, [exerciseOptions, selectedExerciseId, compareExerciseA, compareExerciseB]);

  useEffect(() => {
    const loadComparison = async () => {
      if (!userId || !compareExerciseA || !compareExerciseB) {
        setCompareSeries([]);
        return;
      }

      const { data, error } = await supabase.rpc('compare_exercises', {
        in_client_id: userId,
        in_exercise_ids: [compareExerciseA, compareExerciseB],
        in_metric: compareMetric,
      });

      if (error) {
        console.error('Error loading comparison:', error);
        setCompareSeries([]);
        return;
      }
      setCompareSeries((data as ComparisonPoint[]) || []);
    };

    loadComparison();
  }, [userId, compareExerciseA, compareExerciseB, compareMetric]);

  useEffect(() => {
    const loadSuggestions = async () => {
      if (!userId || !selectedExerciseId) {
        setSuggestions([]);
        return;
      }

      const increment =
        unit === 'imperial'
          ? Math.round(toMetricWeight(5, unit) * 100) / 100
          : 2.5;

      const { data, error } = await supabase.rpc('suggest_exercise_loads', {
        in_client_id: userId,
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
  }, [selectedExerciseId, unit, userId]);

  const lastCheckin = useMemo(() => checkins[0], [checkins]);
  const weightTrendDisplay = useMemo(() => {
    if (unit === 'imperial') {
      return weightTrend.map((point) => ({
        ...point,
        weight: Math.round(kgToLb(point.weight)),
      }));
    }
    return weightTrend;
  }, [unit, weightTrend]);

  const selectedExerciseSeries = useMemo(() => {
    if (!selectedExerciseId) return [];
    const filtered = exercisePerf.filter((row) => row.exercise_id === selectedExerciseId);
    return filtered.map((row) => {
      const maxWeight = row.max_weight ?? null;
      const maxEstimated = row.max_estimated_1rm ?? null;
      return {
        date: formatWeekLabel(row.date),
        max_weight:
          maxWeight === null
            ? null
            : unit === 'imperial'
              ? Math.round(kgToLb(maxWeight))
              : Math.round(maxWeight),
        max_estimated_1rm:
          maxEstimated === null
            ? null
            : unit === 'imperial'
              ? Math.round(kgToLb(maxEstimated))
              : Math.round(maxEstimated),
      };
    });
  }, [exercisePerf, selectedExerciseId, unit]);

  const comparisonChart = useMemo(() => {
    if (!compareExerciseA || !compareExerciseB) {
      return { data: [], labels: ['', ''] };
    }

    const exerciseMap = new Map(exerciseOptions.map((opt) => [opt.id, opt.name]));
    const labelA = exerciseMap.get(compareExerciseA) || 'A';
    const labelB = exerciseMap.get(compareExerciseB) || 'B';
    const base = new Map<string, { date: string; seriesA?: number | null; seriesB?: number | null }>();

    compareSeries.forEach((row) => {
      const key = row.date;
      const existing = base.get(key) || { date: formatWeekLabel(key) };
      const value =
        row.value === null
          ? null
          : unit === 'imperial'
            ? Math.round(kgToLb(row.value))
            : Math.round(row.value);

      if (row.exercise_id === compareExerciseA) {
        existing.seriesA = value;
      }
      if (row.exercise_id === compareExerciseB) {
        existing.seriesB = value;
      }
      base.set(key, existing);
    });

    return {
      data: Array.from(base.values()),
      labels: [labelA, labelB],
    };
  }, [compareExerciseA, compareExerciseB, compareSeries, exerciseOptions, unit]);

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
      <ClientLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="min-h-screen bg-background">
        <header className="bg-background-surface border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="text-text-secondary mt-1">{t.subtitle}</p>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-primary/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">{t.workouts30}</p>
                  <p className="text-3xl font-bold text-gradient mt-1">
                    {workouts.length}
                  </p>
                </div>
                <Dumbbell className="w-8 h-8 text-primary" />
              </div>
            </Card>

            <Card className="border-l-4 border-l-success/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">{t.checkins30}</p>
                  <p className="text-3xl font-bold text-gradient mt-1">
                    {checkins.length}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
            </Card>

            <Card className="border-l-4 border-l-secondary/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">{t.lastCheckin}</p>
                  <p className="text-lg font-semibold mt-1">
                    {lastCheckin
                      ? new Date(lastCheckin.week_start_date).toLocaleDateString(locale)
                      : t.none}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-secondary" />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-l-4 border-l-primary/30">
              <h3 className="text-lg font-semibold mb-4">{t.workoutsPerWeek}</h3>
              {workoutTrend.length > 0 ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={workoutTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                      <XAxis dataKey="week" stroke="#a1a1aa" />
                      <YAxis stroke="#a1a1aa" allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-text-tertiary">{t.noWorkouts}</p>
              )}
            </Card>

            <Card className="border-l-4 border-l-success/30">
              <h3 className="text-lg font-semibold mb-4">{t.checkinsPerWeek}</h3>
              {checkinTrend.length > 0 ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={checkinTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                      <XAxis dataKey="week" stroke="#a1a1aa" />
                      <YAxis stroke="#a1a1aa" allowDecimals={false} />
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

          <Card className="border-l-4 border-l-secondary/30">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-5 h-5 text-secondary" />
              <h3 className="text-lg font-semibold">{t.weightTrend}</h3>
            </div>
            {weightTrendDisplay.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightTrendDisplay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="week" stroke="#a1a1aa" />
                    <YAxis stroke="#a1a1aa" />
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-l-4 border-l-primary/30">
              <h3 className="text-lg font-semibold mb-4">{t.performanceTitle}</h3>
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
                  {selectedExerciseSeries.length > 0 ? (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selectedExerciseSeries}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                          <XAxis dataKey="date" stroke="#a1a1aa" />
                          <YAxis stroke="#a1a1aa" />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="max_weight"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            name={t.metricWeight}
                          />
                          <Line
                            type="monotone"
                            dataKey="max_estimated_1rm"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            name={t.metric1rm}
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

            <Card className="border-l-4 border-l-accent/30">
              <h3 className="text-lg font-semibold mb-4">{t.compareTitle}</h3>
              {exerciseOptions.length > 1 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <select
                      className="input"
                      value={compareExerciseA}
                      onChange={(event) => setCompareExerciseA(event.target.value)}
                    >
                      {exerciseOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                    <select
                      className="input"
                      value={compareExerciseB}
                      onChange={(event) => setCompareExerciseB(event.target.value)}
                    >
                      {exerciseOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                    <select
                      className="input"
                      value={compareMetric}
                      onChange={(event) =>
                        setCompareMetric(event.target.value as 'max_weight' | 'max_estimated_1rm')
                      }
                    >
                      <option value="max_weight">{t.metricWeight}</option>
                      <option value="max_estimated_1rm">{t.metric1rm}</option>
                    </select>
                  </div>
                  {comparisonChart.data.length > 0 ? (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={comparisonChart.data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                          <XAxis dataKey="date" stroke="#a1a1aa" />
                          <YAxis stroke="#a1a1aa" />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="seriesA"
                            stroke="#22c55e"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            name={comparisonChart.labels[0]}
                          />
                          <Line
                            type="monotone"
                            dataKey="seriesB"
                            stroke="#6366f1"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            name={comparisonChart.labels[1]}
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
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-l-4 border-l-primary/30">
              <h3 className="text-lg font-semibold mb-2">{t.weeklyVolumeTitle}</h3>
              <p className="text-sm text-text-tertiary mb-4">{t.weeklyVolumeSubtitle}</p>
              {weeklyVolumeChart.length > 0 ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyVolumeChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                      <XAxis dataKey="week" stroke="#a1a1aa" />
                      <YAxis stroke="#a1a1aa" />
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

            <Card className="border-l-4 border-l-success/30">
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
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                          <XAxis dataKey="week" stroke="#a1a1aa" />
                          <YAxis stroke="#a1a1aa" />
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
            <Card className="border-l-4 border-l-secondary/30">
              <h3 className="text-lg font-semibold mb-2">{t.intensityTitle}</h3>
              <p className="text-sm text-text-tertiary mb-4">{t.intensitySubtitle}</p>
              {intensityChart.length > 0 ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={intensityChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                      <XAxis dataKey="week" stroke="#a1a1aa" />
                      <YAxis stroke="#a1a1aa" allowDecimals={false} />
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

            <Card className="border-l-4 border-l-primary/30">
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

          <Card className="border-l-4 border-l-accent/30">
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
            <Card className="border-l-4 border-l-secondary/30">
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

            <Card className="border-l-4 border-l-primary/30">
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
        </main>
      </div>
    </ClientLayout>
  );
}
