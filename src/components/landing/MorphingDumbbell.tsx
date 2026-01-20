'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function MorphingDumbbell() {
  const { scrollYProgress } = useScroll();

  // Interpoler les positions basées sur le scroll (0 = top, 1 = bottom)

  // Poids gauche : centre → coin haut-gauche
  const leftWeightX = useTransform(scrollYProgress, [0, 0.3], [0, -40]);
  const leftWeightY = useTransform(scrollYProgress, [0, 0.3], [0, -35]);
  const leftWeightRotate = useTransform(scrollYProgress, [0, 0.3], [0, -180]);

  // Poids droit : centre → coin haut-droit
  const rightWeightX = useTransform(scrollYProgress, [0, 0.3], [0, 40]);
  const rightWeightY = useTransform(scrollYProgress, [0, 0.3], [0, -35]);
  const rightWeightRotate = useTransform(scrollYProgress, [0, 0.3], [0, 180]);

  // Poids additionnels dans les coins bas (apparaissent progressivement)
  const bottomLeftOpacity = useTransform(scrollYProgress, [0.2, 0.4], [0, 1]);
  const bottomRightOpacity = useTransform(scrollYProgress, [0.2, 0.4], [0, 1]);

  // Barre centrale : reste au milieu mais diminue légèrement
  const barScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.85]);
  const barRotate = useTransform(scrollYProgress, [0, 0.3], [0, 90]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full flex items-center justify-center">

        {/* Barre centrale */}
        <motion.div
          className="absolute"
          style={{
            scale: barScale,
            rotate: barRotate,
          }}
        >
          <svg width="200" height="40" viewBox="0 0 200 40" fill="none">
            <defs>
              <linearGradient id="barGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(var(--color-primary))" stopOpacity="0.3" />
                <stop offset="50%" stopColor="rgb(var(--color-secondary))" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgb(var(--color-accent))" stopOpacity="0.3" />
              </linearGradient>
              <filter id="barGlow">
                <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <rect x="20" y="15" width="160" height="10" rx="5" fill="url(#barGradient)" filter="url(#barGlow)"/>
          </svg>
        </motion.div>

        {/* Poids gauche (va vers coin haut-gauche) */}
        <motion.div
          className="absolute"
          style={{
            x: leftWeightX,
            y: leftWeightY,
            rotate: leftWeightRotate,
            translateX: '-50%',
            translateY: '-50%',
          }}
        >
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <defs>
              <linearGradient id="weightGradientL" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(var(--color-primary))" stopOpacity="0.4" />
                <stop offset="100%" stopColor="rgb(var(--color-secondary))" stopOpacity="0.4" />
              </linearGradient>
              <filter id="weightGlow">
                <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* Empilement de 3 rectangles pour effet 3D */}
            <rect x="30" y="30" width="60" height="60" rx="8" fill="url(#weightGradientL)" filter="url(#weightGlow)"/>
            <rect x="35" y="35" width="50" height="50" rx="6" fill="url(#weightGradientL)" opacity="0.7"/>
            <rect x="40" y="40" width="40" height="40" rx="5" fill="url(#weightGradientL)" opacity="0.5"/>
          </svg>
        </motion.div>

        {/* Poids droit (va vers coin haut-droit) */}
        <motion.div
          className="absolute"
          style={{
            x: rightWeightX,
            y: rightWeightY,
            rotate: rightWeightRotate,
            translateX: '-50%',
            translateY: '-50%',
          }}
        >
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <defs>
              <linearGradient id="weightGradientR" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(var(--color-secondary))" stopOpacity="0.4" />
                <stop offset="100%" stopColor="rgb(var(--color-accent))" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <rect x="30" y="30" width="60" height="60" rx="8" fill="url(#weightGradientR)" filter="url(#weightGlow)"/>
            <rect x="35" y="35" width="50" height="50" rx="6" fill="url(#weightGradientR)" opacity="0.7"/>
            <rect x="40" y="40" width="40" height="40" rx="5" fill="url(#weightGradientR)" opacity="0.5"/>
          </svg>
        </motion.div>

        {/* Poids coin bas-gauche (apparaît au scroll) */}
        <motion.div
          className="absolute bottom-[15%] left-[15%]"
          style={{
            opacity: bottomLeftOpacity,
            rotate: 45,
          }}
        >
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
            <defs>
              <linearGradient id="weightGradientBL" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(var(--color-accent))" stopOpacity="0.35" />
                <stop offset="100%" stopColor="rgb(var(--color-primary))" stopOpacity="0.35" />
              </linearGradient>
            </defs>
            <rect x="25" y="25" width="50" height="50" rx="7" fill="url(#weightGradientBL)" filter="url(#weightGlow)"/>
            <rect x="30" y="30" width="40" height="40" rx="5" fill="url(#weightGradientBL)" opacity="0.7"/>
            <rect x="35" y="35" width="30" height="30" rx="4" fill="url(#weightGradientBL)" opacity="0.5"/>
          </svg>
        </motion.div>

        {/* Poids coin bas-droit (apparaît au scroll) */}
        <motion.div
          className="absolute bottom-[15%] right-[15%]"
          style={{
            opacity: bottomRightOpacity,
            rotate: -45,
          }}
        >
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
            <defs>
              <linearGradient id="weightGradientBR" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(var(--color-primary))" stopOpacity="0.35" />
                <stop offset="100%" stopColor="rgb(var(--color-secondary))" stopOpacity="0.35" />
              </linearGradient>
            </defs>
            <rect x="25" y="25" width="50" height="50" rx="7" fill="url(#weightGradientBR)" filter="url(#weightGlow)"/>
            <rect x="30" y="30" width="40" height="40" rx="5" fill="url(#weightGradientBR)" opacity="0.7"/>
            <rect x="35" y="35" width="30" height="30" rx="4" fill="url(#weightGradientBR)" opacity="0.5"/>
          </svg>
        </motion.div>

      </div>
    </div>
  );
}
