'use client';

import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

export default function Badge({
  children,
  className,
  variant = 'info',
  ...props
}: BadgeProps) {
  const variantStyles = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    default: 'badge-default',
  };

  return (
    <span
      className={clsx('badge', variantStyles[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}
