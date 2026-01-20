'use client';

import { Toaster } from 'sonner';
import { useTheme } from '@/components/shared/ThemeProvider';

export default function ThemeToaster() {
  const { resolvedMode } = useTheme();

  return (
    <Toaster
      position="top-right"
      theme={resolvedMode}
      richColors
    />
  );
}
