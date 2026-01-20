'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ClientLayout from '@/components/layout/ClientLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useLanguage } from '@/components/shared/LanguageProvider';

const actionLinks = [
  { key: 'logWorkout', href: '/client/log-workout' },
  { key: 'viewProgram', href: '/client/program' },
  { key: 'messages', href: '/client/messages' },
];

export default function ClientDashboardPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = useMemo(
    () =>
      language === 'fr'
        ? {
            title: 'Tableau de bord',
            subtitle: 'Les statistiques sont temporairement désactivées.',
            messageTitle: 'On reconstruit ton suivi',
            messageBody:
              'Les tableaux de progression, l’IMC et les graphiques des exercices seront refaits de zéro. On reviendra vite avec un choix clair sur la période (journalier, hebdo, mensuel, annuel ou depuis le début).',
            actionsTitle: 'Ce que tu peux encore faire',
          }
        : {
            title: 'Dashboard',
            subtitle: 'Statistics are temporarily disabled.',
            messageTitle: 'Rebuilding progress tracking',
            messageBody:
              'We are starting from scratch on the progress system, the BMI widgets and exercise graphs. They will come back with clearer filters (daily, weekly, monthly, yearly or all time).',
            actionsTitle: 'Still available right now',
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-text-secondary">{t.actionsTitle}</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {actionLinks.map((action) => (
                <Button
                  key={action.key}
                  className="w-full"
                  onClick={handleNavigate(action.href)}
                >
                  {action.key === 'logWorkout'
                    ? language === 'fr'
                      ? 'Logger la séance'
                      : 'Log workout'
                    : action.key === 'viewProgram'
                      ? language === 'fr'
                        ? 'Voir le programme'
                        : 'View program'
                      : language === 'fr'
                        ? 'Messages'
                        : 'Messages'}
                </Button>
              ))}
            </div>
          </Card>
        </main>
      </div>
    </ClientLayout>
  );
}
