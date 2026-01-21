'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClientLayout from '@/components/layout/ClientLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useLanguage } from '@/components/shared/LanguageProvider';
import { useUnits } from '@/components/shared/UnitProvider';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { displayWeightValue, kgToLb, toMetricWeight, weightInputLabel, formatWeight } from '@/lib/units';
import {
  TrendingUp,
  Scale,
  Trophy,
  Dumbbell,
  Target,
  Calculator,
  BarChart3,
  GitCompare,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

interface WeeklyVolume {
  week_start: string;
  total_volume: number | null;
  total_reps: number | null;
  set_count: number | null;
}

interface CheckIn {
  week_start_date: string;
  weight: number | null;
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

interface ExercisePR {
  exercise_name: string;
  max_weight: number | null;
  max_weight_date: string | null;
  max_estimated_1rm: number | null;
}

interface WeeklyMuscleRow {
  week_start: string;
  muscle_group: string;
  total_tonnage: number | null;
}

interface CompareDataPoint {
  date: string;
  [key: string]: string | number | null;
}

export default function ClientProgressPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { unit } = useUnits();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'exercises' | 'compare'>('overview');

  // Data states
  const [weightData, setWeightData] = useState<{ date: string; weight: number }[]>([]);
  const [volumeData, setVolumeData] = useState<WeeklyVolume[]>([]);
  const [exerciseOptions, setExerciseOptions] = useState<ExerciseOption[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseHistoryPoint[]>([]);
  const [exercisePRs, setExercisePRs] = useState<ExercisePR[]>([]);
  const [weeklyMuscle, setWeeklyMuscle] = useState<WeeklyMuscleRow[]>([]);
  const [muscleOptions, setMuscleOptions] = useState<string[]>([]);
  const [selectedMuscle, setSelectedMuscle] = useState('');

  // Compare states
  const [compareExerciseA, setCompareExerciseA] = useState('');
  const [compareExerciseB, setCompareExerciseB] = useState('');
  const [compareData, setCompareData] = useState<CompareDataPoint[]>([]);

  // Calculator states
  const [calcWeight, setCalcWeight] = useState('');
  const [calcReps, setCalcReps] = useState('');

  const t = useMemo(
    () =>
      language === 'fr'
        ? {
            title: 'Progression',
            subtitle: 'Suis ton evolution et tes performances',
            tabs: {
              overview: 'Vue generale',
              exercises: 'Par exercice',
              compare: 'Comparateur',
            },
            weightProgress: 'Evolution du poids',
            noWeightData: 'Pas de donnees de poids. Fais un check-in pour commencer.',
            volumeProgress: 'Volume hebdomadaire',
            noVolumeData: 'Pas de donnees de volume.',
            totalVolume: 'Volume total',
            personalRecords: 'Records personnels',
            noPRs: 'Pas encore de PR. Continue a t\'entrainer !',
            maxWeight: 'Charge max',
            estimated1rm: '1RM estime',
            exercisePerformance: 'Performance par exercice',
            selectExercise: 'Choisir un exercice',
            noExerciseData: 'Pas de donnees pour cet exercice.',
            noExercises: 'Aucun exercice enregistre.',
            muscleTonnage: 'Tonnage par groupe musculaire',
            selectMuscle: 'Choisir un groupe',
            noMuscleData: 'Pas de donnees de tonnage.',
            compareExercises: 'Comparer deux exercices',
            exerciseA: 'Exercice A',
            exerciseB: 'Exercice B',
            noCompareData: 'Selectionne deux exercices pour comparer.',
            calculator: 'Calculateur 1RM',
            calculatorDesc: 'Estime ton 1RM et les zones d\'entrainement',
            weight: 'Charge',
            reps: 'Repetitions',
            estimated: '1RM estime',
            calculatorHint: 'Entre une charge et des repetitions.',
            strength: 'Force',
            hypertrophy: 'Hypertrophie',
            endurance: 'Endurance',
            volume: 'Volume',
            kg: 'kg',
            lb: 'lb',
            maxLoad: 'Charge max',
            maxReps: 'Reps max',
          }
        : {
            title: 'Progress',
            subtitle: 'Track your evolution and performance',
            tabs: {
              overview: 'Overview',
              exercises: 'By exercise',
              compare: 'Compare',
            },
            weightProgress: 'Weight progress',
            noWeightData: 'No weight data yet. Do a check-in to start tracking.',
            volumeProgress: 'Weekly volume',
            noVolumeData: 'No volume data yet.',
            totalVolume: 'Total volume',
            personalRecords: 'Personal records',
            noPRs: 'No PRs yet. Keep training!',
            maxWeight: 'Max weight',
            estimated1rm: 'Estimated 1RM',
            exercisePerformance: 'Exercise performance',
            selectExercise: 'Select an exercise',
            noExerciseData: 'No data for this exercise.',
            noExercises: 'No exercises logged yet.',
            muscleTonnage: 'Muscle group tonnage',
            selectMuscle: 'Select a muscle group',
            noMuscleData: 'No tonnage data yet.',
            compareExercises: 'Compare two exercises',
            exerciseA: 'Exercise A',
            exerciseB: 'Exercise B',
            noCompareData: 'Select two exercises to compare.',
            calculator: '1RM Calculator',
            calculatorDesc: 'Estimate your 1RM and training zones',
            weight: 'Weight',
            reps: 'Repetitions',
            estimated: 'Estimated 1RM',
            calculatorHint: 'Enter a weight and reps.',
            strength: 'Strength',
            hypertrophy: 'Hypertrophy',
            endurance: 'Endurance',
            volume: 'Volume',
            kg: 'kg',
            lb: 'lb',
            maxLoad: 'Max load',
            maxReps: 'Max reps',
          },
    [language]
  );

  const formatWeekLabel = (dateValue: string) => {
    const date = new Date(dateValue);
    return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'short',
    });
  };

  const loadProgressData = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const clientId = user.id;

      // Fetch all data in parallel
      const [
        checkInsRes,
        volumeRes,
        perfRes,
        prsRes,
        muscleRes,
      ] = await Promise.all([
        supabase
          .from('checkins')
          .select('week_start_date, weight')
          .eq('client_id', clientId)
          .not('weight', 'is', null)
          .order('week_start_date', { ascending: true })
          .limit(20),
        supabase
          .from('client_weekly_volume')
          .select('week_start, total_volume, total_reps, set_count')
          .eq('client_id', clientId)
          .order('week_start', { ascending: false })
          .limit(12),
        supabase
          .from('exercise_perf_daily_secure')
          .select('exercise_id, exercise_name, date, max_weight, max_estimated_1rm')
          .eq('client_id', clientId)
          .order('date', { ascending: true }),
        supabase
          .from('exercise_prs')
          .select('exercise_name, max_weight, max_weight_date, max_estimated_1rm')
          .eq('client_id', clientId)
          .not('max_weight', 'is', null)
          .order('max_weight', { ascending: false })
          .limit(10),
        supabase
          .from('client_weekly_muscle_tonnage')
          .select('week_start, muscle_group, total_tonnage')
          .eq('client_id', clientId)
          .order('week_start', { ascending: true }),
      ]);

      // Weight data
      const checkIns = checkInsRes.data || [];
      setWeightData(
        checkIns.map((c) => ({
          date: formatWeekLabel(c.week_start_date),
          weight: c.weight!,
        }))
      );

      // Volume data
      setVolumeData((volumeRes.data || []).reverse());

      // Exercise options
      const perfData = perfRes.data || [];
      const filteredPerf = perfData.filter((row: { exercise_id: string | null }) => row.exercise_id);
      const uniqueExercises = Array.from(
        filteredPerf.reduce<Map<string, string>>((acc, row: { exercise_id: string | null; exercise_name: string }) => {
          if (!row.exercise_id) return acc;
          if (!acc.has(row.exercise_id)) acc.set(row.exercise_id, row.exercise_name);
          return acc;
        }, new Map())
      ).map(([id, name]) => ({ id, name }));
      uniqueExercises.sort((a, b) => a.name.localeCompare(b.name));
      setExerciseOptions(uniqueExercises);
      if (uniqueExercises.length > 0) {
        setSelectedExerciseId(uniqueExercises[0].id);
        if (uniqueExercises.length > 1) {
          setCompareExerciseA(uniqueExercises[0].id);
          setCompareExerciseB(uniqueExercises[1].id);
        }
      }

      // PRs
      setExercisePRs(prsRes.data || []);

      // Muscle tonnage
      const muscleData = muscleRes.data || [];
      setWeeklyMuscle(muscleData);
      const uniqueMuscles = Array.from(new Set(muscleData.map((row: WeeklyMuscleRow) => row.muscle_group)));
      uniqueMuscles.sort((a, b) => a.localeCompare(b));
      setMuscleOptions(uniqueMuscles);
      if (uniqueMuscles.length > 0) {
        setSelectedMuscle(uniqueMuscles[0]);
      }
    } catch (err) {
      console.error('Error loading progress data:', err);
    } finally {
      setLoading(false);
    }
  }, [router, language]);

  useEffect(() => {
    loadProgressData();
  }, [loadProgressData]);

  // Load exercise history when selected exercise changes
  useEffect(() => {
    const loadExerciseHistory = async () => {
      if (!selectedExerciseId) {
        setExerciseHistory([]);
        return;
      }

      const user = await getCurrentUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('workout_entries')
        .select('sets_json, workout_logs!inner(date)')
        .eq('exercise_id', selectedExerciseId)
        .eq('workout_logs.client_id', user.id)
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
  }, [selectedExerciseId, language]);

  // Load compare data
  useEffect(() => {
    const loadCompareData = async () => {
      if (!compareExerciseA || !compareExerciseB) {
        setCompareData([]);
        return;
      }

      const user = await getCurrentUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('compare_exercises', {
        in_client_id: user.id,
        in_exercise_ids: [compareExerciseA, compareExerciseB],
        in_metric: 'max_weight',
      });

      if (error) {
        console.error('Error comparing exercises:', error);
        setCompareData([]);
        return;
      }

      // Group by date
      const dateMap = new Map<string, CompareDataPoint>();
      (data || []).forEach((row: { date: string; exercise_id: string; exercise_name: string; value: number | null }) => {
        const existing = dateMap.get(row.date) || { date: formatWeekLabel(row.date) };
        existing[row.exercise_name] = row.value;
        dateMap.set(row.date, existing);
      });

      setCompareData(Array.from(dateMap.values()));
    };

    loadCompareData();
  }, [compareExerciseA, compareExerciseB, language]);

  // Display transformations
  const weightDataDisplay = useMemo(() => {
    if (unit === 'imperial') {
      return weightData.map((point) => ({
        ...point,
        weight: Math.round(kgToLb(point.weight)),
      }));
    }
    return weightData;
  }, [unit, weightData]);

  const volumeDataDisplay = useMemo(() => {
    return volumeData.map((row) => ({
      week: formatWeekLabel(row.week_start),
      volume: row.total_volume
        ? unit === 'imperial'
          ? Math.round(kgToLb(row.total_volume))
          : Math.round(row.total_volume)
        : 0,
    }));
  }, [volumeData, unit, language]);

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
  }, [selectedMuscle, unit, weeklyMuscle, language]);

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
      { goal: t.strength, repRange: '1-5', minPercent: 0.85, maxPercent: 1.0 },
      { goal: t.hypertrophy, repRange: '6-12', minPercent: 0.65, maxPercent: 0.85 },
      { goal: t.endurance, repRange: '12-20', minPercent: 0.5, maxPercent: 0.65 },
      { goal: t.volume, repRange: '8-15', minPercent: 0.6, maxPercent: 0.75 },
    ].map((range) => ({
      goal: range.goal,
      repRange: range.repRange,
      min: displayWeightValue(estimated1rmKg * range.minPercent, unit),
      max: displayWeightValue(estimated1rmKg * range.maxPercent, unit),
    }));

    return { estimate: estimatedDisplay, ranges };
  }, [calcReps, calcWeight, t.strength, t.hypertrophy, t.endurance, t.volume, unit]);

  const exerciseAName = exerciseOptions.find((e) => e.id === compareExerciseA)?.name || '';
  const exerciseBName = exerciseOptions.find((e) => e.id === compareExerciseB)?.name || '';

  if (loading) {
    return (
      <ClientLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-pulse text-text-secondary">Loading...</div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-background-surface border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <p className="text-sm uppercase tracking-[0.3em] text-text-tertiary">
              {t.title}
            </p>
            <h1 className="text-3xl font-bold mt-2">{t.title}</h1>
            <p className="text-text-secondary mt-1">{t.subtitle}</p>
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-background-surface border-b border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-6">
              {(['overview', 'exercises', 'compare'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-2 border-b-2 transition-colors ${
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
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Weight & Volume Charts */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Weight Progress */}
                <Card>
                  <div className="flex items-center gap-2 mb-4">
                    <Scale className="w-5 h-5 text-warning" />
                    <h3 className="text-lg font-semibold">{t.weightProgress}</h3>
                  </div>
                  <div className="h-56">
                    {weightDataDisplay.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weightDataDisplay}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border) / 0.35)" />
                          <XAxis
                            dataKey="date"
                            stroke="rgb(var(--color-text-secondary))"
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis
                            stroke="rgb(var(--color-text-secondary))"
                            tick={{ fontSize: 11 }}
                            domain={['dataMin - 2', 'dataMax + 2']}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgb(var(--color-background-elevated))',
                              border: '1px solid rgb(var(--color-border))',
                              borderRadius: '8px',
                            }}
                            formatter={(value: number) => [`${value} ${unit === 'imperial' ? t.lb : t.kg}`, t.weight]}
                          />
                          <Line
                            type="monotone"
                            dataKey="weight"
                            stroke="rgb(var(--color-warning))"
                            strokeWidth={2}
                            dot={{ fill: 'rgb(var(--color-warning))', r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-text-tertiary">
                        <div className="text-center">
                          <Scale className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">{t.noWeightData}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Volume Progress */}
                <Card>
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">{t.volumeProgress}</h3>
                  </div>
                  <div className="h-56">
                    {volumeDataDisplay.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={volumeDataDisplay}>
                          <defs>
                            <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="rgb(var(--color-primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="rgb(var(--color-primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border) / 0.35)" />
                          <XAxis
                            dataKey="week"
                            stroke="rgb(var(--color-text-secondary))"
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis
                            stroke="rgb(var(--color-text-secondary))"
                            tick={{ fontSize: 11 }}
                            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgb(var(--color-background-elevated))',
                              border: '1px solid rgb(var(--color-border))',
                              borderRadius: '8px',
                            }}
                            formatter={(value: number) => [`${value.toLocaleString()} ${unit === 'imperial' ? t.lb : t.kg}`, t.totalVolume]}
                          />
                          <Area
                            type="monotone"
                            dataKey="volume"
                            stroke="rgb(var(--color-primary))"
                            strokeWidth={2}
                            fill="url(#volumeGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-text-tertiary">
                        <div className="text-center">
                          <Dumbbell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">{t.noVolumeData}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* PRs & Calculator */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Personal Records */}
                <Card>
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-5 h-5 text-warning" />
                    <h3 className="text-lg font-semibold">{t.personalRecords}</h3>
                  </div>
                  {exercisePRs.length > 0 ? (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {exercisePRs.map((pr, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg bg-background-elevated flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium">{pr.exercise_name}</p>
                            <p className="text-xs text-text-tertiary">
                              {pr.max_weight_date && formatWeekLabel(pr.max_weight_date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-primary font-bold">
                              {pr.max_weight && displayWeightValue(pr.max_weight, unit)} {weightInputLabel(unit)}
                            </p>
                            {pr.max_estimated_1rm && (
                              <p className="text-xs text-text-tertiary">
                                1RM: {displayWeightValue(pr.max_estimated_1rm, unit)} {weightInputLabel(unit)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-text-tertiary">
                      <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">{t.noPRs}</p>
                    </div>
                  )}
                </Card>

                {/* 1RM Calculator */}
                <Card>
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="w-5 h-5 text-success" />
                    <h3 className="text-lg font-semibold">{t.calculator}</h3>
                  </div>
                  <p className="text-sm text-text-tertiary mb-4">{t.calculatorDesc}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label={`${t.weight} (${weightInputLabel(unit)})`}
                      type="number"
                      value={calcWeight}
                      onChange={(e) => setCalcWeight(e.target.value)}
                      placeholder={unit === 'imperial' ? '185' : '80'}
                    />
                    <Input
                      label={t.reps}
                      type="number"
                      value={calcReps}
                      onChange={(e) => setCalcReps(e.target.value)}
                      placeholder="5"
                    />
                  </div>
                  {calculator.estimate ? (
                    <div className="mt-4 space-y-3">
                      <p className="font-semibold text-primary">
                        {t.estimated}: {calculator.estimate} {weightInputLabel(unit)}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {calculator.ranges.map((range) => (
                          <div
                            key={range.goal}
                            className="rounded-lg bg-background-elevated px-3 py-2"
                          >
                            <p className="font-medium text-sm">{range.goal}</p>
                            <p className="text-xs text-text-tertiary">{range.repRange} reps</p>
                            <p className="text-sm mt-1">
                              {range.min}-{range.max} {weightInputLabel(unit)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-text-tertiary mt-3">{t.calculatorHint}</p>
                  )}
                </Card>
              </div>

              {/* Muscle Tonnage */}
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-success" />
                  <h3 className="text-lg font-semibold">{t.muscleTonnage}</h3>
                </div>
                {muscleOptions.length > 0 ? (
                  <>
                    <select
                      className="input mb-4"
                      value={selectedMuscle}
                      onChange={(e) => setSelectedMuscle(e.target.value)}
                    >
                      {muscleOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <div className="h-56">
                      {muscleTonnageChart.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={muscleTonnageChart}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border) / 0.35)" />
                            <XAxis
                              dataKey="week"
                              stroke="rgb(var(--color-text-secondary))"
                              tick={{ fontSize: 11 }}
                            />
                            <YAxis
                              stroke="rgb(var(--color-text-secondary))"
                              tick={{ fontSize: 11 }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgb(var(--color-background-elevated))',
                                border: '1px solid rgb(var(--color-border))',
                                borderRadius: '8px',
                              }}
                            />
                            <Bar
                              dataKey="tonnage"
                              fill="rgb(var(--color-success))"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-text-tertiary">
                          <p className="text-sm">{t.noMuscleData}</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-text-tertiary">
                    <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{t.noMuscleData}</p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Exercises Tab */}
          {activeTab === 'exercises' && (
            <div className="space-y-6">
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">{t.exercisePerformance}</h3>
                </div>
                {exerciseOptions.length > 0 ? (
                  <>
                    <select
                      className="input mb-4"
                      value={selectedExerciseId}
                      onChange={(e) => setSelectedExerciseId(e.target.value)}
                    >
                      {exerciseOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                    <div className="h-72">
                      {exerciseHistoryDisplay.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={exerciseHistoryDisplay}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border) / 0.35)" />
                            <XAxis
                              dataKey="date"
                              stroke="rgb(var(--color-text-secondary))"
                              tick={{ fontSize: 11 }}
                            />
                            <YAxis
                              yAxisId="left"
                              stroke="rgb(var(--color-text-secondary))"
                              tick={{ fontSize: 11 }}
                            />
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              stroke="rgb(var(--color-text-secondary))"
                              tick={{ fontSize: 11 }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgb(var(--color-background-elevated))',
                                border: '1px solid rgb(var(--color-border))',
                                borderRadius: '8px',
                              }}
                            />
                            <Legend />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="max_weight"
                              stroke="rgb(var(--color-primary))"
                              strokeWidth={2}
                              dot={{ r: 4 }}
                              name={t.maxLoad}
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="max_reps"
                              stroke="rgb(var(--color-accent))"
                              strokeWidth={2}
                              dot={{ r: 4 }}
                              name={t.maxReps}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-text-tertiary">
                          <p className="text-sm">{t.noExerciseData}</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-text-tertiary">
                    <Dumbbell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{t.noExercises}</p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Compare Tab */}
          {activeTab === 'compare' && (
            <div className="space-y-6">
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <GitCompare className="w-5 h-5 text-accent" />
                  <h3 className="text-lg font-semibold">{t.compareExercises}</h3>
                </div>
                {exerciseOptions.length >= 2 ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm text-text-secondary mb-1">{t.exerciseA}</label>
                        <select
                          className="input"
                          value={compareExerciseA}
                          onChange={(e) => setCompareExerciseA(e.target.value)}
                        >
                          {exerciseOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-text-secondary mb-1">{t.exerciseB}</label>
                        <select
                          className="input"
                          value={compareExerciseB}
                          onChange={(e) => setCompareExerciseB(e.target.value)}
                        >
                          {exerciseOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="h-72">
                      {compareData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={compareData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border) / 0.35)" />
                            <XAxis
                              dataKey="date"
                              stroke="rgb(var(--color-text-secondary))"
                              tick={{ fontSize: 11 }}
                            />
                            <YAxis
                              stroke="rgb(var(--color-text-secondary))"
                              tick={{ fontSize: 11 }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgb(var(--color-background-elevated))',
                                border: '1px solid rgb(var(--color-border))',
                                borderRadius: '8px',
                              }}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey={exerciseAName}
                              stroke="rgb(var(--color-primary))"
                              strokeWidth={2}
                              dot={{ r: 4 }}
                              connectNulls
                            />
                            <Line
                              type="monotone"
                              dataKey={exerciseBName}
                              stroke="rgb(var(--color-accent))"
                              strokeWidth={2}
                              dot={{ r: 4 }}
                              connectNulls
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-text-tertiary">
                          <p className="text-sm">{t.noCompareData}</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-text-tertiary">
                    <GitCompare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{t.noExercises}</p>
                  </div>
                )}
              </Card>
            </div>
          )}
        </main>
      </div>
    </ClientLayout>
  );
}
