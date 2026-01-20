"use client";

import CoachLayout from '@/components/layout/CoachLayout';
import ChatPage from '@/components/messages/ChatPage';

export default function CoachMessagesPage() {
  return (
    <CoachLayout>
      <ChatPage role="coach" />
    </CoachLayout>
  );
}
