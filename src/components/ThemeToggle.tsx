'use client';

import { useTheme } from './ThemeProvider';
import { motion } from 'framer-motion';

/**
 * ThemeToggle Component
 * Toggle button untuk switch antara dark dan light mode
 * Menggunakan Framer Motion untuk animasi yang smooth
 */
export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
    const { theme, toggleTheme } = useTheme();
    const buttonClassName = compact
        ? 'relative p-1.5 rounded-xl bg-dark-surface/50 dark:bg-dark-surface/50 border border-dark-border/50 dark:border-dark-border/50 backdrop-blur-md hover:bg-dark-hover/50 dark:hover:bg-dark-hover/50 transition-all duration-300 group'
        : 'relative p-2 rounded-lg bg-dark-surface/50 dark:bg-dark-surface/50 border border-dark-border/50 dark:border-dark-border/50 backdrop-blur-md hover:bg-dark-hover/50 dark:hover:bg-dark-hover/50 transition-all duration-300 group';
    const iconClassName = compact ? 'absolute w-5 h-5' : 'absolute w-6 h-6';
    const iconBoxClassName = compact ? 'relative w-5 h-5 flex items-center justify-center' : 'relative w-6 h-6 flex items-center justify-center';
    const glowClassName = 'absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 bg-accent-primary/10 blur-xl';

    return (
        <motion.button
            onClick={toggleTheme}
            className={buttonClassName}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle theme"
        >
            <div className={iconBoxClassName}>
                {/* Sun Icon (Light Mode) */}
                <motion.svg
                    className={`${iconClassName} text-amber-500`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    initial={{ scale: theme === 'dark' ? 0 : 1, rotate: theme === 'dark' ? 90 : 0 }}
                    animate={{ scale: theme === 'dark' ? 0 : 1, rotate: theme === 'dark' ? 90 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                </motion.svg>

                {/* Moon Icon (Dark Mode) */}
                <motion.svg
                    className={`${iconClassName} text-indigo-400`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    initial={{ scale: theme === 'light' ? 0 : 1, rotate: theme === 'light' ? -90 : 0 }}
                    animate={{ scale: theme === 'light' ? 0 : 1, rotate: theme === 'light' ? -90 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                </motion.svg>
            </div>

            {/* Glow effect on hover */}
            <div className={glowClassName} />
        </motion.button>
    );
}
