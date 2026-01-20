'use client';

import { cn } from '@/lib/utils';

interface SpinningTextProps {
  children: string;
  duration?: number;
  reverse?: boolean;
  radius?: number;
  className?: string;
}

export default function SpinningText({
  children,
  duration = 10,
  reverse = false,
  radius = 5.8,
  className,
}: SpinningTextProps) {
  const letters = children.split('');

  return (
    <div
      className={cn('relative', className)}
      style={{
        animation: `spin ${duration}s linear infinite ${reverse ? 'reverse' : ''}`,
      }}
    >
      {letters.map((letter, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="absolute left-1/2 top-1/2"
          style={{
            transform: `
              translate(-50%, -50%)
              rotate(calc(360deg / ${letters.length} * ${index}))
              translateY(calc(${radius} * -1ch))
            `,
          }}
        >
          {letter}
        </span>
      ))}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
