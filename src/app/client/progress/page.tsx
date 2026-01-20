'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ClientLayout from '@/components/layout/ClientLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useLanguage } from '@/components/shared/LanguageProvider';

const actionLinks = [
  { key: 'logWorkout', href: '/client/log-workout' },
  { key: 'checkin', href: '/client/checkin' },
];

export default function ClientProgressPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = useMemo(
    () =>
      language === 'fr'
        ? {
            title: 'Progression',
            subtitle: 'Les statistiques sont en pause.',
            messageTitle: 'On redessine tout le suivi',
            messageBody:
              'Le système actuel de graphiques, de comparateurs, d’IMC et de cartes d’évolution est retiré pour repartir sur des données propres. Reviens bientôt pour choisir la période (journalière, hebdo, mensuelle, annuelle ou depuis le début).',
            actionsTitle: 'En attendant tu peux :',
          }
        : {
            title: 'Progress',
            subtitle: 'Statistics are on hold.',
            messageTitle: 'Rewiring the progress stack',
            messageBody:
              'The charts, comparators, BMI widgets and evolution cards are temporarily removed so we can rebuild them on clean data. We plan to let you pick time ranges (daily, weekly, monthly, yearly or all-time) once we ship the rewrite.',
            actionsTitle: 'In the meantime, you can:',
          },
    [language]
  );

  const handleNavigate = (href: string) => () => router.push(href);

  return (
    <ClientLayout>
      <div className="min-h-screen bg-background">
        <header className="bg-background-surface border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <p className="text-sm uppercase tracking-[0.3em] text-text-tertiary">{t.title}</p>
            <h1 className="text-3xl font-bold mt-2">{t.title}</h1>
            <p className="text-text-secondary mt-1 max-w-3xl">{t.subtitle}</p>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          <Card>
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">{t.messageTitle}</p>
              <p className="text-lg text-text-secondary">{t.messageBody}</p>
            </div>
          </Card>

          <Card>
            <div>
              <p className="text-sm text-text-secondary mb-4">{t.actionsTitle}</p>
              <div className="flex flex-col md:flex-row gap-3">
                {actionLinks.map((action) => (
                  <Button
                    key={action.key}
                    onClick={handleNavigate(action.href)}
                    className="w-full md:w-auto"
                  >
                    {action.key === 'logWorkout'
                      ? language === 'fr'
                        ? 'Logger la séance'
                        : 'Log a workout'
                      : language === 'fr'
                        ? 'Faire le check-in hebdo'
                        : 'Do a weekly check-in'}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        </main>
      </div>
    </ClientLayout>
  );
}
