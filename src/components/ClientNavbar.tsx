'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import type { ProfileData } from '@/lib/data';
import { FiHome, FiGrid, FiUser, FiMail, FiAward, FiBriefcase, FiMessageSquare } from 'react-icons/fi';

const navLinks = [
  { name: 'Home', href: '#home', icon: <FiHome /> },
  { name: 'Projects', href: '#projects', icon: <FiGrid /> },
  { name: 'Experience', href: '#experience', icon: <FiBriefcase /> },
  { name: 'Certificates', href: '#certificates', icon: <FiAward /> },
  { name: 'About', href: '#about', icon: <FiUser /> },
  { name: 'Contact', href: '#contact', icon: <FiMail /> },
  { name: 'Comments', href: '#comments', icon: <FiMessageSquare /> },
];

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

  return initials || 'P';
}

function scrollToSection(
  event: React.MouseEvent<HTMLAnchorElement>,
  href: string,
  onNavigate?: (sectionId: string) => void,
) {
  if (!href.startsWith('#')) return;

  event.preventDefault();
  const sectionId = href.substring(1);
  onNavigate?.(sectionId);
  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Navbar() {
  const pathname = usePathname();
  const isAdminPath = pathname.startsWith('/admin');
  const isHomePath = pathname === '/';
  const [activeSection, setActiveSection] = useState('home');
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    if (isAdminPath) return;

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
  }, [isAdminPath]);

  useEffect(() => {
    if (isAdminPath) return;

    let animationFrame = 0;

    const updateActiveSection = () => {
      animationFrame = 0;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const activationPoint = scrollY + window.innerHeight * 0.55;
      let nextSection = navLinks[0].href.substring(1);

      for (const link of navLinks) {
        const sectionId = link.href.substring(1);
        const element = document.getElementById(sectionId);

        if (!element) continue;

        if (element.offsetTop <= activationPoint) {
          nextSection = sectionId;
        }
      }

      setActiveSection((currentSection) => (currentSection === nextSection ? currentSection : nextSection));
    };

    const scheduleActiveSectionUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateActiveSection);
    };

    window.addEventListener('scroll', scheduleActiveSectionUpdate, { passive: true });
    document.addEventListener('scroll', scheduleActiveSectionUpdate, { passive: true });
    window.addEventListener('resize', scheduleActiveSectionUpdate);
    window.addEventListener('hashchange', scheduleActiveSectionUpdate);

    updateActiveSection();
    window.setTimeout(updateActiveSection, 250);
    window.setTimeout(updateActiveSection, 800);

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('scroll', scheduleActiveSectionUpdate);
      document.removeEventListener('scroll', scheduleActiveSectionUpdate);
      window.removeEventListener('resize', scheduleActiveSectionUpdate);
      window.removeEventListener('hashchange', scheduleActiveSectionUpdate);
    };
  }, [isAdminPath]);

  if (isAdminPath) return null;

  const brandLabel = profileName || 'Home';

  return (
    <>
      <motion.nav
        className="fixed left-5 top-1/2 z-50 hidden md:block"
        initial={{ x: -120, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        aria-label="Primary navigation"
      >
        <div className="-translate-y-1/2">
          <div className="group/sidebar relative w-[62px] transition-[width] duration-300 ease-out hover:w-[232px] focus-within:w-[232px]">
          <div className="absolute inset-0 rounded-[1.35rem] border border-light-border/60 bg-light-card/85 shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-dark-card/85" />

          <div className="relative flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[1.35rem] p-2">
            <a
              href={isHomePath ? '#home' : '/#home'}
              onClick={(event) => scrollToSection(event, isHomePath ? '#home' : '/#home', setActiveSection)}
              className="flex h-10 items-center rounded-xl px-1 text-left outline-none transition-colors hover:bg-accent-primary/5 focus-visible:ring-2 focus-visible:ring-accent-primary"
              aria-label={brandLabel}
              title={brandLabel}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary text-xs font-black text-white shadow-lg shadow-accent-primary/25">
                {getInitials(profileName)}
              </span>
              <span className="ml-2.5 max-w-0 overflow-hidden whitespace-nowrap text-xs font-bold text-text-light-primary opacity-0 transition-all duration-300 group-hover/sidebar:max-w-[180px] group-hover/sidebar:opacity-100 group-focus-within/sidebar:max-w-[180px] group-focus-within/sidebar:opacity-100 dark:text-text-dark-primary">
                {profileName}
              </span>
            </a>

            <div className="my-2 h-px bg-gradient-to-r from-transparent via-light-border to-transparent dark:via-white/10" />

            <div className="flex flex-col gap-1.5">
              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  href={isHomePath ? link.href : `/${link.href}`}
                  icon={link.icon}
                  isActive={activeSection === link.href.substring(1)}
                  onNavigate={setActiveSection}
                >
                  {link.name}
                </NavLink>
              ))}
            </div>

            <div className="mt-2 border-t border-light-border/60 pt-2 dark:border-white/10">
              <div className="flex h-10 items-center rounded-xl px-1">
                <ThemeToggle compact />
                <span className="ml-2.5 max-w-0 overflow-hidden whitespace-nowrap text-xs font-semibold text-text-light-secondary opacity-0 transition-all duration-300 group-hover/sidebar:max-w-[130px] group-hover/sidebar:opacity-100 group-focus-within/sidebar:max-w-[130px] group-focus-within/sidebar:opacity-100 dark:text-text-dark-secondary">
                  Theme
                </span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-5 left-1/2 h-14 w-px -translate-x-1/2 bg-gradient-to-b from-accent-primary/60 to-transparent opacity-0 transition-opacity duration-300 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100" />
          </div>
        </div>
      </motion.nav>

      <motion.nav
        className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 md:hidden"
        initial={{ y: 90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        aria-label="Mobile navigation"
      >
        <div className="flex w-fit max-w-full items-center justify-center gap-0.5 overflow-x-auto rounded-2xl border border-light-border/60 bg-light-card/90 p-1.5 shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-dark-card/90">
          {navLinks.map((link) => (
            <MobileNavLink
              key={link.name}
              href={isHomePath ? link.href : `/${link.href}`}
              icon={link.icon}
              label={link.name}
              isActive={activeSection === link.href.substring(1)}
              onNavigate={setActiveSection}
            />
          ))}
          <div className="ml-1 border-l border-light-border/60 pl-2 dark:border-white/10">
            <ThemeToggle compact />
          </div>
        </div>
      </motion.nav>
    </>
  );
}

function NavLink({
  href,
  icon,
  children,
  isActive,
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
  onNavigate: (sectionId: string) => void;
}) {
  const label = String(children);

  return (
    <motion.a
      href={href}
      onClick={(event) => scrollToSection(event, href, onNavigate)}
      className={`
        group/item relative flex h-9 items-center rounded-xl px-2.5 outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-accent-primary
        ${
          isActive
            ? 'bg-accent-primary/10 text-accent-primary shadow-lg shadow-accent-primary/10'
            : 'text-text-light-secondary hover:bg-accent-primary/5 hover:text-accent-primary dark:text-text-dark-secondary'
        }
      `}
      whileHover={{ x: 2 }}
      aria-label={label}
      title={label}
    >
      <span className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center text-lg">
        {icon}
      </span>
      <span className="relative z-10 ml-2.5 max-w-0 overflow-hidden whitespace-nowrap text-xs font-semibold opacity-0 transition-all duration-300 group-hover/sidebar:max-w-[130px] group-hover/sidebar:opacity-100 group-focus-within/sidebar:max-w-[130px] group-focus-within/sidebar:opacity-100">
        {children}
      </span>

      {isActive && (
        <motion.span
          layoutId="activeSideNav"
          className="absolute inset-0 rounded-xl border border-accent-primary/25"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
    </motion.a>
  );
}

function MobileNavLink({
  href,
  icon,
  label,
  isActive,
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onNavigate: (sectionId: string) => void;
}) {
  return (
    <a
      href={href}
      onClick={(event) => scrollToSection(event, href, onNavigate)}
      className={`
        flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg outline-none transition-all focus-visible:ring-2 focus-visible:ring-accent-primary sm:h-10 sm:w-10
        ${
          isActive
            ? 'bg-accent-primary/15 text-accent-primary'
            : 'text-text-light-secondary hover:bg-accent-primary/5 hover:text-accent-primary dark:text-text-dark-secondary'
        }
      `}
      aria-label={label}
      title={label}
    >
      {icon}
    </a>
  );
}
