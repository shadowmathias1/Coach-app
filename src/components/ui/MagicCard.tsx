'use client';

import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { type HTMLAttributes, MouseEvent, ReactNode, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MagicCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  gradientSize?: number;
  gradientColor?: string;
  gradientOpacity?: number;
}

export default function MagicCard({
  children,
  className,
  gradientSize = 200,
  gradientColor = 'rgb(var(--color-primary))',
  gradientOpacity = 0.8,
  ...props
}: MagicCardProps) {
  const mouseX = useMotionValue(-gradientSize);
  const mouseY = useMotionValue(-gradientSize);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handleMouseLeave = () => {
    mouseX.set(-gradientSize);
    mouseY.set(-gradientSize);
  };

  useEffect(() => {
    mouseX.set(-gradientSize);
    mouseY.set(-gradientSize);
  }, [mouseX, mouseY, gradientSize]);

  const background = useMotionTemplate`radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientColor}, transparent 100%)`;

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'group relative flex size-full overflow-hidden rounded-xl bg-background-elevated border border-border text-text-primary justify-center items-center transition-all duration-300',
        className
      )}
      {...props}
    >
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
      <motion.div
        style={{
          background,
          opacity: gradientOpacity,
        }}
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
    </div>
  );
}
