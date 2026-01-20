'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { UserPlus, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { signUp, verifyInviteCode } from '@/lib/auth';
import { toast } from 'sonner';
import { useLanguage } from '@/components/shared/LanguageProvider';

export default function JoinCoachPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [step, setStep] = useState<'code' | 'details'>('code');
  const [coachInfo, setCoachInfo] = useState<{ id: string; brand_name: string | null } | null>(null);
  const [formData, setFormData] = useState({
    inviteCode: '',
    name: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const copy = {
    fr: {
      title: 'Coach App',
      joinCoach: 'Rejoins ton coach',
      enterCodeTitle: 'Entre ton code invitation',
      enterCodeBody: 'Ton coach t a donne un code a 8 caracteres',
      inviteCode: "Code d'invitation",
      verifyCode: 'Verifier le code',
      validCode: 'Code valide !',
      coachLabel: 'Coach',
      backRegister: "Retour a l'inscription",
      completeProfile: 'Complete ton profil',
      joiningCoach: 'Coach choisi',
      fullName: 'Nom complet',
      email: 'Email',
      password: 'Mot de passe',
      passwordHelp: 'Minimum 6 caracteres',
      createAccount: 'Creer le compte',
      changeCode: 'Changer de code',
      alreadyAccount: 'Tu as deja un compte ?',
      signIn: 'Se connecter',
      requiredCode: 'Entre un code invitation',
      invalidCode: 'Code invalide',
      requiredName: 'Nom requis',
      requiredEmail: 'Email requis',
      requiredPassword: 'Mot de passe requis',
      shortPassword: 'Mot de passe: 6 caracteres minimum',
      accountCreated: 'Compte cree avec succes !',
      confirmEmail: 'Compte cree. Verifie ton email pour confirmer.',
      accountFailed: 'Impossible de creer le compte',
      yourCoach: 'Ton coach',
    },
    en: {
      title: 'Coach App',
      joinCoach: 'Join your coach',
      enterCodeTitle: 'Enter your invite code',
      enterCodeBody: 'Your coach should have provided an 8-character code',
      inviteCode: 'Invite code',
      verifyCode: 'Verify code',
      validCode: 'Valid code!',
      coachLabel: 'Coach',
      backRegister: 'Back to registration',
      completeProfile: 'Complete your profile',
      joiningCoach: 'Joining coach',
      fullName: 'Full name',
      email: 'Email',
      password: 'Password',
      passwordHelp: 'Minimum 6 characters',
      createAccount: 'Create account',
      changeCode: 'Change invite code',
      alreadyAccount: 'Already have an account?',
      signIn: 'Sign in',
      requiredCode: 'Please enter an invite code',
      invalidCode: 'Invalid invite code',
      requiredName: 'Name is required',
      requiredEmail: 'Email is required',
      requiredPassword: 'Password is required',
      shortPassword: 'Password must be at least 6 characters',
      accountCreated: 'Account created successfully!',
      confirmEmail: 'Account created. Check your email to confirm.',
      accountFailed: 'Failed to create account',
      yourCoach: 'Your coach',
    },
  } as const;

  const t = copy[language];

  const handleVerifyCode = async () => {
    if (!formData.inviteCode) {
      setErrors({ inviteCode: t.requiredCode });
      return;
    }

    try {
      setVerifying(true);
      const coach = await verifyInviteCode(formData.inviteCode);

      if (!coach) {
        setErrors({ inviteCode: t.invalidCode });
        return;
      }

      setCoachInfo(coach);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          'invite_code',
          formData.inviteCode.toUpperCase()
        );
      }
      setErrors({});
      setTimeout(() => setStep('details'), 300);
    } catch (error: any) {
      setErrors({ inviteCode: t.invalidCode });
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = t.requiredName;
    if (!formData.email) newErrors.email = t.requiredEmail;
    if (!formData.password) newErrors.password = t.requiredPassword;
    if (formData.password.length < 6) newErrors.password = t.shortPassword;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const result = await signUp({
        ...formData,
        role: 'client',
      });
      if (result.needsEmailConfirmation) {
        toast.success(t.confirmEmail);
        router.push('/auth/login');
        return;
      }
      toast.success(t.accountCreated);
      router.push('/client/dashboard');
    } catch (error: any) {
      toast.error(error.message || t.accountFailed);
      setErrors({ form: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'code') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-background-elevated p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <Link href="/">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent mb-2">
                {t.title}
              </h1>
            </Link>
            <p className="text-text-secondary">{t.joinCoach}</p>
          </div>

          <Card>
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
                  <UserPlus className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-xl font-semibold mb-2">{t.enterCodeTitle}</h2>
                <p className="text-text-secondary text-sm">{t.enterCodeBody}</p>
              </div>

              <Input
                type="text"
                label={t.inviteCode}
                placeholder="ABC12345"
                value={formData.inviteCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    inviteCode: e.target.value.toUpperCase(),
                  })
                }
                error={errors.inviteCode}
                maxLength={8}
                className="text-center text-2xl tracking-widest font-mono"
              />

              {coachInfo && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20"
                >
                  <Check className="w-5 h-5 text-success flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-success">{t.validCode}</p>
                    <p className="text-xs text-text-secondary">
                      {t.coachLabel}: {coachInfo.brand_name || t.yourCoach}
                    </p>
                  </div>
                </motion.div>
              )}

              <Button
                variant="primary"
                fullWidth
                onClick={handleVerifyCode}
                loading={verifying}
                disabled={formData.inviteCode.length !== 8}
              >
                {t.verifyCode}
              </Button>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/auth/register"
                className="text-text-secondary hover:text-text-primary text-sm"
              >
                {t.backRegister}
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-background-elevated p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent mb-2">
              {t.title}
            </h1>
          </Link>
          <p className="text-text-secondary">{t.completeProfile}</p>
        </div>

        <Card>
          {coachInfo && (
            <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-text-secondary mb-1">{t.joiningCoach}</p>
              <p className="font-semibold text-primary">
                {coachInfo.brand_name || t.yourCoach}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="text"
              label={t.fullName}
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              error={errors.name}
              autoComplete="name"
              required
            />

            <Input
              type="email"
              label={t.email}
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              error={errors.email}
              autoComplete="email"
              required
            />

            <Input
              type="password"
              label={t.password}
              placeholder="********"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              error={errors.password}
              helperText={t.passwordHelp}
              autoComplete="new-password"
              required
            />

            {errors.form && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                {errors.form}
              </div>
            )}

            <Button type="submit" variant="primary" fullWidth loading={loading}>
              <UserPlus className="w-4 h-4" />
              {t.createAccount}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <button
              type="button"
              onClick={() => setStep('code')}
              className="text-text-secondary hover:text-text-primary text-sm"
            >
              {t.changeCode}
            </button>
            <p className="text-text-secondary text-sm">
              {t.alreadyAccount}{' '}
              <Link
                href="/auth/login"
                className="text-primary hover:text-primary-light font-medium"
              >
                {t.signIn}
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
