'use client';

import CoachLayout from '@/components/layout/CoachLayout';
import SettingsContent from '@/components/settings/SettingsContent';

export default function CoachSettingsPage() {
  return (
    <CoachLayout>
      <SettingsContent role="coach" />
    </CoachLayout>
  );
}
