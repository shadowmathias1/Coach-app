'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useLanguage } from '@/components/shared/LanguageProvider';

export default function SignOutButton() {
  const router = useRouter();
  const { language } = useLanguage();

  const copy = {
    fr: {
      label: 'Deconnexion',
      success: 'Deconnecte avec succes',
      fail: 'Impossible de se deconnecter',
    },
    en: {
      label: 'Sign out',
      success: 'Signed out successfully',
      fail: 'Failed to sign out',
    },
  } as const;

  const t = copy[language];

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success(t.success);
      router.push('/auth/login');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error(t.fail);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background-elevated hover:bg-background-surface border border-border text-text-secondary hover:text-text-primary transition-all duration-200"
    >
      <LogOut className="w-4 h-4" />
      <span className="text-sm font-medium">{t.label}</span>
    </button>
  );
}
