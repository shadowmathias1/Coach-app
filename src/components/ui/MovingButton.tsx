'use client';

import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MovingButtonProps {
  text: string;
  className?: string;
  onClick?: () => void;
}

export default function MovingButton({ text, className, onClick }: MovingButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex min-h-[48px] min-w-[160px] items-center justify-center cursor-pointer overflow-hidden rounded-full bg-background-surface px-6 py-3 text-center font-semibold transition-all duration-300',
        className
      )}
    >
      <span className="block w-full text-center translate-x-1 transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
        {text}
      </span>
      <div className="absolute inset-0 z-10 flex translate-x-12 items-center justify-center gap-2 text-white opacity-0 transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-100">
        <span>{text}</span>
        <ArrowRight className="w-4 h-4" />
      </div>
      <div className="absolute left-[20%] top-[40%] h-2 w-2 scale-[1] rounded-lg bg-primary opacity-0 transition-all duration-300 group-hover:left-[0%] group-hover:top-[0%] group-hover:h-full group-hover:w-full group-hover:scale-[1.8] group-hover:opacity-100" />
    </button>
  );
}
