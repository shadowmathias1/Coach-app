'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ChevronLeft, Scale, Moon, Frown, Activity, Smile } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { toast } from 'sonner';
import ClientLayout from '@/components/layout/ClientLayout';
import { useLanguage } from '@/components/shared/LanguageProvider';
import { useUnits } from '@/components/shared/UnitProvider';
import { lbToKg, weightInputLabel } from '@/lib/units';

export default function CheckinPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { unit } = useUnits();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    weight: '',
    sleep: 3,
    stress: 3,
    soreness: 3,
    mood: 3,
    notes: '',
  });

  const t = language === 'fr'
    ? {
        back: 'Retour',
        title: 'Check-in hebdo',
        weekOf: 'Semaine du',
        weight: `Poids (${weightInputLabel(unit)})`,
        optional: 'Optionnel',
        rate: 'Note 1-5',
        sleep: 'Qualite du sommeil',
        stress: 'Niveau de stress',
        soreness: 'Douleurs musculaires',
        mood: 'Humeur generale',
        notes: 'Notes supplementaires (optionnel)',
        notesPlaceholder: 'Comment sest passee ta semaine ?',
        submit: 'Envoyer le check-in',
        saved: 'Check-in enregistre !',
        alreadyDone: 'Tu as deja complete le check-in de cette semaine !',
        saveFail: 'Echec de lenregistrement',
      }
    : {
        back: 'Back',
        title: 'Weekly check-in',
        weekOf: 'Week of',
        weight: `Weight (${weightInputLabel(unit)})`,
        optional: 'Optional',
        rate: 'Rate 1-5',
        sleep: 'Sleep quality',
        stress: 'Stress level',
        soreness: 'Muscle soreness',
        mood: 'Overall mood',
        notes: 'Additional notes (optional)',
        notesPlaceholder: 'How was your week? Any challenges or wins?',
        submit: 'Submit check-in',
        saved: 'Check-in saved!',
        alreadyDone: "You already completed this week's check-in!",
        saveFail: 'Failed to save check-in',
      };

  const getWeekStartDate = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff)).toISOString().split('T')[0];
  };

  const saveCheckin = async () => {
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

      const weightValue = formData.weight ? parseFloat(formData.weight) : null;
      const weightKg =
        weightValue !== null && unit === 'imperial'
          ? lbToKg(weightValue)
          : weightValue;

      const { error } = await supabase
        .from('checkins')
        .insert({
          client_id: user.id,
          coach_id: coachId,
          week_start_date: getWeekStartDate(),
          weight: weightKg,
          sleep_quality: formData.sleep,
          stress_level: formData.stress,
          soreness_level: formData.soreness,
          mood: formData.mood,
          notes: formData.notes || null,
        });

      if (error) throw error;

      toast.success(t.saved);
      await supabase
        .from('clients')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', user.id);
      router.push('/client/dashboard');
    } catch (error: any) {
      console.error('Error saving check-in:', error);
      if (error.code === '23505') {
        toast.error(t.alreadyDone);
      } else {
        toast.error(t.saveFail);
      }
    } finally {
      setLoading(false);
    }
  };

  const RatingScale = ({
    label,
    value,
    onChange,
    icon: Icon,
    color,
  }: {
    label: string;
    value: number;
    onChange: (val: number) => void;
    icon: any;
    color: string;
  }) => (
    <Card className="border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <h3 className="font-semibold">{label}</h3>
          <p className="text-sm text-text-tertiary">{t.rate}</p>
        </div>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            onClick={() => onChange(num)}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all duration-200 ${
              value === num
                ? 'text-white shadow-glow-sm'
                : 'bg-background-elevated hover:bg-background-surface text-text-secondary'
            }`}
            style={
              value === num
                ? { backgroundColor: color }
                : {}
            }
          >
            {num}
          </button>
        ))}
      </div>
    </Card>
  );

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
                  {t.weekOf} {new Date(getWeekStartDate()).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-8">
          <Card className="mb-6 border-l-4 border-l-primary/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Scale className="w-5 h-5 text-primary" />
              </div>
              <div>
                <label className="font-semibold">{t.weight}</label>
                <p className="text-sm text-text-tertiary">{t.optional}</p>
              </div>
            </div>
            <Input
              type="number"
              value={formData.weight}
              onChange={(e) =>
                setFormData({ ...formData, weight: e.target.value })
              }
              placeholder={unit === 'imperial' ? '155' : '70.5'}
              step={0.1}
              className="w-40"
            />
          </Card>

          <div className="space-y-6 mb-6">
            <RatingScale
              label={t.sleep}
              value={formData.sleep}
              onChange={(val) => setFormData({ ...formData, sleep: val })}
              icon={Moon}
              color="#3b82f6"
            />

            <RatingScale
              label={t.stress}
              value={formData.stress}
              onChange={(val) => setFormData({ ...formData, stress: val })}
              icon={Frown}
              color="#f59e0b"
            />

            <RatingScale
              label={t.soreness}
              value={formData.soreness}
              onChange={(val) => setFormData({ ...formData, soreness: val })}
              icon={Activity}
              color="#ef4444"
            />

            <RatingScale
              label={t.mood}
              value={formData.mood}
              onChange={(val) => setFormData({ ...formData, mood: val })}
              icon={Smile}
              color="#10b981"
            />
          </div>

          <Card className="mb-6 border-l-4 border-l-success/30">
            <label className="text-sm text-text-secondary mb-2 block">
              {t.notes}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t.notesPlaceholder}
              className="w-full bg-background-elevated/50 backdrop-blur-md border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-tertiary min-h-[120px] resize-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-background-elevated transition-all duration-200"
            />
          </Card>

          <Button
            variant="primary"
            fullWidth
            onClick={saveCheckin}
            loading={loading}
          >
            <Save className="w-4 h-4" />
            {t.submit}
          </Button>
        </main>
      </div>
    </ClientLayout>
  );
}
