'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Home,
  Users,
  ClipboardList,
  MessageSquare,
  Settings,
  LogOut,
  Dumbbell,
  Calendar,
  TrendingUp,
  Menu,
  X,
  ClipboardCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/components/shared/LanguageProvider';
import { useUnits } from '@/components/shared/UnitProvider';
import { toast } from 'sonner';

interface SidebarProps {
  userType: 'coach' | 'client';
  userName: string;
  brandName?: string;
  brandLogoUrl?: string;
}

export default function Sidebar({
  userType,
  userName,
  brandName,
  brandLogoUrl,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const { language, setLanguage } = useLanguage();
  const { unit, setUnit } = useUnits();

  const copy = {
    fr: {
      coachLinks: [
        { href: '/coach/dashboard', label: 'Tableau de bord', icon: Home },
        { href: '/coach/clients', label: 'Clients', icon: Users },
        { href: '/coach/programs', label: 'Programmes', icon: ClipboardList },
        { href: '/coach/messages', label: 'Messages', icon: MessageSquare },
        { href: '/coach/settings', label: 'Parametres', icon: Settings },
      ],
      clientLinks: [
        { href: '/client/dashboard', label: 'Tableau de bord', icon: Home },
        { href: '/client/messages', label: 'Messages', icon: MessageSquare },
        { href: '/client/program', label: 'Mon programme', icon: Calendar },
        { href: '/client/log-workout', label: 'Seance', icon: Dumbbell },
        { href: '/client/checkin', label: 'Check-in', icon: ClipboardCheck },
        { href: '/client/progress', label: 'Progression', icon: TrendingUp },
        { href: '/client/settings', label: 'Parametres', icon: Settings },
      ],
      signOut: 'Deconnexion',
      signOutSuccess: 'Deconnecte avec succes',
      signOutFail: 'Impossible de se deconnecter',
      languageLabel: 'Langue',
      unitLabel: 'Unites',
      metric: 'Metrique',
      imperial: 'Imperial',
      toggleLanguage: 'FR',
      toggleUnits: 'Unites',
    },
    en: {
      coachLinks: [
        { href: '/coach/dashboard', label: 'Dashboard', icon: Home },
        { href: '/coach/clients', label: 'Clients', icon: Users },
        { href: '/coach/programs', label: 'Programs', icon: ClipboardList },
        { href: '/coach/messages', label: 'Messages', icon: MessageSquare },
        { href: '/coach/settings', label: 'Settings', icon: Settings },
      ],
      clientLinks: [
        { href: '/client/dashboard', label: 'Dashboard', icon: Home },
        { href: '/client/messages', label: 'Messages', icon: MessageSquare },
        { href: '/client/program', label: 'My program', icon: Calendar },
        { href: '/client/log-workout', label: 'Log workout', icon: Dumbbell },
        { href: '/client/checkin', label: 'Check-in', icon: ClipboardCheck },
        { href: '/client/progress', label: 'Progress', icon: TrendingUp },
        { href: '/client/settings', label: 'Settings', icon: Settings },
      ],
      signOut: 'Sign out',
      signOutSuccess: 'Signed out successfully',
      signOutFail: 'Failed to sign out',
      languageLabel: 'Language',
      unitLabel: 'Units',
      metric: 'Metric',
      imperial: 'Imperial',
      toggleLanguage: 'EN',
      toggleUnits: 'Units',
    },
  } as const;

  const t = copy[language];

  useEffect(() => {
    const saved = localStorage.getItem('sidebarExpanded');
    if (saved !== null) {
      setIsExpanded(saved === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('sidebarExpanded', String(newState));
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success(t.signOutSuccess);
      router.push('/auth/login');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error(t.signOutFail);
    }
  };

  const links = userType === 'coach' ? t.coachLinks : t.clientLinks;
  const displayBrand = brandName || 'Coach App';

  return (
    <div
      className={`min-h-screen bg-background-surface border-r border-border flex flex-col transition-all duration-300 ${
        isExpanded ? 'w-64' : 'w-20'
      }`}
    >
      <div className="p-4 border-b border-border flex items-center justify-between">
        {isExpanded ? (
          <>
            <div className="flex-1 flex items-center gap-3">
              {brandLogoUrl ? (
                <Image
                  src={brandLogoUrl}
                  alt={displayBrand}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-lg object-cover border border-border"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {displayBrand.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                  {displayBrand}
                </h1>
                <p className="text-xs text-text-tertiary mt-1 truncate">
                  {userName}
                </p>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-background-elevated rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </>
        ) : (
          <button
            onClick={toggleSidebar}
            className="w-full p-2 hover:bg-background-elevated rounded-lg transition-colors mx-auto"
          >
            <Menu className="w-6 h-6 text-primary mx-auto" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');

          return (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-background-elevated hover:text-text-primary'
              }`}
              title={!isExpanded ? link.label : undefined}
            >
              <Icon className={`w-5 h-5 ${isExpanded ? '' : 'mx-auto'}`} />
              {isExpanded && <span className="font-medium">{link.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-2">
        {isExpanded ? (
          <div className="rounded-lg border border-border bg-background-elevated/60 p-2">
            <p className="text-xs font-semibold text-text-tertiary mb-2">
              {t.languageLabel}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLanguage('fr')}
                className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold transition ${
                  language === 'fr'
                    ? 'bg-primary text-white'
                    : 'bg-background-surface text-text-secondary hover:text-text-primary'
                }`}
              >
                FR
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold transition ${
                  language === 'en'
                    ? 'bg-primary text-white'
                    : 'bg-background-surface text-text-secondary hover:text-text-primary'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
            className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-text-secondary hover:bg-background-elevated hover:text-text-primary transition-all duration-200"
            title={`${t.languageLabel}: ${language.toUpperCase()}`}
          >
            <span>{t.toggleLanguage}</span>
          </button>
        )}
        {isExpanded ? (
          <div className="rounded-lg border border-border bg-background-elevated/60 p-2">
            <p className="text-xs font-semibold text-text-tertiary mb-2">
              {t.unitLabel}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUnit('metric')}
                className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold transition ${
                  unit === 'metric'
                    ? 'bg-primary text-white'
                    : 'bg-background-surface text-text-secondary hover:text-text-primary'
                }`}
              >
                {t.metric}
              </button>
              <button
                type="button"
                onClick={() => setUnit('imperial')}
                className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold transition ${
                  unit === 'imperial'
                    ? 'bg-primary text-white'
                    : 'bg-background-surface text-text-secondary hover:text-text-primary'
                }`}
              >
                {t.imperial}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setUnit(unit === 'metric' ? 'imperial' : 'metric')}
            className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-text-secondary hover:bg-background-elevated hover:text-text-primary transition-all duration-200"
            title={`${t.unitLabel}: ${unit}`}
          >
            <span>{t.toggleUnits}</span>
          </button>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-text-secondary hover:bg-danger/10 hover:text-danger transition-all duration-200"
          title={!isExpanded ? t.signOut : undefined}
        >
          <LogOut className={`w-5 h-5 ${isExpanded ? '' : 'mx-auto'}`} />
          {isExpanded && <span className="font-medium">{t.signOut}</span>}
        </button>
      </div>
    </div>
  );
}
