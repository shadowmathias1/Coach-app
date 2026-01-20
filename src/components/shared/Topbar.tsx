'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import Button from '@/components/ui/Button';
import { signOut } from '@/lib/auth';
import { toast } from 'sonner';
import { useLanguage } from '@/components/shared/LanguageProvider';

interface TopbarProps {
  userName?: string;
  userRole?: 'coach' | 'client';
}

export default function Topbar({ userName, userRole }: TopbarProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();

  const copy = {
    fr: {
      coachTitle: 'Tableau de bord coach',
      clientTitle: 'Mon suivi',
      signOut: 'Deconnexion',
      signOutSuccess: 'Deconnecte avec succes',
      signOutFail: 'Impossible de se deconnecter',
      coachRole: 'Coach',
      clientRole: 'Client',
    },
    en: {
      coachTitle: 'Coach dashboard',
      clientTitle: 'My training',
      signOut: 'Sign out',
      signOutSuccess: 'Signed out successfully',
      signOutFail: 'Failed to sign out',
      coachRole: 'Coach',
      clientRole: 'Client',
    },
  } as const;

  const t = copy[language];

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
      toast.success(t.signOutSuccess);
      router.push('/auth/login');
    } catch (error) {
      toast.error(t.signOutFail);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-background-surface/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-text-primary">
            {userRole === 'coach' ? t.coachTitle : t.clientTitle}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {userName && (
            <div className="flex items-center gap-3 px-4 py-2 bg-background-elevated rounded-lg border border-border">
              <User className="w-4 h-4 text-text-tertiary" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-text-primary">
                  {userName}
                </span>
                <span className="text-xs text-text-tertiary capitalize">
                  {userRole === 'coach' ? t.coachRole : t.clientRole}
                </span>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            loading={loading}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{t.signOut}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
