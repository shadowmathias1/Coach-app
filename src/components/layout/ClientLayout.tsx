'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { ensureClientProfile } from '@/lib/clientProfile';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [brandLogoUrl, setBrandLogoUrl] = useState('');
  const [brandPrimary, setBrandPrimary] = useState('');
  const [brandAccent, setBrandAccent] = useState('');

  const loadClient = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const client = await ensureClientProfile(user);
      if (!client) {
        router.push('/auth/login');
        return;
      }

      setClientName(client.display_name);

      const { data: branding } = await supabase
        .from('coach_branding')
        .select('brand_name, logo_url, primary_color, accent_color')
        .eq('coach_id', client.coach_id)
        .maybeSingle();
      if (branding?.brand_name) {
        setBrandName(branding.brand_name);
      }
      if (branding?.logo_url) {
        setBrandLogoUrl(branding.logo_url);
      }
      if (branding?.primary_color) {
        setBrandPrimary(branding.primary_color);
      }
      if (branding?.accent_color) {
        setBrandAccent(branding.accent_color);
      }
    } catch (error) {
      console.error('Error loading client:', error);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hexToRgb = (hex: string) => {
    const clean = hex.replace('#', '');
    const value =
      clean.length === 3
        ? clean
            .split('')
            .map((char) => char + char)
            .join('')
        : clean;
    if (value.length !== 6) return '';
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return `${r} ${g} ${b}`;
  };

  const brandStyle: CSSProperties | undefined =
    brandPrimary || brandAccent
      ? ({
          ...(brandPrimary && {
            '--color-primary': hexToRgb(brandPrimary),
            '--color-primary-hover': hexToRgb(brandPrimary),
          }),
          ...(brandAccent && {
            '--color-secondary': hexToRgb(brandAccent),
          }),
        } as CSSProperties)
      : undefined;

  return (
    <div className="flex min-h-screen bg-background" style={brandStyle}>
      <Sidebar
        userType="client"
        userName={clientName}
        brandName={brandName}
        brandLogoUrl={brandLogoUrl}
      />
      <div className="flex-1">{children}</div>
    </div>
  );
}
