'use client';

import type { MouseEventHandler, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ShinyButtonProps {
  children: ReactNode;
  className?: string;
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  color?: string | string[];
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  ariaLabel?: string;
}

export default function ShinyButton({
  children,
  className,
  borderRadius = 8,
  borderWidth = 1,
  duration = 14,
  color = ['rgb(var(--color-primary))', 'rgb(var(--color-secondary))', 'rgb(var(--color-accent))'],
  onClick,
  type = 'button',
  disabled = false,
  ariaLabel,
}: ShinyButtonProps) {
  const colors = Array.isArray(color) ? color.join(',') : color;

  return (
    <button
      style={{
        // @ts-ignore
        '--border-radius': `${borderRadius}px`,
        '--border-width': `${borderWidth}px`,
        '--shine-pulse-duration': `${duration}s`,
        '--mask-linear-gradient': 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        '--background-radial-gradient': `radial-gradient(transparent, transparent, ${colors}, transparent, transparent)`,
      } as React.CSSProperties}
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'relative grid min-h-[60px] w-fit min-w-[300px] place-items-center rounded-[var(--border-radius)] bg-background-surface p-3 text-text-primary',
        'before:absolute before:inset-0 before:aspect-square before:size-full before:rounded-[var(--border-radius)] before:p-[var(--border-width)] before:will-change-[background-position] before:content-[""]',
        'before:![mask-composite:exclude] before:[background-image:var(--background-radial-gradient)] before:[background-size:300%_300%] before:[mask:var(--mask-linear-gradient)]',
        'motion-safe:before:animate-[shine-pulse_var(--shine-pulse-duration)_infinite_linear]',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
    >
      {children}
    </button>
  );
}
