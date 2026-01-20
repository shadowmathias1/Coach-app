'use client';

import type React from 'react';
import { useCallback, useRef } from 'react';
import { Moon, Sun } from 'lucide-react';
import { flushSync } from 'react-dom';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/shared/ThemeProvider';

interface AnimatedThemeTogglerProps
  extends React.ComponentPropsWithoutRef<'button'> {
  duration?: number;
}

export default function AnimatedThemeToggler({
  className,
  duration = 400,
  ...props
}: AnimatedThemeTogglerProps) {
  const { resolvedMode, setPreference } = useTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleTheme = useCallback(async () => {
    const nextMode = resolvedMode === 'dark' ? 'light' : 'dark';
    const startViewTransition = (document as unknown as {
      startViewTransition?: (callback: () => void) => { ready: Promise<void> };
    }).startViewTransition;

    if (!buttonRef.current || !startViewTransition) {
      setPreference(nextMode);
      return;
    }

    await startViewTransition(() => {
      flushSync(() => {
        setPreference(nextMode);
      });
    }).ready;

    const { top, left, width, height } =
      buttonRef.current.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    );

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: 'ease-in-out',
        pseudoElement: '::view-transition-new(root)',
      }
    );
  }, [duration, resolvedMode, setPreference]);

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(
        'flex items-center justify-center rounded-full border border-border bg-background-surface p-2 text-text-primary shadow-sm transition hover:border-primary/60 hover:shadow-glow-sm',
        className
      )}
      type="button"
      {...props}
    >
      {resolvedMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
