'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import type { ProfileData } from '@/lib/data';

export default function Navbar() {
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const response = await fetch('/api/profile', { cache: 'no-store' });
        if (!response.ok) return;

        const data = (await response.json()) as ProfileData[];
        if (isMounted && Array.isArray(data) && data[0]?.name) {
          setProfileName(data[0].name);
        }
      } catch (error) {
        console.warn('Gagal mengambil profile navbar dari API.', error);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-light-card/70 dark:bg-dark-card/70 backdrop-blur-md border border-light-border/50 dark:border-dark-border/50" />

          <div className="relative px-6 py-4 flex items-center justify-between">
            <motion.div
              className="text-xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent"
              whileHover={{ scale: 1.05 }}
            >
              {profileName}
            </motion.div>

            <div className="hidden md:flex items-center gap-8">
              <NavLink href="#home">Home</NavLink>
              <NavLink href="#projects">Projects</NavLink>
              <NavLink href="#about">About</NavLink>
              <NavLink href="#contact">Contact</NavLink>
            </div>

            <ThemeToggle />
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent" />
        </div>
      </div>
    </motion.nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <motion.a
      href={href}
      className="text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-primary dark:hover:text-accent-primary transition-colors duration-200 relative group"
      whileHover={{ y: -2 }}
    >
      {children}
      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-primary group-hover:w-full transition-all duration-300" />
    </motion.a>
  );
}
