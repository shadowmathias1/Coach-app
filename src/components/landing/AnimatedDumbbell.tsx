'use client';

import { useEffect, useState } from 'react';

export default function AnimatedDumbbell() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const rotation = scrollY * 0.5; // Rotation basée sur le scroll
  const translateY = Math.sin(scrollY * 0.01) * 20; // Mouvement vertical sinusoïdal

  return (
    <div
      className="fixed right-[-10%] top-1/4 w-96 h-96 pointer-events-none z-0 opacity-10"
      style={{
        transform: `rotate(${rotation}deg) translateY(${translateY}px) scale(1.5)`,
        transition: 'transform 0.1s ease-out'
      }}
    >
      {/* Haltère SVG stylisée */}
      <svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="dumbbellGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(var(--color-primary))" stopOpacity="0.8" />
            <stop offset="50%" stopColor="rgb(var(--color-secondary))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="rgb(var(--color-accent))" stopOpacity="0.8" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Barre centrale */}
        <rect x="60" y="35" width="80" height="10" rx="5" fill="url(#dumbbellGradient)" filter="url(#glow)"/>

        {/* Poids gauche */}
        <g>
          <rect x="20" y="25" width="35" height="30" rx="4" fill="url(#dumbbellGradient)" filter="url(#glow)"/>
          <rect x="15" y="28" width="30" height="24" rx="3" fill="url(#dumbbellGradient)" opacity="0.7"/>
          <rect x="10" y="31" width="25" height="18" rx="2" fill="url(#dumbbellGradient)" opacity="0.5"/>
        </g>

        {/* Poids droit */}
        <g>
          <rect x="145" y="25" width="35" height="30" rx="4" fill="url(#dumbbellGradient)" filter="url(#glow)"/>
          <rect x="155" y="28" width="30" height="24" rx="3" fill="url(#dumbbellGradient)" opacity="0.7"/>
          <rect x="165" y="31" width="25" height="18" rx="2" fill="url(#dumbbellGradient)" opacity="0.5"/>
        </g>
      </svg>
    </div>
  );
}
