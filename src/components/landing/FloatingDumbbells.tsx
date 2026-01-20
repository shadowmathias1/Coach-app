'use client';

import { motion } from 'framer-motion';

export default function FloatingDumbbells() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Haltère flottante 1 - Haut gauche */}
      <motion.div
        className="absolute top-20 left-10 w-40 h-40 opacity-5"
        animate={{
          y: [0, 30, 0],
          rotate: [0, 15, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <svg viewBox="0 0 200 80" fill="none">
          <defs>
            <linearGradient id="dumbbell1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(var(--color-primary))" stopOpacity="0.6" />
              <stop offset="50%" stopColor="rgb(var(--color-secondary))" stopOpacity="0.6" />
              <stop offset="100%" stopColor="rgb(var(--color-accent))" stopOpacity="0.6" />
            </linearGradient>
            <filter id="glow1">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {/* Barre */}
          <rect x="60" y="35" width="80" height="10" rx="5" fill="url(#dumbbell1)" filter="url(#glow1)"/>
          {/* Poids gauche */}
          <g>
            <rect x="20" y="25" width="35" height="30" rx="4" fill="url(#dumbbell1)" filter="url(#glow1)"/>
            <rect x="15" y="28" width="30" height="24" rx="3" fill="url(#dumbbell1)" opacity="0.7"/>
            <rect x="10" y="31" width="25" height="18" rx="2" fill="url(#dumbbell1)" opacity="0.5"/>
          </g>
          {/* Poids droit */}
          <g>
            <rect x="145" y="25" width="35" height="30" rx="4" fill="url(#dumbbell1)" filter="url(#glow1)"/>
            <rect x="155" y="28" width="30" height="24" rx="3" fill="url(#dumbbell1)" opacity="0.7"/>
            <rect x="165" y="31" width="25" height="18" rx="2" fill="url(#dumbbell1)" opacity="0.5"/>
          </g>
        </svg>
      </motion.div>

      {/* Haltère flottante 2 - Haut droit */}
      <motion.div
        className="absolute top-40 right-20 w-56 h-56 opacity-5"
        animate={{
          y: [0, -40, 0],
          rotate: [0, -20, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      >
        <svg viewBox="0 0 200 80" fill="none">
          <defs>
            <linearGradient id="dumbbell2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(var(--color-secondary))" stopOpacity="0.6" />
              <stop offset="50%" stopColor="rgb(var(--color-accent))" stopOpacity="0.6" />
              <stop offset="100%" stopColor="rgb(var(--color-primary))" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <rect x="60" y="35" width="80" height="10" rx="5" fill="url(#dumbbell2)" filter="url(#glow1)"/>
          <g>
            <rect x="20" y="25" width="35" height="30" rx="4" fill="url(#dumbbell2)" filter="url(#glow1)"/>
            <rect x="15" y="28" width="30" height="24" rx="3" fill="url(#dumbbell2)" opacity="0.7"/>
            <rect x="10" y="31" width="25" height="18" rx="2" fill="url(#dumbbell2)" opacity="0.5"/>
          </g>
          <g>
            <rect x="145" y="25" width="35" height="30" rx="4" fill="url(#dumbbell2)" filter="url(#glow1)"/>
            <rect x="155" y="28" width="30" height="24" rx="3" fill="url(#dumbbell2)" opacity="0.7"/>
            <rect x="165" y="31" width="25" height="18" rx="2" fill="url(#dumbbell2)" opacity="0.5"/>
          </g>
        </svg>
      </motion.div>

      {/* Haltère flottante 3 - Milieu gauche */}
      <motion.div
        className="absolute top-1/2 left-[10%] w-48 h-48 opacity-5"
        animate={{
          y: [0, 50, 0],
          x: [0, 20, 0],
          rotate: [0, 25, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      >
        <svg viewBox="0 0 200 80" fill="none">
          <defs>
            <linearGradient id="dumbbell3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(var(--color-accent))" stopOpacity="0.6" />
              <stop offset="50%" stopColor="rgb(var(--color-primary))" stopOpacity="0.6" />
              <stop offset="100%" stopColor="rgb(var(--color-secondary))" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <rect x="60" y="35" width="80" height="10" rx="5" fill="url(#dumbbell3)" filter="url(#glow1)"/>
          <g>
            <rect x="20" y="25" width="35" height="30" rx="4" fill="url(#dumbbell3)" filter="url(#glow1)"/>
            <rect x="15" y="28" width="30" height="24" rx="3" fill="url(#dumbbell3)" opacity="0.7"/>
            <rect x="10" y="31" width="25" height="18" rx="2" fill="url(#dumbbell3)" opacity="0.5"/>
          </g>
          <g>
            <rect x="145" y="25" width="35" height="30" rx="4" fill="url(#dumbbell3)" filter="url(#glow1)"/>
            <rect x="155" y="28" width="30" height="24" rx="3" fill="url(#dumbbell3)" opacity="0.7"/>
            <rect x="165" y="31" width="25" height="18" rx="2" fill="url(#dumbbell3)" opacity="0.5"/>
          </g>
        </svg>
      </motion.div>

      {/* Haltère flottante 4 - Bas droit */}
      <motion.div
        className="absolute bottom-1/4 right-[15%] w-44 h-44 opacity-5"
        animate={{
          rotate: [0, -30, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      >
        <svg viewBox="0 0 200 80" fill="none">
          <defs>
            <linearGradient id="dumbbell4" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(var(--color-primary))" stopOpacity="0.6" />
              <stop offset="100%" stopColor="rgb(var(--color-accent))" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <rect x="60" y="35" width="80" height="10" rx="5" fill="url(#dumbbell4)" filter="url(#glow1)"/>
          <g>
            <rect x="20" y="25" width="35" height="30" rx="4" fill="url(#dumbbell4)" filter="url(#glow1)"/>
            <rect x="15" y="28" width="30" height="24" rx="3" fill="url(#dumbbell4)" opacity="0.7"/>
            <rect x="10" y="31" width="25" height="18" rx="2" fill="url(#dumbbell4)" opacity="0.5"/>
          </g>
          <g>
            <rect x="145" y="25" width="35" height="30" rx="4" fill="url(#dumbbell4)" filter="url(#glow1)"/>
            <rect x="155" y="28" width="30" height="24" rx="3" fill="url(#dumbbell4)" opacity="0.7"/>
            <rect x="165" y="31" width="25" height="18" rx="2" fill="url(#dumbbell4)" opacity="0.5"/>
          </g>
        </svg>
      </motion.div>

      {/* Haltère flottante 5 - Bas gauche */}
      <motion.div
        className="absolute bottom-1/3 left-[20%] w-36 h-36 opacity-5"
        animate={{
          rotate: [0, 20, 0],
          x: [0, -15, 0],
          y: [0, 25, 0],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5
        }}
      >
        <svg viewBox="0 0 200 80" fill="none">
          <defs>
            <linearGradient id="dumbbell5" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(var(--color-secondary))" stopOpacity="0.6" />
              <stop offset="100%" stopColor="rgb(var(--color-primary))" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <rect x="60" y="35" width="80" height="10" rx="5" fill="url(#dumbbell5)" filter="url(#glow1)"/>
          <g>
            <rect x="20" y="25" width="35" height="30" rx="4" fill="url(#dumbbell5)" filter="url(#glow1)"/>
            <rect x="15" y="28" width="30" height="24" rx="3" fill="url(#dumbbell5)" opacity="0.7"/>
            <rect x="10" y="31" width="25" height="18" rx="2" fill="url(#dumbbell5)" opacity="0.5"/>
          </g>
          <g>
            <rect x="145" y="25" width="35" height="30" rx="4" fill="url(#dumbbell5)" filter="url(#glow1)"/>
            <rect x="155" y="28" width="30" height="24" rx="3" fill="url(#dumbbell5)" opacity="0.7"/>
            <rect x="165" y="31" width="25" height="18" rx="2" fill="url(#dumbbell5)" opacity="0.5"/>
          </g>
        </svg>
      </motion.div>
    </div>
  );
}
