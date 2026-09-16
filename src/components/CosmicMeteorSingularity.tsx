'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const TRAIL_LIMIT = 26;
const TRAIL_LIFETIME = 460;
const MAX_PARTICLES = 40;

type TrailPoint = {
  x: number;
  y: number;
  time: number;
  velocity: number;
  angle: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  drag: number;
  tone: 0 | 1;
};

type PointerState = {
  x: number;
  y: number;
  speed: number;
  angle: number;
  lastMove: number;
  active: boolean;
};

type VisualPalette = {
  blendMode: GlobalCompositeOperation;
  primaryRgb: string;
  secondaryRgb: string;
  filamentRgb: string;
  hotRgb: string;
  particleOpacity: number;
  tailOpacity: [number, number, number];
  headOpacity: number;
};

const THEME_PALETTES: Record<'light' | 'dark', VisualPalette> = {
  light: {
    blendMode: 'source-over',
    primaryRgb: '139, 92, 246',
    secondaryRgb: '99, 102, 241',
    filamentRgb: '109, 40, 217',
    hotRgb: '255, 255, 255',
    particleOpacity: 0.5,
    tailOpacity: [0.13, 0.22, 0.46],
    headOpacity: 0.68,
  },
  dark: {
    blendMode: 'lighter',
    primaryRgb: '139, 92, 246',
    secondaryRgb: '99, 102, 241',
    filamentRgb: '237, 233, 254',
    hotRgb: '255, 255, 255',
    particleOpacity: 0.72,
    tailOpacity: [0.2, 0.34, 0.7],
    headOpacity: 0.86,
  },
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getCanvasPixelRatio = () =>
  Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1 : 1.25);

const spawnEmber = (particles: Particle[], pointer: PointerState) => {
  if (particles.length >= MAX_PARTICLES) return;

  const angle = pointer.angle + Math.PI + (Math.random() - 0.5) * 0.85;
  const velocity = 45 + Math.random() * Math.min(180, pointer.speed * 0.16);
  const life = 0.36 + Math.random() * 0.34;
  particles.push({
    x: pointer.x,
    y: pointer.y,
    vx: Math.cos(angle) * velocity,
    vy: Math.sin(angle) * velocity,
    life,
    maxLife: life,
    size: 0.7 + Math.random() * 1.35,
    drag: 2.2 + Math.random(),
    tone: Math.random() > 0.42 ? 0 : 1,
  });
};

const spawnImpact = (particles: Particle[], x: number, y: number) => {
  const count = Math.min(24, MAX_PARTICLES - particles.length);

  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.18;
    const velocity = 100 + Math.random() * 310;
    const life = 0.4 + Math.random() * 0.45;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      life,
      maxLife: life,
      size: 0.9 + Math.random() * 1.7,
      drag: 1.7 + Math.random(),
      tone: index % 3 === 0 ? 1 : 0,
    });
  }
};

const traceSmoothTrail = (context: CanvasRenderingContext2D, trail: TrailPoint[]) => {
  const first = trail[0];
  context.beginPath();
  context.moveTo(first.x, first.y);

  for (let index = 1; index < trail.length - 1; index += 1) {
    const point = trail[index];
    const next = trail[index + 1];
    context.quadraticCurveTo(point.x, point.y, (point.x + next.x) * 0.5, (point.y + next.y) * 0.5);
  }

  const last = trail[trail.length - 1];
  context.lineTo(last.x, last.y);
};

const drawTailLayer = (
  context: CanvasRenderingContext2D,
  trail: TrailPoint[],
  palette: VisualPalette,
  rgb: string,
  width: number,
  opacity: number,
  blur: number,
  now: number,
) => {
  if (trail.length < 2) return;

  const first = trail[0];
  const last = trail[trail.length - 1];
  const fade = clamp(1 - (now - last.time) / TRAIL_LIFETIME, 0, 1);
  const gradient = context.createLinearGradient(first.x, first.y, last.x, last.y);
  gradient.addColorStop(0, `rgba(${rgb}, 0)`);
  gradient.addColorStop(0.42, `rgba(${rgb}, ${opacity * fade * 0.42})`);
  gradient.addColorStop(1, `rgba(${rgb}, ${opacity * fade})`);

  context.save();
  context.globalCompositeOperation = palette.blendMode;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = gradient;
  context.lineWidth = width;
  context.shadowColor = `rgba(${palette.primaryRgb}, ${opacity * 0.55})`;
  context.shadowBlur = blur;
  traceSmoothTrail(context, trail);
  context.stroke();
  context.restore();
};

const drawParticles = (
  context: CanvasRenderingContext2D,
  particles: Particle[],
  palette: VisualPalette,
  delta: number,
) => {
  context.save();
  context.globalCompositeOperation = palette.blendMode;
  context.lineCap = 'round';
  context.shadowBlur = 0;

  for (let index = particles.length - 1; index >= 0; index -= 1) {
    const particle = particles[index];
    particle.life -= delta;
    if (particle.life <= 0) {
      particles.splice(index, 1);
      continue;
    }

    const previousX = particle.x;
    const previousY = particle.y;
    const drag = Math.exp(-particle.drag * delta);
    particle.vx *= drag;
    particle.vy *= drag;
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;

    const alpha = (particle.life / particle.maxLife) * palette.particleOpacity;
    const rgb = particle.tone === 0 ? palette.primaryRgb : palette.secondaryRgb;
    context.strokeStyle = `rgba(${rgb}, ${alpha})`;
    context.lineWidth = Math.max(0.6, particle.size * alpha);
    context.beginPath();
    context.moveTo(previousX, previousY);
    context.lineTo(particle.x, particle.y);
    context.stroke();
  }

  context.restore();
};

const drawBowShock = (
  context: CanvasRenderingContext2D,
  pointer: PointerState,
  palette: VisualPalette,
  headAlpha: number,
) => {
  const intensity = clamp((pointer.speed - 650) / 1200, 0, 1) * headAlpha;
  if (intensity <= 0) return;

  context.save();
  context.translate(pointer.x, pointer.y);
  context.rotate(pointer.angle);
  context.globalCompositeOperation = palette.blendMode;
  context.strokeStyle = `rgba(${palette.primaryRgb}, ${intensity * 0.48})`;
  context.lineWidth = 1 + intensity;
  context.beginPath();
  context.moveTo(21, -21 - intensity * 9);
  context.quadraticCurveTo(48 + intensity * 12, 0, 21, 21 + intensity * 9);
  context.stroke();
  context.restore();
};

const drawMeteorHead = (
  context: CanvasRenderingContext2D,
  pointer: PointerState,
  palette: VisualPalette,
  now: number,
  headAlpha: number,
) => {
  if (headAlpha <= 0) return;

  const intensity = clamp(pointer.speed / 1400, 0, 1);
  const radius = 9 + intensity * 5;
  const aura = context.createRadialGradient(
    pointer.x - 2,
    pointer.y - 2,
    0,
    pointer.x,
    pointer.y,
    radius * 2.7,
  );
  aura.addColorStop(0, `rgba(${palette.hotRgb}, ${palette.headOpacity * headAlpha})`);
  aura.addColorStop(0.25, `rgba(${palette.primaryRgb}, ${palette.headOpacity * headAlpha * 0.7})`);
  aura.addColorStop(1, `rgba(${palette.secondaryRgb}, 0)`);

  context.save();
  context.globalCompositeOperation = palette.blendMode;
  context.fillStyle = aura;
  context.beginPath();
  context.arc(pointer.x, pointer.y, radius * 2.7, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = `rgba(${palette.hotRgb}, ${palette.headOpacity * headAlpha})`;
  context.beginPath();
  context.arc(pointer.x, pointer.y, 3.2 + intensity, 0, Math.PI * 2);
  context.fill();

  const rings = [
    { radius: radius + 6, dash: [3, 5], speed: 0.03, alpha: 0.5 },
    { radius: radius + 11, dash: [6, 6], speed: -0.021, alpha: 0.34 },
    { radius: radius + 16, dash: [2, 8], speed: 0.014, alpha: 0.22 },
  ];

  rings.forEach((ring, index) => {
    context.setLineDash(ring.dash);
    context.lineDashOffset = now * ring.speed;
    const rgb = index === 1 ? palette.secondaryRgb : palette.primaryRgb;
    context.strokeStyle = `rgba(${rgb}, ${ring.alpha * headAlpha})`;
    context.lineWidth = 0.85;
    context.beginPath();
    context.arc(pointer.x, pointer.y, ring.radius, 0, Math.PI * 2);
    context.stroke();
  });

  context.setLineDash([]);
  context.restore();
};

export default function CosmicMeteorSingularity() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pointerEnabled, setPointerEnabled] = useState(true);

  const togglePointer = useCallback(() => {
    setPointerEnabled((currentValue) => !currentValue);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return;

    const clearCanvas = () => {
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.restore();
    };

    if (!pointerEnabled) {
      clearCanvas();
      return;
    }

    let width = window.innerWidth;
    let height = window.innerHeight;
    let pixelRatio = getCanvasPixelRatio();
    let palette = document.documentElement.classList.contains('dark')
      ? THEME_PALETTES.dark
      : THEME_PALETTES.light;
    let animationFrame = 0;
    let lastFrame = performance.now();
    let lastEmberAt = 0;

    const trail: TrailPoint[] = [];
    const particles: Particle[] = [];
    const pointer: PointerState = {
      x: width * 0.5,
      y: height * 0.5,
      speed: 0,
      angle: 0,
      lastMove: 0,
      active: false,
    };

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      pixelRatio = getCanvasPixelRatio();
      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const requestRender = () => {
      if (animationFrame || document.hidden) return;
      lastFrame = performance.now();
      animationFrame = window.requestAnimationFrame(render);
    };

    const render = (now: number) => {
      animationFrame = 0;
      const delta = Math.min(0.034, Math.max(0.001, (now - lastFrame) / 1000));
      lastFrame = now;
      context.clearRect(0, 0, width, height);

      const idleTime = now - pointer.lastMove;
      pointer.speed *= Math.exp(-6.2 * delta);
      while (trail.length && now - trail[0].time > TRAIL_LIFETIME) trail.shift();

      const headAlpha = pointer.active ? clamp(1 - Math.max(0, idleTime - 90) / 310, 0, 1) : 0;
      drawParticles(context, particles, palette, delta);

      if (trail.length > 1) {
        const speedBoost = clamp(pointer.speed / 1500, 0, 1);
        drawTailLayer(
          context,
          trail,
          palette,
          palette.primaryRgb,
          13 + speedBoost * 7,
          palette.tailOpacity[0],
          6,
          now,
        );
        drawTailLayer(
          context,
          trail,
          palette,
          palette.secondaryRgb,
          7 + speedBoost * 4,
          palette.tailOpacity[1],
          3,
          now,
        );
        drawTailLayer(
          context,
          trail,
          palette,
          palette.filamentRgb,
          1.6 + speedBoost * 1.4,
          palette.tailOpacity[2],
          0,
          now,
        );
      }

      drawBowShock(context, pointer, palette, headAlpha);
      drawMeteorHead(context, pointer, palette, now, headAlpha);

      const hasActivity = trail.length > 0 || particles.length > 0 || headAlpha > 0.01;
      if (hasActivity && !document.hidden) {
        animationFrame = window.requestAnimationFrame(render);
      } else {
        pointer.active = false;
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      const now = performance.now();
      const deltaX = event.clientX - pointer.x;
      const deltaY = event.clientY - pointer.y;
      const distance = Math.hypot(deltaX, deltaY);
      const elapsed = pointer.lastMove ? Math.max(5, now - pointer.lastMove) : 16.67;
      const instantSpeed = clamp((distance / elapsed) * 1000, 0, 2600);

      if (distance > 1.2) {
        pointer.angle = Math.atan2(deltaY, deltaX);
        pointer.speed = pointer.speed * 0.34 + instantSpeed * 0.66;
        trail.push({
          x: event.clientX,
          y: event.clientY,
          time: now,
          velocity: instantSpeed,
          angle: pointer.angle,
        });
        if (trail.length > TRAIL_LIMIT) trail.shift();

        if (pointer.speed > 330 && now - lastEmberAt > 36) {
          lastEmberAt = now;
          spawnEmber(particles, pointer);
        }
      }

      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.lastMove = now;
      pointer.active = true;
      requestRender();
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest('[data-cosmic-pointer-control]')
      ) {
        return;
      }

      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.lastMove = performance.now();
      pointer.active = true;
      spawnImpact(particles, pointer.x, pointer.y);
      requestRender();
    };

    const handleWindowBlur = () => {
      trail.length = 0;
      pointer.speed = 0;
      pointer.active = false;
      requestRender();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animationFrame) window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        return;
      }

      if (trail.length || particles.length || pointer.active) requestRender();
    };

    const themeObserver = new MutationObserver(() => {
      palette = document.documentElement.classList.contains('dark')
        ? THEME_PALETTES.dark
        : THEME_PALETTES.light;
      requestRender();
    });

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      themeObserver.disconnect();
      clearCanvas();
    };
  }, [pointerEnabled]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-[45] block h-full w-full ${
          pointerEnabled ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        data-cosmic-pointer-control
        className="fixed right-4 top-4 z-[55] sm:right-6 sm:top-6"
      >
        <button
        type="button"
        onClick={togglePointer}
        aria-pressed={pointerEnabled}
        aria-label={pointerEnabled ? 'Matikan efek meteor pointer' : 'Aktifkan efek meteor pointer'}
          className="group relative grid h-12 w-12 place-items-center rounded-full text-accent-primary transition-transform duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-bg"
        >
          <span
            aria-hidden="true"
            className={`absolute -inset-2 rounded-full blur-lg transition-opacity duration-500 ${
              pointerEnabled ? 'bg-accent-primary/25 opacity-100' : 'bg-accent-primary/10 opacity-40'
            }`}
          />

          <span
            aria-hidden="true"
            className={`absolute -inset-[3px] rounded-full transition-opacity duration-300 ${
              pointerEnabled
                ? 'opacity-100 motion-safe:animate-[spin_3.5s_linear_infinite]'
                : 'opacity-35'
            }`}
            style={{
              background: pointerEnabled
                ? 'conic-gradient(from 0deg, transparent 0deg, rgba(139, 92, 246, 0.18) 150deg, rgba(139, 92, 246, 0.95) 315deg, transparent 360deg)'
                : 'conic-gradient(from 0deg, transparent, rgba(115, 115, 115, 0.5), transparent)',
            }}
          />

          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-accent-primary/20 bg-white/85 shadow-inner shadow-white/60 backdrop-blur-md dark:border-white/10 dark:bg-dark-card/90 dark:shadow-black/40"
          />

          <span
            aria-hidden="true"
            className={`absolute -inset-1 rounded-full ${
              pointerEnabled ? 'motion-safe:animate-[spin_2.6s_linear_infinite]' : ''
            }`}
          >
            <span
              className={`absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity ${
                pointerEnabled
                  ? 'bg-accent-primary opacity-100 shadow-[0_0_10px_3px_rgba(139,92,246,0.65)]'
                  : 'opacity-0'
              }`}
            />
          </span>

          <svg
            className={`relative h-5 w-5 transition-all duration-300 ${
              pointerEnabled
                ? 'scale-100 text-accent-primary drop-shadow-[0_0_5px_rgba(139,92,246,0.55)]'
                : 'cosmic-pointer-icon-idle scale-90 text-accent-primary/65'
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="m5 3 13 9-6 1.5L9 19 5 3Z" strokeLinejoin="round" />
          </svg>

          <span className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg border border-accent-primary/15 bg-white/90 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-text-light-primary opacity-0 shadow-lg backdrop-blur-md transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 dark:border-white/10 dark:bg-dark-card/90 dark:text-text-dark-primary">
            Pointer FX · {pointerEnabled ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>
    </>
  );
}
