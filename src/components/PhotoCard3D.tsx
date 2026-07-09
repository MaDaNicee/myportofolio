'use client';

import Image from 'next/image';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useRef, type PointerEvent } from 'react';

interface PhotoCard3DProps {
  src: string;
  alt: string;
}

const sparkParticles = [
  { x: -150, y: -118, rotate: -36, size: 58, delay: 0.05, color: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.95), rgba(167,139,250,0))' },
  { x: -118, y: -42, rotate: -12, size: 48, delay: 0.12, color: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(192,38,211,0.95), rgba(255,255,255,0))' },
  { x: -132, y: 72, rotate: 24, size: 62, delay: 0.2, color: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(124,58,237,0.95), rgba(255,255,255,0))' },
  { x: -58, y: -162, rotate: -72, size: 44, delay: 0.16, color: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.85), rgba(255,255,255,0))' },
  { x: 72, y: -156, rotate: -108, size: 52, delay: 0.1, color: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(167,139,250,0.95), rgba(255,255,255,0))' },
  { x: 150, y: -90, rotate: -150, size: 64, delay: 0.18, color: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(192,38,211,0.9), rgba(255,255,255,0))' },
  { x: 142, y: 38, rotate: 166, size: 50, delay: 0.08, color: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.9), rgba(124,58,237,0))' },
  { x: 96, y: 134, rotate: 126, size: 58, delay: 0.24, color: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(124,58,237,0.95), rgba(255,255,255,0))' },
  { x: -18, y: 168, rotate: 86, size: 46, delay: 0.14, color: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.85), rgba(255,255,255,0))' },
  { x: -92, y: 132, rotate: 54, size: 42, delay: 0.28, color: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(192,38,211,0.9), rgba(255,255,255,0))' },
  { x: 24, y: -210, rotate: -92, size: 36, delay: 0.32, color: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.95), rgba(255,255,255,0))' },
  { x: 204, y: -8, rotate: 180, size: 40, delay: 0.3, color: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(167,139,250,0.95), rgba(255,255,255,0))' },
];

export default function PhotoCard3D({ src, alt }: PhotoCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);

  const springConfig = { stiffness: 180, damping: 18, mass: 0.35 };
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], reduceMotion ? [0, 0] : [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], reduceMotion ? [0, 0] : [-12, 12]), springConfig);
  const imageX = useSpring(useTransform(pointerX, [-0.5, 0.5], reduceMotion ? [0, 0] : [-12, 12]), springConfig);
  const imageY = useSpring(useTransform(pointerY, [-0.5, 0.5], reduceMotion ? [0, 0] : [-10, 10]), springConfig);
  const glowX = useSpring(useTransform(pointerX, [-0.5, 0.5], reduceMotion ? [0, 0] : [-20, 20]), springConfig);
  const glowY = useSpring(useTransform(pointerY, [-0.5, 0.5], reduceMotion ? [0, 0] : [-18, 18]), springConfig);

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start end', 'end start'],
  });
  const scrollY = useSpring(useTransform(scrollYProgress, [0, 0.5, 1], reduceMotion ? [0, 0, 0] : [26, 0, -26]), springConfig);
  const scrollRotateZ = useSpring(useTransform(scrollYProgress, [0, 0.5, 1], reduceMotion ? [0, 0, 0] : [-3, 0, 3]), springConfig);

  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.55), rgba(255,255,255,0.14) 22%, transparent 48%)`;

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    pointerX.set(x);
    pointerY.set(y);
    glareX.set((x + 0.5) * 100);
    glareY.set((y + 0.5) * 100);
  };

  const resetTilt = () => {
    pointerX.set(0);
    pointerY.set(0);
    glareX.set(50);
    glareY.set(50);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.88, rotate: 5 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="relative mx-auto w-full max-w-sm lg:max-w-md"
      style={{ y: scrollY, perspective: 1200 }}
    >
      {!reduceMotion && (
        <div aria-hidden="true" className="pointer-events-none absolute -inset-20 z-0 overflow-visible">
          {sparkParticles.map((spark, index) => (
            <motion.span
              key={`${spark.x}-${spark.y}-${index}`}
              className="absolute left-1/2 top-1/2 h-[2px] origin-left rounded-full shadow-[0_0_18px_rgba(167,139,250,0.8)]"
              style={{ width: spark.size, background: spark.color }}
              initial={{ x: 0, y: 0, rotate: spark.rotate, scaleX: 0, opacity: 0 }}
              animate={{ x: spark.x, y: spark.y, scaleX: [0, 1, 0.18], opacity: [0, 1, 0] }}
              transition={{ duration: 1.15, delay: spark.delay, ease: [0.16, 1, 0.3, 1] }}
            />
          ))}
        </div>
      )}

      <motion.div
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
        onPointerCancel={resetTilt}
        className="group relative z-10 outline-none"
        style={{ rotateX, rotateY, rotateZ: scrollRotateZ, transformStyle: 'preserve-3d' }}
      >
        <motion.div
          aria-hidden="true"
          className="absolute -inset-7 rounded-[2.5rem] bg-gradient-to-tr from-accent-primary/25 via-accent-secondary/20 to-white/10 blur-3xl"
          style={{ x: glowX, y: glowY, transform: 'translateZ(-70px)' }}
        />

        <div
          className="relative rounded-3xl border border-white/25 bg-white/10 p-4 shadow-2xl shadow-accent-primary/15 backdrop-blur-xl dark:bg-black/20"
          style={{ transform: 'translateZ(34px)', transformStyle: 'preserve-3d' }}
        >
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 rounded-3xl opacity-0 mix-blend-screen transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: glareBackground, transform: 'translateZ(82px)' }}
          />
          <div aria-hidden="true" className="absolute inset-0 rounded-3xl border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]" />

          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
            <motion.div className="absolute inset-0" style={{ x: imageX, y: imageY, scale: 1.06 }}>
              <Image
                src={src}
                alt={alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
              />
            </motion.div>

            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-tr from-accent-primary/20 via-transparent to-accent-secondary/20" />
            <div aria-hidden="true" className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />

            <div
              className="absolute bottom-6 left-6 right-6 rounded-xl border border-white/25 bg-white/90 p-4 shadow-2xl backdrop-blur-md dark:bg-black/80"
              style={{ transform: 'translateZ(76px)' }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-primary/20 text-accent-primary shadow-lg shadow-accent-primary/20">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">Current Focus</p>
                  <p className="text-sm font-bold text-text-light-primary dark:text-text-dark-primary">FullStack Development</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute -top-12 -right-12 -z-10 hidden opacity-50 lg:block" style={{ transform: 'translateZ(-50px)' }}>
          <svg width="120" height="120" fill="none" viewBox="0 0 120 120">
            <defs>
              <pattern id="dots-right" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="3" height="3" className="text-accent-primary" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="120" height="120" fill="url(#dots-right)" />
          </svg>
        </div>
      </motion.div>
    </motion.div>
  );
}
