'use client';

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from "next/image";
import { AnimatePresence, motion } from 'framer-motion';
import ProjectCard from '@/components/ProjectCard';
import SkillSlider from '@/components/SkillSlider';
import FadeIn from '@/components/FadeIn';
import MagneticButton from '@/components/MagneticButton';
import DecryptedText from '@/components/react-bits/DecryptedText'; 
import ShinyText from '@/components/react-bits/ShinyText';       
import { buildSkillsData, type ApiSkill, type Certificate, type Experience, type PortfolioComment, type ProfileData, type Project } from '@/lib/data';
import { FiAlertTriangle, FiChevronLeft, FiChevronRight, FiEdit3, FiLock, FiMessageCircle, FiMessageSquare, FiPlus, FiSend, FiTrash2, FiX } from 'react-icons/fi';

const DynamicScrollScene3D = dynamic(() => import('@/components/ScrollScene3D'), {
  ssr: false,
  loading: () => null,
});

const DynamicPhotoCard3D = dynamic(() => import('@/components/PhotoCard3D'), {
  ssr: false,
  loading: () => (
    <div className="mx-auto aspect-[4/5] w-full max-w-sm rounded-3xl border border-white/20 bg-white/10 shadow-2xl shadow-accent-primary/10 dark:bg-black/20" />
  ),
});

const DynamicMeteors = dynamic(() => import('@/components/Meteors'), {
  ssr: false,
  loading: () => null,
});


const DynamicContactForm = dynamic(() => import('@/components/ContactForm'), {
  ssr: false,
  loading: () => <div className="h-[344px] rounded-2xl bg-white/30 dark:bg-white/5" />,
});


const DynamicCertificateModal = dynamic(() => import('@/components/CertificateModal'), {
  ssr: false,
  loading: () => null,
});

const DynamicCvPreviewModal = dynamic(() => import('@/components/CvPreviewModal'), {
  ssr: false,
  loading: () => null,
});

function LazyScrollScene3D() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const lowMemoryDevice = typeof deviceMemory === 'number' && deviceMemory <= 2;

    if (prefersReducedMotion || lowMemoryDevice) return;

    const timeoutId = window.setTimeout(() => setIsReady(true), window.innerWidth < 768 ? 900 : 450);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return isReady ? <DynamicScrollScene3D /> : null;
}

export type HomePageData = {
  profile: ProfileData;
  projects: Project[];
  experiences: Experience[];
  certificates: Certificate[];
  skills: ApiSkill[];
  comments: PortfolioComment[];
  currentYear: number;
};

function getProfileInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return initials || "P";
}

export default function HomePageClient({ initialData }: { initialData: HomePageData }) {
  const profile = initialData.profile;
  const projectItems = initialData.projects;
  const experienceItems = initialData.experiences;
  const certificateItems = initialData.certificates;
  const skillRows = useMemo(() => buildSkillsData(initialData.skills), [initialData.skills]);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [isCVOpen, setIsCVOpen] = useState(false);
  const cvUrl = profile.cvUrl ?? "";
  const [commentItems, setCommentItems] = useState<PortfolioComment[]>(initialData.comments);
  const [editingCommentId, setEditingCommentId] = useState<PortfolioComment["id"] | null>(null);
  const [commentForm, setCommentForm] = useState({ name: "", role: "", message: "", password: "" });
  const [deletingComment, setDeletingComment] = useState<PortfolioComment | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [commentError, setCommentError] = useState("");
  const [isCommentSaving, setIsCommentSaving] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [activeCommentIndex, setActiveCommentIndex] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatTopic, setActiveChatTopic] = useState("project");
  const commentFormRef = useRef<HTMLFormElement>(null);
  const isCommentSliderPausedRef = useRef(false);
  const chatPrompts = useMemo(
    () => [
      {
        id: "project",
        label: "Project baru",
        message: `Halo ${profile.nickname || profile.name}, saya ingin diskusi project web.`,
      },
      {
        id: "portfolio",
        label: "Portfolio",
        message: `Halo ${profile.nickname || profile.name}, saya baru melihat portfolio kamu dan ingin bertanya lebih lanjut.`,
      },
      {
        id: "collab",
        label: "Kolaborasi",
        message: `Halo ${profile.nickname || profile.name}, saya tertarik untuk kolaborasi.`,
      },
    ],
    [profile.name, profile.nickname],
  );
  const activeChatPrompt = chatPrompts.find((prompt) => prompt.id === activeChatTopic) ?? chatPrompts[0];
  const whatsappNumber = profile.phone.replace(/\D/g, "");
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(activeChatPrompt.message)}`
    : "#contact";

  const resetCommentForm = () => {
    setCommentForm({ name: "", role: "", message: "", password: "" });
    setEditingCommentId(null);
    setCommentError("");
  };

  const openAddCommentModal = () => {
    resetCommentForm();
    setIsCommentModalOpen(true);
  };

  const closeCommentModal = () => {
    if (isCommentSaving) return;

    resetCommentForm();
    setIsCommentModalOpen(false);
  };

  const formatCommentDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const readCommentApiError = async (response: Response, fallback: string) => {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;

    return data?.error || fallback;
  };

  const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = commentForm.name.trim();
    const role = commentForm.role.trim() || "Visitor";
    const message = commentForm.message.trim();
    const password = commentForm.password;

    if (!name || !message || isCommentSaving) return;

    if (password.trim().length < 6) {
      setCommentError("Password komentar minimal 6 karakter.");
      return;
    }

    const payload = { name, role, message, password };

    setCommentError("");
    setIsCommentSaving(true);

    try {
      if (editingCommentId) {
        const response = await fetch(`/api/comments/${encodeURIComponent(String(editingCommentId))}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(await readCommentApiError(response, "Komentar gagal diperbarui."));
        }

        const updatedComment = (await response.json()) as PortfolioComment;

        setCommentItems((currentComments) =>
          currentComments.map((comment) => (comment.id === editingCommentId ? updatedComment : comment)),
        );
      } else {
        const response = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(await readCommentApiError(response, "Komentar gagal disimpan."));
        }

        const createdComment = (await response.json()) as PortfolioComment;

        setCommentItems((currentComments) => [createdComment, ...currentComments]);
        setActiveCommentIndex(0);
      }

      resetCommentForm();
      setIsCommentModalOpen(false);
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan komentar.");
    } finally {
      setIsCommentSaving(false);
    }
  };

  const handleEditComment = (comment: PortfolioComment) => {
    setDeletingComment(null);
    setDeletePassword("");
    setCommentError("");
    setEditingCommentId(comment.id);
    setCommentForm({ name: comment.name, role: comment.role, message: comment.message, password: "" });
    setIsCommentModalOpen(true);
  };

  const openDeleteCommentModal = (comment: PortfolioComment) => {
    setIsCommentModalOpen(false);
    setDeletingComment(comment);
    setDeletePassword("");
    setCommentError("");
  };

  const closeDeleteCommentModal = () => {
    if (isCommentSaving) return;

    setDeletingComment(null);
    setDeletePassword("");
    setCommentError("");
  };

  const handleDeleteComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!deletingComment || isCommentSaving) return;

    if (deletePassword.trim().length < 6) {
      setCommentError("Password komentar minimal 6 karakter.");
      return;
    }

    setCommentError("");
    setIsCommentSaving(true);

    try {
      const response = await fetch(`/api/comments/${encodeURIComponent(String(deletingComment.id))}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });

      if (!response.ok) {
        throw new Error(await readCommentApiError(response, "Komentar gagal dihapus."));
      }

      const remainingComments = commentItems.filter((comment) => comment.id !== deletingComment.id);

      setCommentItems(remainingComments);
      setActiveCommentIndex((currentIndex) =>
        remainingComments.length ? currentIndex % remainingComments.length : 0,
      );
      setDeletingComment(null);
      setDeletePassword("");
      setCommentError("");
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : "Terjadi kesalahan saat menghapus komentar.");
    } finally {
      setIsCommentSaving(false);
    }
  };

  const scrollCommentSlider = (direction: "left" | "right") => {
    setActiveCommentIndex((currentIndex) => {
      if (commentItems.length <= 1) return 0;

      return direction === "right"
        ? (currentIndex - 1 + commentItems.length) % commentItems.length
        : (currentIndex + 1) % commentItems.length;
    });
  };

  const setCommentSliderPaused = (isPaused: boolean) => {
    isCommentSliderPausedRef.current = isPaused;
  };

  const commentCarouselCards = useMemo(() => {
    const totalComments = commentItems.length;

    if (!totalComments) return [];

    const normalizedIndex = ((activeCommentIndex % totalComments) + totalComments) % totalComments;
    const getComment = (offset: number) => commentItems[(normalizedIndex + offset + totalComments) % totalComments];

    if (totalComments === 1) {
      return [{ comment: getComment(0), slot: "center" as const }];
    }

    if (totalComments === 2) {
      return [
        { comment: getComment(0), slot: "center" as const },
        { comment: getComment(1), slot: "right" as const },
      ];
    }

    return [
      { comment: getComment(-1), slot: "left" as const },
      { comment: getComment(0), slot: "center" as const },
      { comment: getComment(1), slot: "right" as const },
    ];
  }, [activeCommentIndex, commentItems]);

  useEffect(() => {
    setActiveCommentIndex((currentIndex) => {
      if (!commentItems.length) return 0;

      return ((currentIndex % commentItems.length) + commentItems.length) % commentItems.length;
    });
  }, [commentItems.length]);

  useEffect(() => {
    if (commentItems.length <= 1) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const intervalId = window.setInterval(() => {
      if (isCommentSliderPausedRef.current || isCommentModalOpen || deletingComment) return;

      setActiveCommentIndex((currentIndex) => (currentIndex - 1 + commentItems.length) % commentItems.length);
    }, 3300);

    return () => window.clearInterval(intervalId);
  }, [commentItems.length, deletingComment, isCommentModalOpen]);

  return (
    <main className="min-h-screen overflow-hidden relative transition-colors duration-300">
      
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-light-bg/50 to-light-bg dark:via-dark-bg/50 dark:to-dark-bg pointer-events-none z-0" />
      <LazyScrollScene3D />

      {/* ================= HERO SECTION ================= */}
      <section id="home" className="relative pt-28 pb-20 lg:pt-32 lg:pb-28 z-10">
        
        {/* Ambient Glows */}
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-accent-primary/20 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-secondary/20 rounded-full blur-[100px] -z-10" />

        {/* Dekorasi Dot Pattern */}
        <div className="absolute top-40 left-10 -z-10 hidden lg:block opacity-40">
            <svg width="200" height="200" fill="none" viewBox="0 0 200 200">
                <defs>
                    <pattern id="dots-left" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <rect x="0" y="0" width="2" height="2" className="text-text-light-primary dark:text-text-dark-primary" fill="currentColor" />
                    </pattern>
                </defs>
                <rect width="200" height="200" fill="url(#dots-left)" />
            </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-20">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(300px,420px)_minmax(0,0.95fr)] lg:gap-8">
            
            {/* === KIRI: KONTEN TEKS === */}
            <div className="order-1 text-center md:max-w-xl md:mx-auto lg:max-w-none lg:text-left lg:pr-2 relative">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 border border-light-border/50 dark:border-white/10 backdrop-blur-md mb-8 shadow-sm ring-1 ring-black/5 dark:ring-white/5"
              >
                <span className="flex h-2.5 w-2.5 bg-accent-primary rounded-full mr-3 animate-pulse"></span>
                <ShinyText text="Available for new opportunities" disabled={false} speed={3} className="text-accent-primary font-semibold text-sm tracking-wide" />
              </motion.div>

              <h1 className="text-4xl tracking-tight font-extrabold text-text-light-primary dark:text-text-dark-primary sm:text-5xl lg:text-6xl lg:leading-tight mb-6">
                <span className="block text-text-light-secondary dark:text-text-dark-secondary text-2xl sm:text-3xl md:text-4xl font-bold">Hi, I&apos;m</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">
                  {profile.nickname}
                </span>
              </h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-6 max-w-md rounded-2xl border border-light-border/70 bg-white/70 px-5 py-4 text-base leading-8 text-text-light-secondary shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-black/45 dark:text-text-dark-primary md:text-lg lg:mx-0"
              >
                {profile.bio}
              </motion.p>
            </div>

            {/* === TENGAH: FOTO CENTER === */}
            <div className="order-2 relative z-20 flex justify-center">
              {profile.avatar && <DynamicPhotoCard3D src={profile.avatar} alt={profile.name || "Profile photo"} />}
            </div>

            {/* === KANAN: TITLE & ACTION === */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="order-3 relative mx-auto w-full max-w-md text-center lg:mx-0 lg:text-left"
            >
              <div className="absolute -inset-5 rounded-[2rem] border border-accent-primary/10 bg-gradient-to-br from-accent-primary/10 via-transparent to-accent-secondary/10 blur-[1px]" />
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-accent-primary/25 bg-accent-primary/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-accent-primary">
                  <span className="h-2 w-2 rounded-full bg-accent-primary shadow-[0_0_14px_rgba(139,92,246,0.9)]" />
                  Creative Frontend
                </span>

                <h2 className="mt-5 max-w-[10ch] mx-auto lg:mx-0 text-4xl sm:text-5xl lg:text-[3.75rem] font-extrabold leading-[0.96] text-text-light-primary dark:text-text-dark-primary">
                  <DecryptedText
                    text={profile.title}
                    animateOn="view"
                    revealDirection="center"
                    speed={80}
                    maxIterations={10}
                    className="text-inherit"
                    parentClassName="inline-block !whitespace-normal break-words"
                    characters="ABCD1234!?"
                  />
                </h2>

                <p className="mt-5 max-w-sm rounded-2xl border border-light-border/70 bg-white/70 px-5 py-4 text-sm leading-7 text-text-light-secondary shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-black/45 dark:text-text-dark-primary md:text-base lg:mx-0">
                  Building responsive interfaces with clean code, interactive details, and a practical fullstack mindset.
                </p>

                <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                  <MagneticButton 
                    href="#projects"
                    className="col-span-full flex h-16 w-full items-center justify-between rounded-[1.35rem] bg-gradient-to-r from-accent-primary to-accent-secondary px-6 text-base font-bold text-white shadow-2xl shadow-accent-primary/35 transition-all hover:-translate-y-1 hover:shadow-accent-primary/45"
                  >
                    <span>View My Work</span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                    </span>
                  </MagneticButton>

                  {cvUrl && (
                    <button 
                      onClick={() => setIsCVOpen(true)}
                      className="group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-[1.15rem] border border-accent-primary/25 bg-accent-primary/90 px-5 text-sm font-bold text-white shadow-xl shadow-accent-primary/25 transition-all hover:-translate-y-1 hover:bg-accent-hover hover:shadow-accent-primary/35"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/16 to-white/0 opacity-0 transition-opacity group-hover:opacity-100" />
                      <span className="relative">Preview CV</span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="relative h-5 w-5 transition-transform duration-300 group-hover:scale-110">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    </button>
                  )}

                  <MagneticButton 
                    href="#contact"
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-[1.15rem] border border-light-border/70 bg-white/65 px-5 text-sm font-bold text-text-light-primary shadow-lg shadow-black/5 backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white/85 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/12"
                  >
                    <span>Contact Me</span>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </MagneticButton>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= PROJECTS SECTION ================= */}
      <section id="projects" className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-text-light-primary dark:text-text-dark-primary">Featured Projects</h2>
              <div className="w-24 h-1.5 bg-gradient-to-r from-accent-primary to-accent-secondary mx-auto rounded-full mb-6"></div>
              <p className="text-text-light-secondary dark:text-text-dark-secondary max-w-2xl mx-auto text-lg">
                Showcasing my passion for building clean, efficient, and scalable web applications.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projectItems.map((project, index) => (
              <FadeIn key={project.id} delay={index * 0.1}>
                <div className="h-full rounded-3xl border border-light-border dark:border-white/10 bg-white/40 dark:bg-white/10 backdrop-blur-lg overflow-hidden hover:border-accent-primary/40 transition-all duration-300 hover:shadow-2xl dark:shadow-black/20">
                   <ProjectCard project={project} index={index} />
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ================= EXPERIENCE SECTION ================= */}
      <section id="experience" className="py-24 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-text-light-primary dark:text-text-dark-primary">Experience</h2>
              <div className="w-24 h-1.5 bg-gradient-to-r from-accent-primary to-accent-secondary mx-auto rounded-full mb-6"></div>
              <p className="text-text-light-secondary dark:text-text-dark-secondary max-w-2xl mx-auto text-lg">
                A snapshot of practical work, collaboration, and project-based learning.
              </p>
            </div>
          </FadeIn>

          <div className="relative">
            <div className="hidden md:block absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-accent-primary via-accent-secondary to-transparent" />

            <div className="space-y-8">
              {experienceItems.map((experience, index) => (
                <FadeIn key={experience.id} delay={index * 0.1}>
                  <article className="relative md:pl-20">
                    <div className="hidden md:flex absolute left-0 top-8 h-12 w-12 items-center justify-center rounded-full border border-accent-primary/30 bg-white/80 dark:bg-dark-card text-accent-primary font-bold shadow-lg shadow-accent-primary/10">
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    <div className="rounded-3xl border border-light-border dark:border-white/10 bg-white/50 dark:bg-black/25 backdrop-blur-xl p-6 md:p-8 shadow-xl hover:border-accent-primary/40 hover:shadow-2xl transition-all duration-300">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
                        <div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-semibold border border-accent-primary/20 mb-4">
                            {experience.type}
                          </span>
                          <h3 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
                            {experience.role}
                          </h3>
                          <p className="text-base font-semibold text-text-light-secondary dark:text-text-dark-secondary">
                            {experience.company}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                          <span className="px-3 py-1.5 rounded-full bg-light-surface dark:bg-white/5 border border-light-border dark:border-white/10">
                            {experience.period}
                          </span>
                          <span className="px-3 py-1.5 rounded-full bg-light-surface dark:bg-white/5 border border-light-border dark:border-white/10">
                            {experience.location}
                          </span>
                        </div>
                      </div>

                      <p className="text-text-light-secondary dark:text-text-dark-secondary leading-relaxed">
                        {experience.description}
                      </p>

                      <ul className="mt-6 grid gap-3">
                        {experience.highlights.map((highlight) => (
                          <li key={highlight} className="flex gap-3 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-6 flex flex-wrap gap-2">
                        {experience.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="px-3 py-1 text-xs rounded-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-text-light-secondary dark:text-text-dark-secondary"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= CERTIFICATES SECTION ================= */}
       <section id="certificates" className="py-24 px-6 relative z-10 bg-light-surface/30 dark:bg-black/10">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-text-light-primary dark:text-text-dark-primary">
                Certifications
              </h2>
              <div className="w-24 h-1.5 bg-gradient-to-r from-accent-primary to-accent-secondary mx-auto rounded-full mb-6"></div>
              <p className="text-text-light-secondary dark:text-text-dark-secondary max-w-2xl mx-auto text-lg">
                Continuous learning and professional validation of my skills.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {certificateItems.map((cert, index) => (
              <FadeIn key={cert.id} delay={index * 0.1}>
                <button
                  type="button"
                  onClick={() => setSelectedCertificate(cert)}
                  className="w-full text-left group cursor-pointer rounded-2xl border border-light-border dark:border-white/10 bg-white/40 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/10 backdrop-blur-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-2 overflow-hidden flex flex-col h-full focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 dark:focus:ring-offset-dark-bg"
                >
                  <div className="relative h-48 w-full bg-light-surface dark:bg-black/30 overflow-hidden">
                    {cert.imageUrl ? (
                      <Image
                        src={cert.imageUrl}
                        alt={cert.name}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-text-light-muted dark:text-white/20">
                         <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M13 9h-2v2h2V9zm-2 4h2v6h-2v-6zm4-12c-1.1 0-2 .9-2 2v2h-4V3c0-1.1-.9-2-2-2s-2 .9-2 2v2H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-2V3c0-1.1-.9-2-2-2s-2 .9-2 2z"/></svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                       <span className="text-white bg-white/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/30 text-sm font-medium flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          View Detail
                       </span>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-3">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-accent-primary/10 text-accent-primary font-semibold border border-accent-primary/20">
                          {cert.issuer}
                        </span>
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-text-light-primary dark:text-text-dark-primary group-hover:text-accent-primary transition-colors line-clamp-2">
                      {cert.name}
                    </h3>
                    <div className="mt-auto pt-4 border-t border-light-border/50 dark:border-white/10 flex items-center justify-between text-sm text-text-light-secondary dark:text-text-dark-secondary">
                      <span>{cert.date}</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </button>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ================= ABOUT & SKILLS SECTION ================= */}
      <section id="about" className="py-24 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          
          <FadeIn>
            <div className="relative rounded-[3rem] p-8 md:p-16 border border-light-border/50 dark:border-white/10 bg-white/50 dark:bg-black/25 backdrop-blur-2xl shadow-2xl overflow-hidden">
                <div className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-30">
                    <DynamicMeteors number={12} />
                </div>
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-accent-primary/10 rounded-full blur-3xl -z-10" />
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-accent-secondary/10 rounded-full blur-3xl -z-10" />

                <div className="relative z-10">
                    <div className="text-center mb-12">
                      <h2 className="text-3xl md:text-5xl font-bold mb-4 text-text-light-primary dark:text-text-dark-primary">About Me</h2>
                      <div className="w-24 h-1.5 bg-gradient-to-r from-accent-primary to-accent-secondary mx-auto rounded-full"></div>
                    </div>

                    <div className="text-center mb-16">
                      <p className="text-lg md:text-xl text-text-light-secondary dark:text-text-dark-secondary mb-6 leading-relaxed font-light">
                        I am a dedicated developer who loves turning complex problems into simple, beautiful, and intuitive designs. 
                        My journey in web development started with a curiosity for how things work on the internet, and it has evolved into a passion for building robust applications.
                      </p>
                      
                      <div className="flex justify-center mt-8">
                          <MagneticButton
                            href="#contact"
                            className="inline-flex items-center gap-3 text-accent-primary font-bold text-lg px-8 py-3 rounded-full bg-white/50 dark:bg-white/10 border border-light-border dark:border-white/10 hover:bg-accent-primary/10 transition-all group backdrop-blur-md shadow-sm"
                          >
                            <span className="group-hover:underline decoration-2 underline-offset-4">Start a Conversation</span>
                            <motion.span className="inline-block text-xl" variants={{ hover: { x: 5 } }} transition={{ type: "spring", stiffness: 400 }}>&rarr;</motion.span>
                          </MagneticButton>
                      </div>
                    </div>
                    
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-light-border dark:via-white/10 to-transparent my-12"></div>

                    <div className="relative flex flex-col justify-center">
                        <h3 className="text-2xl font-bold mb-8 text-center text-text-light-primary dark:text-text-dark-primary">
                          My Tech Stack
                        </h3>
                        <SkillSlider skills={skillRows.row1} direction="left" />
                        <div className="h-3"></div>
                        <SkillSlider skills={skillRows.row2} direction="right" />
                    </div>
                </div>
            </div>
          </FadeIn>

        </div>
      </section>

      {/* ================= CONTACT SECTION ================= */}
      <section id="contact" className="py-24 px-6 relative z-10">
         <div className="max-w-7xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-4 text-text-light-primary dark:text-text-dark-primary">
                  Let&apos;s Connect
                </h2>
                <div className="w-24 h-1.5 bg-gradient-to-r from-accent-primary to-accent-secondary mx-auto rounded-full mb-6"></div>
                <p className="text-lg text-text-light-secondary dark:text-text-dark-secondary max-w-2xl mx-auto">
                    Have a project in mind or just want to say hi? Feel free to send me a message or connect via social media.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                <div className="p-8 rounded-[2rem] border border-light-border/50 dark:border-white/10 bg-white/50 dark:bg-black/25 backdrop-blur-xl shadow-2xl">
                    <h3 className="text-2xl font-bold mb-6 text-text-light-primary dark:text-text-dark-primary flex items-center gap-3">
                       <span className="flex items-center justify-center w-10 h-10 rounded-full bg-accent-primary/10 text-accent-primary">✉️</span> 
                       Send a Message
                    </h3>
                    <DynamicContactForm />
                </div>

                <div className="flex flex-col gap-4">
                      {[
                        profile.email ? { href: `mailto:${profile.email}`, icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>, title: "Email Me", text: profile.email } : null,
                        profile.linkedin ? { href: profile.linkedin, icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>, title: "LinkedIn", text: "Connect professionally" } : null,
                        profile.github ? { href: profile.github, icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>, title: "GitHub", text: "See my code" } : null,
                        profile.phone.replace(/\D/g, '') ? { href: `https://wa.me/${profile.phone.replace(/\D/g, '')}`, icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>, title: "WhatsApp", text: "Quick Chat" } : null
                      ].map((contact) => contact ? (
                        <a key={contact.title} href={contact.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-5 p-5 rounded-2xl border border-light-border dark:border-white/10 bg-white/50 dark:bg-black/25 backdrop-blur-md hover:bg-white/80 dark:hover:bg-white/10 hover:border-accent-primary/50 transition-all group hover:-translate-y-1 shadow-lg">
                           <div className="p-3.5 rounded-full bg-accent-primary/10 text-accent-primary group-hover:scale-110 transition-transform">
                             {contact.icon}
                           </div>
                           <div>
                               <h4 className="font-bold text-text-light-primary dark:text-text-dark-primary">{contact.title}</h4>
                               <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">{contact.text}</span>
                           </div>
                        </a>
                      ) : null)}
                </div>
              </div>
            </FadeIn>
         </div>
      </section>

      {/* ================= COMMENTS SECTION ================= */}
      <section id="comments" className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-text-light-primary dark:text-text-dark-primary">Komen</h2>
              <div className="w-24 h-1.5 bg-gradient-to-r from-accent-primary to-accent-secondary mx-auto rounded-full mb-6"></div>
              <p className="text-lg text-text-light-secondary dark:text-text-dark-secondary max-w-2xl mx-auto">
                Bagikan pesan, masukan, atau kesanmu tentang portfolio ini. Komentar akan tampil langsung di halaman.
              </p>
            </div>
          </FadeIn>

          <div className="relative">
            <div className="mb-6 flex flex-col items-center gap-4 rounded-[2rem] border border-light-border/70 bg-white/45 p-4 text-center shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-black/25 md:flex-row md:text-left md:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-accent-primary">Komentar Terbaru</p>
                <p className="mt-1 text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary">
                  {commentItems.length} pesan dari pengunjung
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={openAddCommentModal}
                  className="flex h-11 min-w-[170px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent-primary to-accent-secondary px-5 text-sm font-bold text-white shadow-xl shadow-accent-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-accent-primary/40"
                >
                  <FiPlus className="h-4 w-4" />
                  Tambah Komen
                </button>
              </div>
            </div>

            {commentItems.length === 0 ? (
              <FadeIn>
                <div className="rounded-3xl border border-dashed border-light-border bg-white/30 p-8 text-center text-text-light-secondary backdrop-blur-xl dark:border-white/10 dark:bg-black/20 dark:text-text-dark-secondary">
                  Belum ada komen.
                </div>
              </FadeIn>
            ) : (
              <div
                className="relative overflow-hidden rounded-[2.5rem] border border-light-border/70 bg-white/35 px-0 py-8 shadow-2xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-black/20 sm:px-6 md:px-10"
                onMouseEnter={() => setCommentSliderPaused(true)}
                onMouseLeave={() => setCommentSliderPaused(false)}
                onFocusCapture={() => setCommentSliderPaused(true)}
                onBlurCapture={() => setCommentSliderPaused(false)}
                onTouchStart={() => setCommentSliderPaused(true)}
                onTouchEnd={() => setCommentSliderPaused(false)}
              >
                <div aria-hidden="true" className="absolute inset-x-10 top-8 h-px bg-gradient-to-r from-transparent via-accent-primary/40 to-transparent" />
                <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-primary/10 blur-3xl dark:bg-accent-primary/20" />
                <div aria-hidden="true" className="absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-accent-secondary/10 blur-3xl" />

                <button
                  type="button"
                  onClick={() => scrollCommentSlider("left")}
                  disabled={commentItems.length <= 1}
                  className="absolute left-3 top-1/2 z-40 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl border border-light-border/70 bg-white/80 text-text-light-secondary shadow-2xl shadow-black/10 backdrop-blur-xl transition-all hover:-translate-x-0.5 hover:border-accent-primary/40 hover:text-accent-primary disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-black/60 dark:text-text-dark-secondary md:left-6 md:h-14 md:w-14 md:rounded-3xl"
                  aria-label="Komentar sebelumnya"
                >
                  <FiChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCommentSlider("right")}
                  disabled={commentItems.length <= 1}
                  className="absolute right-3 top-1/2 z-40 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl border border-light-border/70 bg-white/80 text-text-light-secondary shadow-2xl shadow-black/10 backdrop-blur-xl transition-all hover:translate-x-0.5 hover:border-accent-primary/40 hover:text-accent-primary disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-black/60 dark:text-text-dark-secondary md:right-6 md:h-14 md:w-14 md:rounded-3xl"
                  aria-label="Komentar berikutnya"
                >
                  <FiChevronRight className="h-6 w-6" />
                </button>

                <div className="relative mx-auto h-[430px] max-w-6xl [perspective:1400px] sm:h-[400px] md:h-[380px]">
                  <AnimatePresence initial={false} mode="popLayout">
                    {commentCarouselCards.map(({ comment, slot }) => {
                      const isCenter = slot === "center";
                      const leftPosition = slot === "left" ? "29%" : slot === "right" ? "71%" : "50%";

                      return (
                        <motion.article
                          key={comment.id}
                          initial={{ left: "86%", x: "-50%", y: "-50%", scale: 0.72, rotateY: 24, opacity: 0 }}
                          animate={{
                            left: leftPosition,
                            x: "-50%",
                            y: "-50%",
                            scale: isCenter ? 1 : 0.82,
                            rotateY: slot === "left" ? -22 : slot === "right" ? 22 : 0,
                            rotateZ: slot === "left" ? -2 : slot === "right" ? 2 : 0,
                            opacity: isCenter ? 1 : 0.48,
                            filter: isCenter ? "blur(0px)" : "blur(1.1px)",
                          }}
                          exit={{ left: "12%", x: "-50%", y: "-50%", scale: 0.72, rotateY: -24, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 150, damping: 24, mass: 0.95 }}
                          className={`absolute top-1/2 flex min-h-[330px] w-[min(86vw,500px)] flex-col justify-between overflow-hidden rounded-[2rem] border p-6 backdrop-blur-2xl md:min-h-[310px] ${isCenter ? "border-accent-primary/35 bg-white/75 shadow-2xl shadow-accent-primary/20 dark:bg-black/55" : "border-light-border/60 bg-white/45 shadow-xl shadow-black/5 dark:border-white/10 dark:bg-black/30"}`}
                          style={{ transformStyle: "preserve-3d", zIndex: isCenter ? 30 : 10, pointerEvents: isCenter ? "auto" : "none" }}
                          aria-hidden={!isCenter}
                        >
                          <motion.div
                            aria-hidden="true"
                            className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent-primary/20 blur-3xl"
                            animate={isCenter ? { scale: [1, 1.14, 1], opacity: [0.55, 0.9, 0.55] } : { scale: 1, opacity: 0.35 }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                          />
                          <div aria-hidden="true" className="absolute -bottom-20 left-8 h-32 w-32 rounded-full bg-accent-secondary/10 blur-3xl" />
                          <div aria-hidden="true" className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-70" />

                          <div className="relative z-10 flex items-start justify-between gap-4">
                            <div className="flex min-w-0 items-start gap-4">
                              <div className={`${isCenter ? "h-14 w-14 rounded-[1.35rem]" : "h-12 w-12 rounded-2xl"} flex shrink-0 items-center justify-center bg-gradient-to-br from-accent-primary to-accent-secondary text-sm font-black text-white shadow-lg shadow-accent-primary/25`}>
                                {getProfileInitials(comment.name)}
                              </div>
                              <div className="min-w-0">
                                <h3 className={`${isCenter ? "text-xl" : "text-lg"} truncate font-bold text-text-light-primary dark:text-text-dark-primary`}>{comment.name}</h3>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                                  <span className="max-w-[160px] truncate rounded-full border border-light-border/70 bg-white/60 px-2.5 py-1 dark:border-white/10 dark:bg-white/5">
                                    {comment.role}
                                  </span>
                                  <span>{formatCommentDate(comment.createdAt)}</span>
                                </div>
                              </div>
                            </div>

                            {isCenter ? (
                              <div className="relative z-20 flex shrink-0 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditComment(comment)}
                                  className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-xl border border-light-border/70 bg-white/70 text-text-light-secondary shadow-lg shadow-black/5 transition-all active:scale-95 hover:border-accent-primary/40 hover:text-accent-primary dark:border-white/10 dark:bg-white/10 dark:text-text-dark-secondary md:h-10 md:w-10"
                                  aria-label={`Edit komen dari ${comment.name}`}
                                >
                                  <FiEdit3 className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openDeleteCommentModal(comment)}
                                  className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-xl border border-light-border/70 bg-white/70 text-text-light-secondary shadow-lg shadow-black/5 transition-all active:scale-95 hover:border-red-400/50 hover:text-red-500 dark:border-white/10 dark:bg-white/10 dark:text-text-dark-secondary md:h-10 md:w-10"
                                  aria-label={`Hapus komen dari ${comment.name}`}
                                >
                                  <FiTrash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ) : null}
                          </div>

                          <p className={`relative z-10 mt-7 leading-8 text-text-light-secondary dark:text-text-dark-secondary ${isCenter ? "line-clamp-5" : "line-clamp-4"}`}>{comment.message}</p>
                        </motion.article>
                      );
                    })}
                  </AnimatePresence>
                </div>

                <div className="mt-2 flex justify-center gap-2">
                  {commentItems.map((comment, index) => {
                    const isActive = index === activeCommentIndex;

                    return (
                      <button
                        key={comment.id}
                        type="button"
                        onClick={() => setActiveCommentIndex(index)}
                        className={`h-2.5 rounded-full transition-all ${isActive ? "w-8 bg-accent-primary shadow-lg shadow-accent-primary/30" : "w-2.5 bg-text-light-muted/40 hover:bg-accent-primary/50 dark:bg-white/20"}`}
                        aria-label={`Tampilkan komen ${index + 1}`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer (New 4-Col Layout) */}
      <footer className="py-12 px-6 border-t border-light-border/50 dark:border-white/10 bg-white/25 dark:bg-black/35 backdrop-blur-xl text-sm relative z-10 shadow-[0_-24px_80px_rgba(139,92,246,0.08)]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
           <div className="col-span-1">
              <div className="flex items-center gap-2 mb-4">
                 <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center text-white font-bold text-lg">{getProfileInitials(profile.name)}</div>
                 <span className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary tracking-tight">{profile.name}</span>
              </div>
              <p className="text-text-light-secondary dark:text-text-dark-secondary mb-4 leading-relaxed">
                 Building digital experiences with passion and precision. Let&apos;s create something amazing together.
              </p>
           </div>
           <div>
              <h4 className="font-bold text-text-light-primary dark:text-text-dark-primary mb-4 text-base">Navigation</h4>
              <ul className="space-y-3 text-text-light-secondary dark:text-text-dark-secondary">
                 <li><a href="#home" className="hover:text-accent-primary transition-colors">Home</a></li>
                 <li><a href="#projects" className="hover:text-accent-primary transition-colors">Projects</a></li>
                 <li><a href="#experience" className="hover:text-accent-primary transition-colors">Experience</a></li>
                 <li><a href="#certificates" className="hover:text-accent-primary transition-colors">Certificates</a></li>
                 <li><a href="#about" className="hover:text-accent-primary transition-colors">About</a></li>
                 <li><a href="#contact" className="hover:text-accent-primary transition-colors">Contact</a></li>
                 <li><a href="#comments" className="hover:text-accent-primary transition-colors">Komen</a></li>
              </ul>
           </div>
           <div>
              <h4 className="font-bold text-text-light-primary dark:text-text-dark-primary mb-4 text-base">Socials</h4>
              <ul className="space-y-3 text-text-light-secondary dark:text-text-dark-secondary">
                 {profile.linkedin && <li><a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-accent-primary transition-colors">LinkedIn</a></li>}
                 {profile.github && <li><a href={profile.github} target="_blank" rel="noopener noreferrer" className="hover:text-accent-primary transition-colors">GitHub</a></li>}
                 {profile.instagram && <li><a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-accent-primary transition-colors">Instagram</a></li>}
              </ul>
           </div>
           <div>
              <h4 className="font-bold text-text-light-primary dark:text-text-dark-primary mb-4 text-base">Contact</h4>
              <ul className="space-y-3 text-text-light-secondary dark:text-text-dark-secondary">
                 {profile.email && <li className="break-all">{profile.email}</li>}
                 {profile.phone && <li>{profile.phone}</li>}
              </ul>
           </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-light-border dark:border-white/10 text-center text-text-light-muted dark:text-text-dark-muted">
           <p>© {initialData.currentYear} {profile.name}. All rights reserved.</p>
        </div>
      </footer>

      <div className="fixed bottom-4 right-4 z-[80] flex w-[calc(100vw-2rem)] max-w-sm flex-col items-end md:bottom-8 md:right-8">
        <AnimatePresence>
          {isChatOpen ? (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ duration: 0.28, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="mb-4 max-h-[calc(100vh-7rem)] w-full overflow-y-auto overflow-x-hidden rounded-[2rem] border border-light-border/70 bg-white/85 shadow-2xl shadow-black/20 backdrop-blur-2xl dark:border-white/10 dark:bg-black/80 md:max-h-[calc(100vh-8rem)]"
            >
              <div className="relative overflow-hidden border-b border-light-border/60 p-4 dark:border-white/10">
                <div aria-hidden="true" className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-accent-primary/25 blur-3xl" />
                <div className="relative flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary text-white shadow-lg shadow-accent-primary/25">
                      <FiMessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-text-light-primary dark:text-text-dark-primary">Madan Chat</p>
                      <p className="mt-0.5 flex items-center gap-2 text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                        Online via WhatsApp
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChatOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-light-border/70 bg-white/60 text-text-light-secondary transition-colors hover:text-red-500 dark:border-white/10 dark:bg-white/10 dark:text-text-dark-secondary"
                    aria-label="Tutup chat"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary">
                    <FiMessageCircle className="h-4 w-4" />
                  </div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08, duration: 0.25 }}
                    className="rounded-2xl rounded-tl-sm border border-light-border/70 bg-white/70 px-4 py-3 text-sm leading-6 text-text-light-secondary shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-text-dark-secondary"
                  >
                    Halo, aku siap bantu arahkan obrolan ke WhatsApp.
                  </motion.div>
                </div>

                <div className="ml-11 rounded-2xl border border-light-border/70 bg-light-surface/70 p-3 dark:border-white/10 dark:bg-white/5">
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-accent-primary">Pilih topik</p>
                  <div className="flex flex-wrap gap-2">
                    {chatPrompts.map((prompt) => (
                      <button
                        key={prompt.id}
                        type="button"
                        onClick={() => setActiveChatTopic(prompt.id)}
                        className={`rounded-full border px-3 py-2 text-xs font-bold transition-all ${activeChatTopic === prompt.id ? "border-accent-primary bg-accent-primary text-white shadow-lg shadow-accent-primary/25" : "border-light-border/70 bg-white/70 text-text-light-secondary hover:border-accent-primary/40 hover:text-accent-primary dark:border-white/10 dark:bg-white/10 dark:text-text-dark-secondary"}`}
                      >
                        {prompt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <motion.div
                  key={activeChatPrompt.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className="ml-11 rounded-2xl rounded-br-sm bg-gradient-to-r from-accent-primary to-accent-secondary px-4 py-3 text-sm font-semibold leading-6 text-white shadow-xl shadow-accent-primary/20"
                >
                  {activeChatPrompt.message}
                </motion.div>

                <div className="ml-11 flex items-center gap-1.5 text-accent-primary">
                  {[0, 1, 2].map((dot) => (
                    <motion.span
                      key={dot}
                      className="h-1.5 w-1.5 rounded-full bg-current"
                      animate={{ y: [0, -4, 0], opacity: [0.45, 1, 0.45] }}
                      transition={{ duration: 0.9, repeat: Infinity, delay: dot * 0.12 }}
                    />
                  ))}
                </div>

                <a
                  href={whatsappHref}
                  target={whatsappNumber ? "_blank" : undefined}
                  rel={whatsappNumber ? "noopener noreferrer" : undefined}
                  className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3 text-sm font-black text-white shadow-xl shadow-emerald-500/25 transition-all hover:-translate-y-0.5 hover:bg-[#1fb457]"
                >
                  <span>{whatsappNumber ? "Lanjut ke WhatsApp" : "Buka Kontak"}</span>
                  <FiSend className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={() => setIsChatOpen((current) => !current)}
          className="group relative flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-accent-primary to-accent-secondary text-white shadow-2xl shadow-accent-primary/35 outline-none ring-1 ring-white/20 transition-shadow hover:shadow-accent-primary/50"
          aria-label={isChatOpen ? "Tutup chatbot" : "Buka chatbot WhatsApp"}
          animate={isChatOpen ? { y: 0 } : { y: [0, -5, 0] }}
          transition={isChatOpen ? { duration: 0.2 } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {!isChatOpen ? (
            <motion.span
              aria-hidden="true"
              className="absolute inset-0 rounded-3xl bg-accent-primary/30"
              animate={{ scale: [1, 1.35], opacity: [0.55, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            />
          ) : null}
          <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            {isChatOpen ? <FiX className="h-6 w-6" /> : <FiMessageCircle className="h-6 w-6" />}
          </span>
          {!isChatOpen ? (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-400">
              <span className="h-2 w-2 rounded-full bg-white" />
            </span>
          ) : null}
        </motion.button>
      </div>

      <AnimatePresence>
        {isCommentModalOpen ? (
          <motion.div
            className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/60 p-4 py-6 backdrop-blur-md sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCommentModal}
          >
            <motion.form
              ref={commentFormRef}
              onSubmit={handleCommentSubmit}
              initial={{ opacity: 0, y: 36, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.32, ease: [0.21, 0.47, 0.32, 0.98] }}
              onClick={(event) => event.stopPropagation()}
              className="relative max-h-[calc(100dvh-3rem)] w-full max-w-xl overflow-y-auto rounded-[2rem] border border-light-border/70 bg-white/90 p-6 shadow-2xl shadow-black/20 backdrop-blur-2xl dark:border-white/10 dark:bg-black/85"
            >
              <div aria-hidden="true" className="absolute -right-20 -top-20 h-44 w-44 rounded-full bg-accent-primary/20 blur-3xl" />
              <div aria-hidden="true" className="absolute -bottom-24 left-8 h-44 w-44 rounded-full bg-accent-secondary/15 blur-3xl" />

              <div className="relative z-10 mb-6 flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary shadow-lg shadow-accent-primary/10 dark:bg-accent-primary/15">
                    <FiMessageSquare className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-accent-primary">Komentar</p>
                    <h3 className="mt-2 text-2xl font-black text-text-light-primary dark:text-text-dark-primary">
                      {editingCommentId ? "Edit Komen" : "Tambah Komen"}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-text-light-secondary dark:text-text-dark-secondary">
                      {editingCommentId ? "Rapikan pesanmu sebelum tampil lagi." : "Tinggalkan pesan singkat untuk portfolio ini."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeCommentModal}
                  disabled={isCommentSaving}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-light-border/70 bg-white/70 text-text-light-secondary transition-all hover:border-red-400/50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:text-text-dark-secondary"
                  aria-label="Tutup form komentar"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <div className="relative z-10 space-y-4">
                <input
                  type="text"
                  value={commentForm.name}
                  onChange={(event) => setCommentForm((form) => ({ ...form, name: event.target.value }))}
                  placeholder="Nama"
                  aria-label="Nama"
                  required
                  className="w-full rounded-2xl border border-light-border/70 bg-white/75 px-4 py-3 text-sm text-text-light-primary outline-none transition-colors placeholder:text-text-light-muted focus:border-accent-primary dark:border-white/10 dark:bg-white/10 dark:text-text-dark-primary"
                />
                <input
                  type="text"
                  value={commentForm.role}
                  onChange={(event) => setCommentForm((form) => ({ ...form, role: event.target.value }))}
                  placeholder="Role atau asal"
                  aria-label="Role atau asal"
                  className="w-full rounded-2xl border border-light-border/70 bg-white/75 px-4 py-3 text-sm text-text-light-primary outline-none transition-colors placeholder:text-text-light-muted focus:border-accent-primary dark:border-white/10 dark:bg-white/10 dark:text-text-dark-primary"
                />
                <textarea
                  value={commentForm.message}
                  onChange={(event) => setCommentForm((form) => ({ ...form, message: event.target.value }))}
                  placeholder="Tulis komen"
                  aria-label="Tulis komen"
                  required
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-light-border/70 bg-white/75 px-4 py-3 text-sm text-text-light-primary outline-none transition-colors placeholder:text-text-light-muted focus:border-accent-primary dark:border-white/10 dark:bg-white/10 dark:text-text-dark-primary"
                />
                <div>
                  <div className="relative">
                    <FiLock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light-muted dark:text-text-dark-muted" />
                    <input
                      type="password"
                      value={commentForm.password}
                      onChange={(event) => setCommentForm((form) => ({ ...form, password: event.target.value }))}
                      placeholder={editingCommentId ? "Masukkan password komentar" : "Buat password komentar"}
                      aria-label="Password komentar"
                      autoComplete={editingCommentId ? "current-password" : "new-password"}
                      required
                      minLength={6}
                      maxLength={72}
                      className="w-full rounded-2xl border border-light-border/70 bg-white/75 py-3 pl-11 pr-4 text-sm text-text-light-primary outline-none transition-colors placeholder:text-text-light-muted focus:border-accent-primary dark:border-white/10 dark:bg-white/10 dark:text-text-dark-primary"
                    />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-text-light-muted dark:text-text-dark-muted">
                    {editingCommentId
                      ? "Gunakan password yang dibuat saat komentar dikirim."
                      : "Minimal 6 karakter. Password ini diperlukan untuk mengedit atau menghapus komentar."}
                  </p>
                </div>
              </div>

              {commentError ? (
                <p className="relative z-10 mt-4 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400">
                  {commentError}
                </p>
              ) : null}

              <div className="relative z-10 mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={isCommentSaving || !commentForm.name.trim() || !commentForm.message.trim() || commentForm.password.trim().length < 6}
                  className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent-primary to-accent-secondary px-5 py-4 text-base font-bold leading-none text-white shadow-xl shadow-accent-primary/25 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <span>{isCommentSaving ? "Menyimpan" : editingCommentId ? "Update" : "Kirim"}</span>
                  <FiSend className="h-5 w-5 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={closeCommentModal}
                  disabled={isCommentSaving}
                  className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-light-border/70 bg-white/70 px-5 py-4 text-base font-bold leading-none text-text-light-primary transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                >
                  <FiX className="h-5 w-5 shrink-0" />
                  Batal
                </button>
              </div>
            </motion.form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {deletingComment ? (
          <motion.div
            className="fixed inset-0 z-[75] flex items-start justify-center overflow-y-auto bg-black/60 p-4 py-6 backdrop-blur-md sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDeleteCommentModal}
          >
            <motion.form
              onSubmit={handleDeleteComment}
              initial={{ opacity: 0, y: 28, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md rounded-[2rem] border border-light-border/70 bg-white/90 p-6 shadow-2xl shadow-black/20 backdrop-blur-2xl dark:border-white/10 dark:bg-black/85"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                    <FiAlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-red-500">Hapus Komentar</p>
                    <h3 className="mt-2 text-xl font-black text-text-light-primary dark:text-text-dark-primary">
                      Komentar dari {deletingComment.name}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeDeleteCommentModal}
                  disabled={isCommentSaving}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-light-border/70 text-text-light-secondary transition-colors hover:border-red-400/50 hover:text-red-500 dark:border-white/10 dark:text-text-dark-secondary"
                  aria-label="Tutup konfirmasi hapus"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-5 text-sm leading-6 text-text-light-secondary dark:text-text-dark-secondary">
                Masukkan password komentar untuk menghapusnya secara permanen.
              </p>

              <div className="relative mt-5">
                <FiLock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light-muted dark:text-text-dark-muted" />
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                  placeholder="Password komentar"
                  aria-label="Password untuk menghapus komentar"
                  autoComplete="current-password"
                  required
                  minLength={6}
                  maxLength={72}
                  autoFocus
                  className="w-full rounded-2xl border border-light-border/70 bg-white/75 py-3 pl-11 pr-4 text-sm text-text-light-primary outline-none transition-colors placeholder:text-text-light-muted focus:border-red-400 dark:border-white/10 dark:bg-white/10 dark:text-text-dark-primary"
                />
              </div>

              {commentError ? (
                <p className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400">
                  {commentError}
                </p>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={isCommentSaving || deletePassword.trim().length < 6}
                  className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <FiTrash2 className="h-4 w-4" />
                  {isCommentSaving ? "Menghapus" : "Hapus Komentar"}
                </button>
                <button
                  type="button"
                  onClick={closeDeleteCommentModal}
                  disabled={isCommentSaving}
                  className="flex min-h-12 items-center justify-center rounded-xl border border-light-border/70 px-5 font-bold text-text-light-primary transition-colors hover:border-accent-primary/40 dark:border-white/10 dark:text-text-dark-primary"
                >
                  Batal
                </button>
              </div>
            </motion.form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <DynamicCertificateModal
        certificate={selectedCertificate}
        onClose={() => setSelectedCertificate(null)}
      />
      {isCVOpen && cvUrl ? (
        <DynamicCvPreviewModal cvUrl={cvUrl} onClose={() => setIsCVOpen(false)} />
      ) : null}

    </main>
  );
}