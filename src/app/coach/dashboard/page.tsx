'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import CoachLayout from '@/components/layout/CoachLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useLanguage } from '@/components/shared/LanguageProvider';

const actionLinks = [
  { key: 'viewClients', href: '/coach/clients' },
  { key: 'viewPrograms', href: '/coach/programs' },
  { key: 'messages', href: '/coach/messages' },
];

export default function CoachDashboardPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = useMemo(
    () =>
      language === 'fr'
        ? {
            title: 'Tableau de bord',
            subtitle: 'Les statistiques sont temporairement désactivées.',
            statsHeading: 'Refonte en cours',
            statsMessage:
              "On reconstruit tout le suivi des entraînements, des clients et du code d'invitation." +
              ' On reviendra avec des filtres sur la période (journalière, hebdo, mensuelle ou annuelle).',
            statsFooter: 'Tu peux continuer de gérer les clients depuis les actions rapides ci-dessous.',
            actionsTitle: 'Actions rapides',
          }
        : {
            title: 'Dashboard',
            subtitle: 'Statistics are currently disabled.',
            statsHeading: 'Rebuild in progress',
            statsMessage:
              'We are rebuilding the coaching stats stack so you can pick custom time ranges (daily, weekly, monthly, yearly).',
            statsFooter:
              'Use the quick actions below to jump straight into client management, programs or messages.',
            actionsTitle: 'Quick actions',
          },
    [language]
  );

  const handleNavigate = (href: string) => () => router.push(href);

  return (
    <CoachLayout>
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
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">{t.statsHeading}</p>
              <h2 className="text-2xl font-bold">{t.statsMessage}</h2>
              <p className="text-text-secondary">{t.statsFooter}</p>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-text-secondary">{t.actionsTitle}</p>
                <h3 className="text-xl font-semibold">Reprends la main maintenant</h3>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {actionLinks.map((action) => (
                <Button
                  key={action.key}
                  className="w-full"
                  onClick={handleNavigate(action.href)}
                >
                  {action.key === 'viewClients'
                    ? language === 'fr'
                      ? 'Voir les clients'
                      : 'View clients'
                    : action.key === 'viewPrograms'
                      ? language === 'fr'
                        ? 'Programmes'
                        : 'Programs'
                      : language === 'fr'
                        ? 'Messages'
                        : 'Messages'}
                </Button>
              ))}
            </div>
          </Card>
        </main>
      </div>
    </CoachLayout>
  );
}
