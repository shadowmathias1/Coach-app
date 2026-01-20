'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { UserPlus, Users, User } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { signUp } from '@/lib/auth';
import { toast } from 'sonner';
import { useLanguage } from '@/components/shared/LanguageProvider';

export default function RegisterPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'role' | 'details'>('role');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: '' as 'coach' | 'client' | '',
    inviteCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const copy = {
    fr: {
      title: 'Coach App',
      chooseRole: 'Choisis ton role',
      coachTitle: "Je suis coach",
      coachBody: 'Gere tes clients, programmes, et progression',
      coachBullets: [
        'Clients illimites',
        'Createur de programmes',
        'Analyse des performances',
        'Messagerie directe',
      ],
      clientTitle: "Je suis client",
      clientBody: 'Suis ton programme et ta progression',
      clientBullets: [
        'Voir mon programme',
        'Logger mes seances',
        'Check-ins hebdo',
        'Chat avec le coach',
      ],
      alreadyAccount: 'Tu as deja un compte ?',
      signIn: 'Se connecter',
      createCoach: 'Creer un compte coach',
      fullName: 'Nom complet',
      email: 'Email',
      password: 'Mot de passe',
      passwordHelp: 'Minimum 6 caracteres',
      createAccount: 'Creer le compte',
      backRole: 'Retour au choix du role',
      requiredName: 'Nom requis',
      requiredEmail: 'Email requis',
      requiredPassword: 'Mot de passe requis',
      shortPassword: 'Mot de passe: 6 caracteres minimum',
      accountCreated: 'Compte cree avec succes !',
      confirmEmail: 'Compte cree. Verifie ton email pour confirmer.',
      accountFailed: 'Impossible de creer le compte',
    },
    en: {
      title: 'Coach App',
      chooseRole: 'Choose your role',
      coachTitle: "I'm a coach",
      coachBody: 'Manage clients, programs, and progress',
      coachBullets: [
        'Unlimited clients',
        'Custom program builder',
        'Performance analytics',
        'Direct messaging',
      ],
      clientTitle: "I'm a client",
      clientBody: 'Follow your program and track your progress',
      clientBullets: [
        'View your program',
        'Log workouts',
        'Weekly check-ins',
        'Chat with coach',
      ],
      alreadyAccount: 'Already have an account?',
      signIn: 'Sign in',
      createCoach: 'Create your coach account',
      fullName: 'Full name',
      email: 'Email',
      password: 'Password',
      passwordHelp: 'Minimum 6 characters',
      createAccount: 'Create account',
      backRole: 'Back to role selection',
      requiredName: 'Name is required',
      requiredEmail: 'Email is required',
      requiredPassword: 'Password is required',
      shortPassword: 'Password must be at least 6 characters',
      accountCreated: 'Account created successfully!',
      confirmEmail: 'Account created. Check your email to confirm.',
      accountFailed: 'Failed to create account',
    },
  } as const;

  const t = copy[language];

  const handleRoleSelect = (role: 'coach' | 'client') => {
    setFormData({ ...formData, role });
    if (role === 'client') {
      router.push('/auth/join-coach');
    } else {
      setStep('details');
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
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: 'coach',
      });
      if (result.needsEmailConfirmation) {
        toast.success(t.confirmEmail);
        router.push('/auth/login');
        return;
      }
      toast.success(t.accountCreated);
      router.push('/coach/dashboard');
    } catch (error: any) {
      toast.error(error.message || t.accountFailed);
      setErrors({ form: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'role') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-background-elevated p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl"
        >
          <div className="text-center mb-12">
            <Link href="/">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent mb-2">
                {t.title}
              </h1>
            </Link>
            <p className="text-text-secondary text-lg">{t.chooseRole}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card
                hover
                className="cursor-pointer h-full"
                onClick={() => handleRoleSelect('coach')}
              >
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">{t.coachTitle}</h2>
                  <p className="text-text-secondary">{t.coachBody}</p>
                  <ul className="text-left space-y-2 text-sm text-text-secondary">
                    {t.coachBullets.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card
                hover
                className="cursor-pointer h-full"
                onClick={() => handleRoleSelect('client')}
              >
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
                    <User className="w-8 h-8 text-success" />
                  </div>
                  <h2 className="text-2xl font-bold">{t.clientTitle}</h2>
                  <p className="text-text-secondary">{t.clientBody}</p>
                  <ul className="text-left space-y-2 text-sm text-text-secondary">
                    {t.clientBullets.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-success" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </motion.div>
          </div>

          <div className="mt-8 text-center">
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
          <p className="text-text-secondary">{t.createCoach}</p>
        </div>

        <Card>
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
              onClick={() => setStep('role')}
              className="text-text-secondary hover:text-text-primary text-sm"
            >
              {t.backRole}
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
