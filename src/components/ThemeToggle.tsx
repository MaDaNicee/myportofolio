'use client';

import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? 'Aktifkan tema terang' : 'Aktifkan tema gelap'}
      className="group relative grid h-12 w-12 place-items-center rounded-full transition-transform duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-bg"
    >
      <span
        aria-hidden="true"
        className={`absolute -inset-2 rounded-full blur-lg transition-colors duration-500 ${
          isDark ? 'bg-accent-primary/25' : 'bg-amber-300/25'
        }`}
      />

      <span
        aria-hidden="true"
        className="absolute -inset-[3px] rounded-full motion-safe:animate-[spin_5s_linear_infinite]"
        style={{
          background: isDark
            ? 'conic-gradient(from 0deg, transparent 0deg, rgba(99, 102, 241, 0.18) 150deg, rgba(139, 92, 246, 0.95) 315deg, transparent 360deg)'
            : 'conic-gradient(from 0deg, transparent 0deg, rgba(251, 191, 36, 0.16) 150deg, rgba(245, 158, 11, 0.9) 315deg, transparent 360deg)',
        }}
      />

      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full border border-accent-primary/15 bg-white/85 shadow-inner shadow-white/60 backdrop-blur-md transition-colors duration-300 dark:border-white/10 dark:bg-dark-card/90 dark:shadow-black/40"
      />

      <span
        aria-hidden="true"
        className="absolute -inset-1 rounded-full motion-safe:animate-[spin_3.4s_linear_infinite]"
      >
        <span
          className={`absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-300 ${
            isDark
              ? 'bg-accent-primary shadow-[0_0_10px_3px_rgba(139,92,246,0.65)]'
              : 'bg-amber-400 shadow-[0_0_10px_3px_rgba(245,158,11,0.5)]'
          }`}
        />
      </span>

      <span className="relative flex h-5 w-5 items-center justify-center">
        <svg
          className={`absolute h-5 w-5 text-amber-500 transition-all duration-500 ${
            isDark ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.36 6.36-.7-.7M6.34 6.34l-.7-.7m12.72 0-.7.7M6.34 17.66l-.7.7M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
          />
        </svg>

        <svg
          className={`absolute h-5 w-5 text-accent-primary transition-all duration-500 ${
            isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.35 15.35A9 9 0 0 1 8.65 3.65 9 9 0 1 0 20.35 15.35Z"
          />
        </svg>
      </span>

      <span className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg border border-accent-primary/15 bg-white/90 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-text-light-primary opacity-0 shadow-lg backdrop-blur-md transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 dark:border-white/10 dark:bg-dark-card/90 dark:text-text-dark-primary">
        Tema · {isDark ? 'Gelap' : 'Terang'}
      </span>
    </button>
  );
}
