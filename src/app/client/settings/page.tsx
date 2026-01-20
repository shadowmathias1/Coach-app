'use client';

import ClientLayout from '@/components/layout/ClientLayout';
import SettingsContent from '@/components/settings/SettingsContent';

export default function ClientSettingsPage() {
  return (
    <ClientLayout>
      <SettingsContent role="client" />
    </ClientLayout>
  );
}
