'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { supabase, getCurrentUser } from '@/lib/supabase';

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [coachName, setCoachName] = useState('');
  const [brandLogoUrl, setBrandLogoUrl] = useState('');

  const loadCoach = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const [{ data: coach }, { data: branding }] = await Promise.all([
        supabase
          .from('coaches')
          .select('brand_name')
          .eq('id', user.id)
          .single(),
        supabase
          .from('coach_branding')
          .select('logo_url')
          .eq('coach_id', user.id)
          .maybeSingle(),
      ]);

      if (!coach) {
        router.push('/auth/login');
        return;
      }

      setCoachName((coach as { brand_name?: string }).brand_name || 'Coach');
      if (branding?.logo_url) {
        setBrandLogoUrl(branding.logo_url);
      }
    } catch (error) {
      console.error('Error loading coach:', error);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadCoach();
  }, [loadCoach]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        userType="coach"
        userName={coachName}
        brandName={coachName}
        brandLogoUrl={brandLogoUrl}
      />
      <div className="flex-1">{children}</div>
    </div>
  );
}
