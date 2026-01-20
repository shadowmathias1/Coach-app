'use client';

import { useEffect, useRef, useState } from 'react';
import createGlobe from 'cobe';

export default function Globe({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const [width, setWidth] = useState(0);
  const phi = useRef(0);
  const r = useRef(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    const onResize = () => {
      if (canvas) {
        setWidth(canvas.offsetWidth);
      }
    };

    window.addEventListener('resize', onResize);
    onResize();

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [99 / 255, 102 / 255, 241 / 255], // Indigo (primary color)
      glowColor: [1, 1, 1],
      markers: [
        // Principales villes mondiales
        { location: [48.8566, 2.3522], size: 0.08 },     // Paris
        { location: [40.7128, -74.006], size: 0.1 },     // New York
        { location: [51.5074, -0.1278], size: 0.07 },    // London
        { location: [35.6762, 139.6503], size: 0.08 },   // Tokyo
        { location: [-33.8688, 151.2093], size: 0.06 },  // Sydney
        { location: [19.4326, -99.1332], size: 0.05 },   // Mexico City
        { location: [-23.5505, -46.6333], size: 0.06 },  // São Paulo
        { location: [55.7558, 37.6173], size: 0.06 },    // Moscow
        { location: [30.0444, 31.2357], size: 0.06 },    // Cairo
        { location: [1.3521, 103.8198], size: 0.05 },    // Singapore
        { location: [25.2048, 55.2708], size: 0.05 },    // Dubai
        { location: [-26.2041, 28.0473], size: 0.05 },   // Johannesburg
      ],
      onRender: (state) => {
        if (!pointerInteracting.current) {
          phi.current += 0.002; // Ralenti de 0.005 à 0.002
        }
        state.phi = phi.current + r.current;
        state.width = width * 2;
        state.height = width * 2;
      }
    });

    setTimeout(() => {
      if (canvas) canvas.style.opacity = '1';
    });

    return () => {
      globe.destroy();
      window.removeEventListener('resize', onResize);
    };
  }, [width]);

  return (
    <div className={`absolute inset-0 mx-auto aspect-square w-full max-w-[600px] ${className}`}>
      <canvas
        ref={canvasRef}
        className="h-full w-full opacity-0 transition-opacity duration-500 [contain:layout_paint_size] cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX - pointerInteractionMovement.current;
          if (canvasRef.current) {
            canvasRef.current.style.cursor = 'grabbing';
          }
        }}
        onPointerUp={() => {
          pointerInteracting.current = null;
          if (canvasRef.current) {
            canvasRef.current.style.cursor = 'grab';
          }
        }}
        onPointerOut={() => {
          pointerInteracting.current = null;
          if (canvasRef.current) {
            canvasRef.current.style.cursor = 'grab';
          }
        }}
        onMouseMove={(e) => {
          if (pointerInteracting.current !== null) {
            const delta = e.clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta;
            r.current = delta / 200;
          }
        }}
        onTouchMove={(e) => {
          if (pointerInteracting.current !== null && e.targetTouches[0]) {
            const delta = e.targetTouches[0].clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta;
            r.current = delta / 100;
          }
        }}
      />
    </div>
  );
}
