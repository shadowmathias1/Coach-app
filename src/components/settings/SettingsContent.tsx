'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Bell,
  Check,
  KeyRound,
  Laptop,
  Moon,
  Palette,
  RefreshCw,
  Shield,
  Sun,
  Trash2,
  User,
  UserCog,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { getCurrentUser, supabase } from '@/lib/supabase';
import { ThemePreference, useTheme } from '@/components/shared/ThemeProvider';
import { useLanguage } from '@/components/shared/LanguageProvider';
import { useUnits } from '@/components/shared/UnitProvider';
import { cmToIn, formatHeight, formatWeight, inToCm, kgToLb, lbToKg } from '@/lib/units';
import { verifyInviteCode } from '@/lib/auth';
import { toast } from 'sonner';

interface SettingsContentProps {
  role: 'coach' | 'client';
}

interface AccountProfile {
  name: string;
  email: string;
  role: 'coach' | 'client';
  displayName?: string | null;
  brandName?: string | null;
  timezone?: string | null;
  inviteCode?: string | null;
  age?: number | null;
  height?: number | null;
  weight?: number | null;
  goal?: string | null;
  injuries?: string | null;
}

interface NotificationSettings {
  newClient: boolean;
  checkinReminders: boolean;
  weeklySummary: boolean;
}

interface BrandingSettings {
  brandName: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
}

const defaultNotifications: NotificationSettings = {
  newClient: true,
  checkinReminders: true,
  weeklySummary: false,
};

const defaultBranding: BrandingSettings = {
  brandName: '',
  logoUrl: '',
  primaryColor: '#3b82f6',
  accentColor: '#22c55e',
};

const fallbackTimezones = [
  'Europe/Paris',
  'Europe/London',
  'Europe/Brussels',
  'Europe/Zurich',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Europe/Lisbon',
  'Europe/Stockholm',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Hong_Kong',
  'Australia/Sydney',
  'Pacific/Auckland',
];


export default function SettingsContent({ role }: SettingsContentProps) {
  const router = useRouter();
  const { preference, setPreference, resolvedMode } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { unit, setUnit } = useUnits();
  const t = language === 'en'
    ? {
        unitsTitle: 'Units',
        unitsDescription: 'Choose metric or imperial',
        languageTitle: 'Language',
        languageDescription: 'Choose your language',
        metric: 'Metric',
        imperial: 'Imperial',
        french: 'French',
        english: 'English',
        heightLabel: 'Height',
        weightLabel: 'Weight',
        heightUnitMetric: 'cm',
        heightUnitImperial: 'in',
        weightUnitMetric: 'kg',
        weightUnitImperial: 'lb',
        settingsTitle: 'Settings',
        settingsSubtitle: 'Manage your account and customize your experience',
        selected: 'Selected',
        themeTitle: 'App theme',
        themeSubtitle: 'Choose a light or dark look',
        personalizationTitle: 'Personalization',
        personalizationSubtitle: 'Theme, ambiance, and preferences',
        timezonePlaceholder: 'Select a timezone',
      }
    : {
        unitsTitle: 'Unites',
        unitsDescription: 'Choisis metric ou imperial',
        languageTitle: 'Langue',
        languageDescription: 'Choisis ta langue',
        metric: 'Metrique',
        imperial: 'Imperial',
        french: 'Francais',
        english: 'Anglais',
        heightLabel: 'Taille',
        weightLabel: 'Poids',
        heightUnitMetric: 'cm',
        heightUnitImperial: 'in',
        weightUnitMetric: 'kg',
        weightUnitImperial: 'lb',
        settingsTitle: 'Parametres',
        settingsSubtitle: 'Gere ton compte et personnalise ton experience',
        selected: 'Selectionne',
        themeTitle: 'Theme de l application',
        themeSubtitle: 'Choisis une ambiance claire ou sombre',
        personalizationTitle: 'Personnalisation',
        personalizationSubtitle: 'Theme, ambiance, et preferences',
        timezonePlaceholder: 'Selectionner un fuseau',
      };
  const themeOptions: Array<{
    id: ThemePreference;
    label: string;
    description: string;
    icon: typeof Sun;
  }> = language === 'en'
    ? [
        { id: 'light', label: 'Light', description: 'Bright interface', icon: Sun },
        { id: 'dark', label: 'Dark', description: 'Comfortable contrast', icon: Moon },
        { id: 'system', label: 'System', description: 'Match your device', icon: Laptop },
      ]
    : [
        { id: 'light', label: 'Clair', description: 'Interface lumineuse', icon: Sun },
        { id: 'dark', label: 'Sombre', description: 'Contraste confortable', icon: Moon },
        { id: 'system', label: 'Systeme', description: 'Suit ton appareil', icon: Laptop },
      ];

  const preferenceLabels: Record<ThemePreference, string> = language === 'en'
    ? {
        light: 'Light',
        dark: 'Dark',
        system: 'Auto',
      }
    : {
        light: 'Clair',
        dark: 'Sombre',
        system: 'Auto',
      };
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [inviteRegenerating, setInviteRegenerating] = useState(false);
  const [notifications, setNotifications] = useState<NotificationSettings>(
    defaultNotifications
  );
  const [notificationsSaving, setNotificationsSaving] = useState(false);
  const [branding, setBranding] = useState<BrandingSettings>(defaultBranding);
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingFile, setBrandingFile] = useState<File | null>(null);
  const [coachChangeCode, setCoachChangeCode] = useState('');
  const [coachChanging, setCoachChanging] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    timezone: '',
    brandName: '',
    age: '',
    height: '',
    weight: '',
    goal: '',
    injuries: '',
  });

  const loadProfile = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      const metadataNotifications =
        (user.user_metadata?.notifications as NotificationSettings | undefined) ||
        defaultNotifications;
      setNotifications({
        newClient: Boolean(metadataNotifications.newClient),
        checkinReminders: Boolean(metadataNotifications.checkinReminders),
        weeklySummary: Boolean(metadataNotifications.weeklySummary),
      });

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name, role')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      const baseProfile: AccountProfile = {
        name: userData?.name || 'User',
        email: user.email || '',
        role: (userData?.role || role) as 'coach' | 'client',
      };

      if (role === 'coach') {
        const { data: coachData } = await supabase
          .from('coaches')
          .select('brand_name, invite_code, timezone')
          .eq('id', user.id)
          .maybeSingle();

        setProfile({
          ...baseProfile,
          brandName: coachData?.brand_name ?? null,
          inviteCode: coachData?.invite_code ?? null,
          timezone: coachData?.timezone ?? null,
        });

        const fallbackBrandName = coachData?.brand_name ?? '';
        const { data: brandingData } = await supabase
          .from('coach_branding')
          .select('brand_name, logo_url, primary_color, accent_color')
          .eq('coach_id', user.id)
          .maybeSingle();
        setBranding({
          brandName: brandingData?.brand_name || fallbackBrandName,
          logoUrl: brandingData?.logo_url || '',
          primaryColor:
            brandingData?.primary_color || defaultBranding.primaryColor,
          accentColor: brandingData?.accent_color || defaultBranding.accentColor,
        });
      } else {
        const { data: clientData } = await supabase
          .from('clients')
          .select('display_name, age, height, weight, goal, injuries')
          .eq('id', user.id)
          .maybeSingle();

        setProfile({
          ...baseProfile,
          displayName: clientData?.display_name ?? null,
          age: clientData?.age ?? null,
          height: clientData?.height ?? null,
          weight: clientData?.weight ?? null,
          goal: clientData?.goal ?? null,
          injuries: clientData?.injuries ?? null,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }, [role, router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!profile) return;
    setProfileForm({
      name: profile.name || '',
      email: profile.email || '',
      timezone: profile.timezone || '',
      brandName: profile.brandName || '',
      age: profile.age !== null && profile.age !== undefined ? String(profile.age) : '',
      height:
        profile.height !== null && profile.height !== undefined
          ? String(profile.height)
          : '',
      weight:
        profile.weight !== null && profile.weight !== undefined
          ? String(profile.weight)
          : '',
      goal: profile.goal || '',
      injuries: profile.injuries || '',
    });
  }, [profile]);

  const profileRows = useMemo(() => {
    if (!profile) return [];
    const rows = [
      { label: 'Nom complet', value: profile.name },
      { label: 'Email', value: profile.email },
      { label: 'Role', value: profile.role === 'coach' ? 'Coach' : 'Client' },
    ];

    if (role === 'coach') {
      rows.push({
        label: 'Nom de marque',
        value: profile.brandName || 'Non defini',
      });
      rows.push({
        label: 'Code invitation',
        value: profile.inviteCode || 'Non defini',
      });
      rows.push({
        label: 'Fuseau horaire',
        value: profile.timezone || 'Non defini',
      });
    } else {
      if (profile.displayName) {
        rows.push({ label: 'Nom affiche', value: profile.displayName });
      }
      if (profile.age) {
        rows.push({ label: 'Age', value: String(profile.age) });
      }
      if (profile.height) {
        rows.push({
          label: t.heightLabel,
          value: formatHeight(profile.height, unit),
        });
      }
      if (profile.weight) {
        rows.push({
          label: t.weightLabel,
          value: formatWeight(profile.weight, unit),
        });
      }
      if (profile.goal) {
        rows.push({ label: 'Objectif', value: profile.goal });
      }
      if (profile.injuries) {
        rows.push({ label: 'Blessures', value: profile.injuries });
      }
    }

    return rows;
  }, [profile, role, t.heightLabel, t.weightLabel, unit]);

  const parseNumberField = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const getHeightParts = () => {
    if (!profileForm.height) return { feet: '', inches: '' };
    const totalInches = cmToIn(Number(profileForm.height));
    let feet = Math.floor(totalInches / 12);
    let inches = Math.round(totalInches - feet * 12);
    if (inches === 12) {
      feet += 1;
      inches = 0;
    }
    return { feet: String(feet), inches: String(inches) };
  };

  const handleHeightFeetChange = (value: string) => {
    const feet = Number(value || 0);
    const { inches } = getHeightParts();
    const inchesValue = Number(inches || 0);
    const totalInches = feet * 12 + inchesValue;
    const heightCm = Number.isFinite(totalInches) ? inToCm(totalInches) : 0;
    setProfileForm((prev) => ({
      ...prev,
      height: totalInches ? String(Math.round(heightCm)) : '',
    }));
  };

  const handleHeightInchesChange = (value: string) => {
    const { feet } = getHeightParts();
    const feetValue = Number(feet || 0);
    const inchesValue = Number(value || 0);
    const totalInches = feetValue * 12 + inchesValue;
    const heightCm = Number.isFinite(totalInches) ? inToCm(totalInches) : 0;
    setProfileForm((prev) => ({
      ...prev,
      height: totalInches ? String(Math.round(heightCm)) : '',
    }));
  };

  const handleWeightChange = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setProfileForm((prev) => ({ ...prev, weight: '' }));
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      setProfileForm((prev) => ({ ...prev, weight: '' }));
      return;
    }
    const weightKg = unit === 'imperial' ? lbToKg(parsed) : parsed;
    setProfileForm((prev) => ({
      ...prev,
      weight: weightKg ? String(Math.round(weightKg)) : '',
    }));
  };

  const handleProfileUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;
    const name = profileForm.name.trim();
    const email = profileForm.email.trim();

    if (!name || !email) {
      toast.error('Nom et email sont requis.');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Email invalide.');
      return;
    }

    setProfileSaving(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      if (email !== profile.email) {
        const { error: authError } = await supabase.auth.updateUser({ email });
        if (authError) throw authError;
        toast.success('Un email de confirmation a ete envoye.');
      }

      const { error: userError } = await supabase
        .from('users')
        .update({ name, email })
        .eq('id', user.id);

      if (userError) throw userError;

      if (role === 'coach') {
        const { error: coachError } = await supabase
          .from('coaches')
          .update({
            brand_name: profileForm.brandName.trim() || null,
            timezone: profileForm.timezone.trim() || null,
          })
          .eq('id', user.id);
        if (coachError) throw coachError;
      } else {
        const { error: clientError } = await supabase
          .from('clients')
          .update({
            display_name: name,
            age: parseNumberField(profileForm.age),
            height: parseNumberField(profileForm.height),
            weight: parseNumberField(profileForm.weight),
            goal: profileForm.goal.trim() || null,
            injuries: profileForm.injuries.trim() || null,
          })
          .eq('id', user.id);
        if (clientError) throw clientError;
      }

      await loadProfile();
      toast.success('Profil mis a jour.');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Impossible de mettre a jour le profil.');
    } finally {
      setProfileSaving(false);
    }
  };

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i += 1) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  };

  const handleRegenerateInviteCode = async () => {
    setInviteRegenerating(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      let nextCode = '';
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const candidate = generateInviteCode();
        const { data: existing } = await supabase
          .from('coaches')
          .select('id')
          .eq('invite_code', candidate)
          .maybeSingle();
        if (!existing) {
          nextCode = candidate;
          break;
        }
      }

      if (!nextCode) {
        toast.error('Impossible de generer un code unique.');
        return;
      }

      const { error } = await supabase
        .from('coaches')
        .update({ invite_code: nextCode })
        .eq('id', user.id);
      if (error) throw error;

      setProfile((prev) =>
        prev ? { ...prev, inviteCode: nextCode } : prev
      );
      toast.success('Nouveau code genere.');
    } catch (error) {
      console.error('Error regenerating invite code:', error);
      toast.error('Impossible de regenerer le code.');
    } finally {
      setInviteRegenerating(false);
    }
  };

  const handleNotificationsSave = async () => {
    setNotificationsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { notifications },
      });
      if (error) throw error;
      toast.success('Preferences enregistrees.');
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast.error('Impossible de sauvegarder les notifications.');
    } finally {
      setNotificationsSaving(false);
    }
  };

  const handleBrandingSave = async () => {
    if (role !== 'coach') return;
    setBrandingSaving(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      let logoUrl = branding.logoUrl;
      if (brandingFile) {
        const fileExt = brandingFile.name.split('.').pop() || 'png';
        const filePath = `logos/${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('branding-assets')
          .upload(filePath, brandingFile, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('branding-assets')
          .getPublicUrl(filePath);
        logoUrl = publicUrlData.publicUrl;
      }

      const { error } = await supabase
        .from('coach_branding')
        .upsert(
          {
            coach_id: user.id,
            brand_name: branding.brandName.trim() || null,
            logo_url: logoUrl || null,
            primary_color: branding.primaryColor || null,
            accent_color: branding.accentColor || null,
          },
          { onConflict: 'coach_id' }
        );
      if (error) throw error;

      setBranding((prev) => ({ ...prev, logoUrl }));
      setBrandingFile(null);
      toast.success('Branding mis a jour.');
    } catch (error) {
      console.error('Error saving branding:', error);
      toast.error('Impossible de sauvegarder le branding.');
    } finally {
      setBrandingSaving(false);
    }
  };

  const handleCoachChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = coachChangeCode.trim().toUpperCase();
    if (code.length !== 8) {
      toast.error('Le code doit faire 8 caracteres.');
      return;
    }

    setCoachChanging(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const coach = await verifyInviteCode(code);
      if (!coach) {
        toast.error('Code invalide.');
        return;
      }

      const { error } = await supabase
        .from('clients')
        .update({ coach_id: coach.id })
        .eq('id', user.id);

      if (error) throw error;
      setCoachChangeCode('');
      toast.success('Coach mis a jour.');
    } catch (error) {
      console.error('Error changing coach:', error);
      toast.error('Impossible de changer de coach.');
    } finally {
      setCoachChanging(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile) return;
    const confirmDelete = window.confirm(
      'Cette action est irreversible. Souhaites-tu continuer ?'
    );
    if (!confirmDelete) return;

    const confirmText = window.prompt(
      'Tape SUPPRIMER pour confirmer la suppression.'
    );
    if (confirmText !== 'SUPPRIMER') {
      toast.error('Confirmation incorrecte.');
      return;
    }

    setDeleteLoading(true);
    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        toast.error('Session invalide.');
        return;
      }

      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        toast.error(payload?.error || 'Suppression impossible.');
        return;
      }

      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Impossible de supprimer le compte.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const profileEditFields = useMemo(() => {
    if (role === 'coach') {
      return ['Nom', 'Email', 'Fuseau horaire', 'Nom de marque'];
    }
    return ['Nom', 'Email', 'Age', 'Taille', 'Poids', 'Objectif', 'Blessures'];
  }, [role]);

  const timezones = useMemo(() => {
    const intlWithZones = Intl as unknown as {
      supportedValuesOf?: (key: string) => string[];
    };
    if (typeof intlWithZones.supportedValuesOf === 'function') {
      return intlWithZones.supportedValuesOf('timeZone');
    }
    return fallbackTimezones;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background-surface border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{t.settingsTitle}</h1>
              <p className="text-text-secondary mt-1">
                {t.settingsSubtitle}
              </p>
            </div>
            <Badge variant="info">{resolvedMode === 'dark' ? 'Sombre' : 'Clair'}</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Compte</h2>
              <p className="text-sm text-text-tertiary">
                Infos essentielles et securite
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-l-4 border-l-primary/40">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Profil</h3>
                  <p className="text-sm text-text-tertiary">
                    Donnees principales du compte
                  </p>
                </div>
                <Badge variant="success">Actif</Badge>
              </div>

              {loading ? (
                <div className="space-y-3">
                  <div className="h-4 w-2/3 rounded bg-background-elevated/60 animate-pulse" />
                  <div className="h-4 w-1/2 rounded bg-background-elevated/60 animate-pulse" />
                  <div className="h-4 w-3/4 rounded bg-background-elevated/60 animate-pulse" />
                </div>
              ) : (
                <div className="space-y-3">
                  {profileRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-4 text-sm"
                    >
                      <span className="text-text-tertiary">{row.label}</span>
                      <span className="font-medium text-text-primary">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="border-l-4 border-l-secondary/40">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Securite</h3>
                  <p className="text-sm text-text-tertiary">
                    Mot de passe et acces
                  </p>
                </div>
                <Shield className="w-5 h-5 text-secondary" />
              </div>
              <div className="space-y-3 text-sm text-text-secondary">
                <p>
                  Derniere verification: automatique a la connexion.
                </p>
                <Button variant="secondary" disabled>
                  Changer le mot de passe
                </Button>
              </div>
            </Card>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <UserCog className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Gestion du compte</h2>
              <p className="text-sm text-text-tertiary">
                Actions rapides et parametres avances
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-l-4 border-l-secondary/40">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Modifier le profil</h3>
                  <p className="text-sm text-text-tertiary">
                    Mets a jour tes informations principales
                  </p>
                </div>
                <Badge variant="success">Actif</Badge>
              </div>
              {loading ? (
                <div className="space-y-3">
                  <div className="h-10 rounded bg-background-elevated/60 animate-pulse" />
                  <div className="h-10 rounded bg-background-elevated/60 animate-pulse" />
                  <div className="h-10 rounded bg-background-elevated/60 animate-pulse" />
                </div>
              ) : (
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
                    {profileEditFields.map((field) => (
                      <span
                        key={field}
                        className="px-2 py-1 rounded-full bg-background-elevated/60"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nom"
                      value={profileForm.name}
                      onChange={(event) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Ton nom complet"
                      required
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={profileForm.email}
                      onChange={(event) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                      placeholder="ton@email.com"
                      required
                    />
                    {role === 'coach' ? (
                      <>
                        <div className="w-full">
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            Fuseau horaire
                          </label>
                          <select
                            className="input"
                            value={profileForm.timezone}
                            onChange={(event) =>
                              setProfileForm((prev) => ({
                                ...prev,
                                timezone: event.target.value,
                              }))
                            }
                          >
                            <option value="">{t.timezonePlaceholder}</option>
                            {timezones.map((timezone) => (
                              <option key={timezone} value={timezone}>
                                {timezone}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Input
                          label="Nom de marque"
                          value={profileForm.brandName}
                          onChange={(event) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              brandName: event.target.value,
                            }))
                          }
                          placeholder="Studio, team, ou label"
                        />
                      </>
                    ) : (
                      <>
                        <Input
                          label="Age"
                          type="number"
                          value={profileForm.age}
                          onChange={(event) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              age: event.target.value,
                            }))
                          }
                          placeholder="30"
                        />
                        {unit === 'imperial' ? (
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              label={`${t.heightLabel} (ft)`}
                              type="number"
                              value={getHeightParts().feet}
                              onChange={(event) =>
                                handleHeightFeetChange(event.target.value)
                              }
                              placeholder="5"
                            />
                            <Input
                              label={`${t.heightLabel} (in)`}
                              type="number"
                              value={getHeightParts().inches}
                              onChange={(event) =>
                                handleHeightInchesChange(event.target.value)
                              }
                              placeholder="11"
                            />
                          </div>
                        ) : (
                          <Input
                            label={`${t.heightLabel} (${t.heightUnitMetric})`}
                            type="number"
                            value={profileForm.height}
                            onChange={(event) =>
                              setProfileForm((prev) => ({
                                ...prev,
                                height: event.target.value,
                              }))
                            }
                            placeholder="175"
                          />
                        )}
                        <Input
                          label={`${t.weightLabel} (${unit === 'imperial' ? t.weightUnitImperial : t.weightUnitMetric})`}
                          type="number"
                          value={
                            unit === 'imperial' && profileForm.weight
                              ? String(Math.round(kgToLb(Number(profileForm.weight))))
                              : profileForm.weight
                          }
                          onChange={(event) => handleWeightChange(event.target.value)}
                          placeholder={unit === 'imperial' ? '170' : '75'}
                        />
                      </>
                    )}
                  </div>
                  {role === 'client' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Objectif
                        </label>
                        <textarea
                          className="input min-h-[110px]"
                          value={profileForm.goal}
                          onChange={(event) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              goal: event.target.value,
                            }))
                          }
                          placeholder="Ex: prendre du muscle, perdre 5kg..."
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Blessures
                        </label>
                        <textarea
                          className="input min-h-[110px]"
                          value={profileForm.injuries}
                          onChange={(event) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              injuries: event.target.value,
                            }))
                          }
                          placeholder="Ex: genou droit, epaules sensibles"
                        />
                      </div>
                    </div>
                  )}
                  <Button
                    variant="secondary"
                    type="submit"
                    loading={profileSaving}
                    disabled={profileSaving}
                  >
                    Mettre a jour le profil
                  </Button>
                </form>
              )}
            </Card>

            {role === 'coach' ? (
              <Card className="border-l-4 border-l-primary/40">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Code d&apos;invitation</h3>
                    <p className="text-sm text-text-tertiary">
                      Un code unique pour les nouveaux clients
                    </p>
                  </div>
                  <KeyRound className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-3 text-sm text-text-secondary">
                  <p>
                    Code actuel: <span className="font-medium">{profile?.inviteCode || 'Non defini'}</span>
                  </p>
                  <Button
                    variant="secondary"
                    loading={inviteRegenerating}
                    disabled={inviteRegenerating}
                    onClick={handleRegenerateInviteCode}
                  >
                    Regenerer le code
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="border-l-4 border-l-primary/40">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Changer de coach</h3>
                    <p className="text-sm text-text-tertiary">
                      Renseigne un nouveau code d&apos;invitation
                    </p>
                  </div>
                  <RefreshCw className="w-5 h-5 text-primary" />
                </div>
                <form onSubmit={handleCoachChange} className="space-y-4">
                  <Input
                    label="Code d'invitation"
                    value={coachChangeCode}
                    onChange={(event) =>
                      setCoachChangeCode(event.target.value.toUpperCase())
                    }
                    placeholder="EX: 8H2K9P4Z"
                    maxLength={8}
                    helperText="Le code fait 8 caracteres."
                  />
                  <Button
                    variant="secondary"
                    type="submit"
                    loading={coachChanging}
                    disabled={coachChanging}
                  >
                    Changer de coach
                  </Button>
                </form>
              </Card>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {role === 'coach' && (
              <Card className="border-l-4 border-l-warning/40">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Notifications</h3>
                    <p className="text-sm text-text-tertiary">
                      Choisis ce que tu veux recevoir
                    </p>
                  </div>
                  <Bell className="w-5 h-5 text-warning" />
                </div>
                <div className="space-y-4 text-sm text-text-secondary">
                  <label className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-text-primary">Nouveaux clients</p>
                      <p className="text-xs text-text-tertiary">
                        Alerte quand un client rejoint.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-warning"
                      checked={notifications.newClient}
                      onChange={(event) =>
                        setNotifications((prev) => ({
                          ...prev,
                          newClient: event.target.checked,
                        }))
                      }
                    />
                  </label>
                  <label className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-text-primary">Rappels check-in</p>
                      <p className="text-xs text-text-tertiary">
                        Relances pour les check-ins en retard.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-warning"
                      checked={notifications.checkinReminders}
                      onChange={(event) =>
                        setNotifications((prev) => ({
                          ...prev,
                          checkinReminders: event.target.checked,
                        }))
                      }
                    />
                  </label>
                  <label className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-text-primary">Resume hebdo</p>
                      <p className="text-xs text-text-tertiary">
                        Bilan hebdomadaire de l activite.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-warning"
                      checked={notifications.weeklySummary}
                      onChange={(event) =>
                        setNotifications((prev) => ({
                          ...prev,
                          weeklySummary: event.target.checked,
                        }))
                      }
                    />
                  </label>
                  <Button
                    variant="secondary"
                    loading={notificationsSaving}
                    disabled={notificationsSaving}
                    onClick={handleNotificationsSave}
                  >
                    Enregistrer les preferences
                  </Button>
                </div>
              </Card>
            )}

            {role === 'coach' && (
              <Card className="border-l-4 border-l-primary/40">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Branding</h3>
                    <p className="text-sm text-text-tertiary">
                      Logo et couleurs visibles par tes clients
                    </p>
                  </div>
                  <Badge variant="info">Pro</Badge>
                </div>
                <div className="space-y-4">
                  <Input
                    label="Nom de marque"
                    value={branding.brandName}
                    onChange={(event) =>
                      setBranding((prev) => ({
                        ...prev,
                        brandName: event.target.value,
                      }))
                    }
                    placeholder="Ex: Studio Atlas"
                  />
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Logo
                    </label>
                    <div className="flex items-center gap-3">
                      {branding.logoUrl ? (
                        <Image
                          src={branding.logoUrl}
                          alt={branding.brandName || 'Logo'}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-lg object-cover border border-border"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-background-elevated flex items-center justify-center text-text-tertiary">
                          N/A
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          setBrandingFile(event.target.files?.[0] || null)
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Couleur principale
                      </label>
                      <input
                        type="color"
                        value={branding.primaryColor}
                        onChange={(event) =>
                          setBranding((prev) => ({
                            ...prev,
                            primaryColor: event.target.value,
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-border bg-background-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Couleur accent
                      </label>
                      <input
                        type="color"
                        value={branding.accentColor}
                        onChange={(event) =>
                          setBranding((prev) => ({
                            ...prev,
                            accentColor: event.target.value,
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-border bg-background-surface"
                      />
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    loading={brandingSaving}
                    disabled={brandingSaving}
                    onClick={handleBrandingSave}
                  >
                    Sauvegarder le branding
                  </Button>
                </div>
              </Card>
            )}

            <Card className="border-l-4 border-l-danger/40">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Supprimer le compte</h3>
                  <p className="text-sm text-text-tertiary">
                    Cette action est irreversible
                  </p>
                </div>
                <Trash2 className="w-5 h-5 text-danger" />
              </div>
              <div className="space-y-3 text-sm text-text-secondary">
                <p>Suppression du profil et des donnees associees.</p>
                <Button
                  variant="danger"
                  loading={deleteLoading}
                  disabled={deleteLoading}
                  onClick={handleDeleteAccount}
                >
                  Supprimer definitivement
                </Button>
              </div>
            </Card>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-success" />
            </div>
            <div>
            <h2 className="text-xl font-semibold">{t.personalizationTitle}</h2>
            <p className="text-sm text-text-tertiary">
              {t.personalizationSubtitle}
            </p>
            </div>
          </div>

          <Card className="border-l-4 border-l-success/40">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{t.themeTitle}</h3>
                <p className="text-sm text-text-tertiary">
                  {t.themeSubtitle}
                </p>
              </div>
              <Badge variant="info" className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                {preferenceLabels[preference]}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isActive = preference === option.id;
                return (
                  <motion.button
                    key={option.id}
                    type="button"
                    onClick={() => setPreference(option.id)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`text-left rounded-xl border px-4 py-4 transition-all duration-200 ${
                      isActive
                        ? 'border-success/60 bg-success/10 shadow-glow-sm'
                        : 'border-border bg-background-elevated/50 hover:border-success/40 hover:bg-background-surface'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          isActive ? 'bg-success/20' : 'bg-background-surface'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? 'text-success' : 'text-text-secondary'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-semibold">{option.label}</p>
                        <p className="text-xs text-text-tertiary">
                          {option.description}
                        </p>
                      </div>
                    </div>
                    {isActive && (
                      <p className="text-xs text-success flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        {t.selected}
                      </p>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </Card>
          <Card className="border-l-4 border-l-primary/40">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{t.languageTitle}</h3>
                <p className="text-sm text-text-tertiary">
                  {t.languageDescription}
                </p>
              </div>
              <Badge variant="info">UI</Badge>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant={language === 'fr' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setLanguage('fr')}
              >
                FR {t.french}
              </Button>
              <Button
                variant={language === 'en' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setLanguage('en')}
              >
                EN {t.english}
              </Button>
            </div>
          </Card>
          <Card className="border-l-4 border-l-secondary/40">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{t.unitsTitle}</h3>
                <p className="text-sm text-text-tertiary">
                  {t.unitsDescription}
                </p>
              </div>
              <Badge variant="default">KG/LB</Badge>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant={unit === 'metric' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setUnit('metric')}
              >
                {t.metric}
              </Button>
              <Button
                variant={unit === 'imperial' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setUnit('imperial')}
              >
                {t.imperial}
              </Button>
            </div>
          </Card>
        </motion.section>
      </main>
    </div>
  );
}


