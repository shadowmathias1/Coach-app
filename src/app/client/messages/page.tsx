"use client";

import ClientLayout from '@/components/layout/ClientLayout';
import ChatPage from '@/components/messages/ChatPage';

export default function ClientMessagesPage() {
  return (
    <ClientLayout>
      <ChatPage role="client" />
    </ClientLayout>
  );
}
