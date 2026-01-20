'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { getSession, signIn } from '@/lib/auth';
import { getUserRoleById } from '@/lib/supabase';
import { toast } from 'sonner';
import { useLanguage } from '@/components/shared/LanguageProvider';

export default function LoginPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const copy = {
    fr: {
      title: 'Coach App',
      subtitle: 'Connecte-toi a ton compte',
      email: 'Email',
      emailPlaceholder: 'vous@exemple.com',
      password: 'Mot de passe',
      passwordPlaceholder: '********',
      signIn: 'Se connecter',
      signUp: 'Creer un compte',
      noAccount: "Tu n'as pas de compte ?",
      requiredEmail: 'Email requis',
      requiredPassword: 'Mot de passe requis',
      invalidCredentials: 'Identifiants invalides',
      userNotFound: 'Utilisateur introuvable',
      welcomeCoach: 'Bienvenue coach !',
      welcomeClient: 'Bienvenue !',
      profileMissing: 'Profil introuvable. Termine ton inscription.',
    },
    en: {
      title: 'Coach App',
      subtitle: 'Sign in to your account',
      email: 'Email',
      emailPlaceholder: 'you@example.com',
      password: 'Password',
      passwordPlaceholder: '********',
      signIn: 'Sign in',
      signUp: 'Sign up',
      noAccount: "Don't have an account?",
      requiredEmail: 'Email is required',
      requiredPassword: 'Password is required',
      invalidCredentials: 'Invalid credentials',
      userNotFound: 'User not found',
      welcomeCoach: 'Welcome back, coach!',
      welcomeClient: 'Welcome back!',
      profileMissing: 'User profile not found. Please complete signup.',
    },
  } as const;

  const t = copy[language];

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const session = await getSession();
        if (!session?.user) {
          return;
        }

        const role = await getUserRoleById(session.user.id);
        if (role === 'coach') {
          router.replace('/coach/dashboard');
        } else if (role === 'client') {
          router.replace('/client/dashboard');
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    };

    loadSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = t.requiredEmail;
    if (!formData.password) newErrors.password = t.requiredPassword;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const { user, profileRole } = await signIn(formData);
      if (!user) {
        throw new Error(t.userNotFound);
      }

      const role = profileRole || (await getUserRoleById(user.id));
      if (role === 'coach') {
        toast.success(t.welcomeCoach);
        router.push('/coach/dashboard');
      } else if (role === 'client') {
        toast.success(t.welcomeClient);
        router.push('/client/dashboard');
      } else {
        throw new Error(t.profileMissing);
      }
    } catch (error: any) {
      toast.error(error.message || t.invalidCredentials);
      setErrors({ form: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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
          <p className="text-text-secondary">{t.subtitle}</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="email"
              label={t.email}
              placeholder={t.emailPlaceholder}
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
              placeholder={t.passwordPlaceholder}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              error={errors.password}
              autoComplete="current-password"
              required
            />

            {errors.form && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                {errors.form}
              </div>
            )}

            <Button type="submit" variant="primary" fullWidth loading={loading}>
              <LogIn className="w-4 h-4" />
              {t.signIn}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-text-secondary text-sm">
              {t.noAccount}{' '}
              <Link
                href="/auth/register"
                className="text-primary hover:text-primary-light font-medium"
              >
                {t.signUp}
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
