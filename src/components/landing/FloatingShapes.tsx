'use client';

import { motion } from 'framer-motion';

export default function FloatingShapes() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Cercle flottant 1 - Haut gauche */}
      <motion.div
        className="absolute top-20 left-10 w-64 h-64 rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, rgb(var(--color-primary)) 0%, transparent 70%)',
          filter: 'blur(40px)'
        }}
        animate={{
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Cercle flottant 2 - Haut droit */}
      <motion.div
        className="absolute top-40 right-20 w-96 h-96 rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, rgb(var(--color-secondary)) 0%, transparent 70%)',
          filter: 'blur(50px)'
        }}
        animate={{
          y: [0, -40, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />

      {/* Cercle flottant 3 - Milieu */}
      <motion.div
        className="absolute top-1/2 left-1/3 w-80 h-80 rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, rgb(var(--color-accent)) 0%, transparent 70%)',
          filter: 'blur(45px)'
        }}
        animate={{
          y: [0, 50, 0],
          x: [0, 30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />

      {/* Triangle flottant */}
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-32 h-32 opacity-5"
        animate={{
          rotate: [0, 360],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg viewBox="0 0 100 100" fill="none">
          <polygon
            points="50,10 90,90 10,90"
            fill="url(#triangleGradient)"
            filter="url(#blur)"
          />
          <defs>
            <linearGradient id="triangleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(var(--color-primary))" />
              <stop offset="100%" stopColor="rgb(var(--color-secondary))" />
            </linearGradient>
            <filter id="blur">
              <feGaussianBlur stdDeviation="3"/>
            </filter>
          </defs>
        </svg>
      </motion.div>

      {/* Carré flottant */}
      <motion.div
        className="absolute bottom-1/3 left-1/4 w-24 h-24 opacity-5"
        animate={{
          rotate: [0, -180, -360],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div
          className="w-full h-full rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgb(var(--color-secondary)), rgb(var(--color-accent)))',
            filter: 'blur(8px)'
          }}
        />
      </motion.div>

      {/* Lignes diagonales animées */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(45deg, transparent 48%, rgb(var(--color-primary)) 49%, rgb(var(--color-primary)) 51%, transparent 52%),
            linear-gradient(-45deg, transparent 48%, rgb(var(--color-secondary)) 49%, rgb(var(--color-secondary)) 51%, transparent 52%)
          `,
          backgroundSize: '100px 100px',
        }}
        animate={{
          backgroundPosition: ['0px 0px', '100px 100px']
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
}
