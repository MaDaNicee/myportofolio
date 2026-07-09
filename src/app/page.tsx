'use client';

import { type FormEvent, useEffect, useState } from 'react';
import Image from "next/image";
import { motion, AnimatePresence } from 'framer-motion';
import ProjectCard from '@/components/ProjectCard';
import SkillSlider from '@/components/SkillSlider';
import FadeIn from '@/components/FadeIn';
import MagneticButton from '@/components/MagneticButton';
import DecryptedText from '@/components/react-bits/DecryptedText'; 
import ShinyText from '@/components/react-bits/ShinyText';       
import { buildSkillsData, type ApiSkill, type Certificate, type Experience, type PortfolioComment, type ProfileData, type Project, type SkillItem } from '@/lib/data';
import ContactForm from '@/components/ContactForm';
import ScrollScene3D from '@/components/ScrollScene3D';
import PhotoCard3D from '@/components/PhotoCard3D';
import Meteors from '@/components/Meteors';
import { FiEdit3, FiMessageSquare, FiSend, FiTrash2, FiX } from 'react-icons/fi';

const emptyProfileData: ProfileData = {
  name: "",
  nickname: "",
  title: "",
  avatar: "",
  cvUrl: "",
  bio: "",
  email: "",
  phone: "",
  github: "",
  linkedin: "",
  instagram: "",
};

const emptySkillRows: { row1: SkillItem[]; row2: SkillItem[] } = { row1: [], row2: [] };

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

export default function Home() {
  const [profile, setProfile] = useState<ProfileData>(emptyProfileData);
  const [projectItems, setProjectItems] = useState<Project[]>([]);
  const [experienceItems, setExperienceItems] = useState<Experience[]>([]);
  const [certificateItems, setCertificateItems] = useState<Certificate[]>([]);
  const [skillRows, setSkillRows] = useState(emptySkillRows);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [isCVOpen, setIsCVOpen] = useState(false);
  const cvUrl = profile.cvUrl ?? "";
  const [commentItems, setCommentItems] = useState<PortfolioComment[]>([]);
  const [editingCommentId, setEditingCommentId] = useState<PortfolioComment["id"] | null>(null);
  const [commentForm, setCommentForm] = useState({ name: "", role: "", message: "" });
  const [isCommentSaving, setIsCommentSaving] = useState(false);

  const resetCommentForm = () => {
    setCommentForm({ name: "", role: "", message: "" });
    setEditingCommentId(null);
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

  useEffect(() => {
    let isMounted = true;

    async function loadPortfolioData() {
      try {
        const [profileResponse, projectsResponse, experiencesResponse, certificatesResponse, skillsResponse, commentsResponse] = await Promise.all([
          fetch("/api/profile", { cache: "no-store" }),
          fetch("/api/projects", { cache: "no-store" }),
          fetch("/api/experiences", { cache: "no-store" }),
          fetch("/api/certificates", { cache: "no-store" }),
          fetch("/api/skills", { cache: "no-store" }),
          fetch("/api/comments", { cache: "no-store" }),
        ]);

        if (!isMounted) return;

        if (profileResponse.ok) {
          const data = (await profileResponse.json()) as ProfileData[];
          if (Array.isArray(data) && data[0]) setProfile(data[0]);
        }

        if (projectsResponse.ok) {
          const data = (await projectsResponse.json()) as Project[];
          if (Array.isArray(data)) setProjectItems(data);
        }

        if (experiencesResponse.ok) {
          const data = (await experiencesResponse.json()) as Experience[];
          if (Array.isArray(data)) setExperienceItems(data);
        }

        if (certificatesResponse.ok) {
          const data = (await certificatesResponse.json()) as Certificate[];
          if (Array.isArray(data)) setCertificateItems(data);
        }

        if (skillsResponse.ok) {
          const data = (await skillsResponse.json()) as ApiSkill[];
          if (Array.isArray(data) && data.length > 0) setSkillRows(buildSkillsData(data));
        }

        if (commentsResponse.ok) {
          const data = (await commentsResponse.json()) as PortfolioComment[];
          if (Array.isArray(data)) setCommentItems(data);
        }
      } catch (error) {
        console.warn("Gagal mengambil data portfolio dari API.", error);
      }
    }

    loadPortfolioData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = commentForm.name.trim();
    const role = commentForm.role.trim() || "Visitor";
    const message = commentForm.message.trim();

    if (!name || !message || isCommentSaving) return;

    const payload = { name, role, message };

    setIsCommentSaving(true);

    if (editingCommentId) {
      try {
        const response = await fetch(`/api/comments/${encodeURIComponent(String(editingCommentId))}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("API komentar belum siap.");

        const updatedComment = (await response.json()) as PortfolioComment;

        setCommentItems((currentComments) =>
          currentComments.map((comment) => (comment.id === editingCommentId ? updatedComment : comment)),
        );
      } catch (error) {
        console.warn("Gagal memperbarui komentar melalui API.", error);
      } finally {
        setIsCommentSaving(false);
        resetCommentForm();
      }

      return;
    }

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("API komentar belum siap.");

      const createdComment = (await response.json()) as PortfolioComment;

      setCommentItems((currentComments) => [createdComment, ...currentComments]);
    } catch (error) {
      console.warn("Gagal menyimpan komentar melalui API.", error);
    } finally {
      setIsCommentSaving(false);
      resetCommentForm();
    }
  };

  const handleEditComment = (comment: PortfolioComment) => {
    setEditingCommentId(comment.id);
    setCommentForm({ name: comment.name, role: comment.role, message: comment.message });
  };

  const handleDeleteComment = async (commentId: PortfolioComment["id"]) => {
    try {
      const response = await fetch(`/api/comments/${encodeURIComponent(String(commentId))}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("API komentar belum siap.");

      setCommentItems((currentComments) => currentComments.filter((comment) => comment.id !== commentId));
      if (editingCommentId === commentId) resetCommentForm();
    } catch (error) {
      console.warn("Gagal menghapus komentar melalui API.", error);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden relative transition-colors duration-300">
      
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-light-bg/50 to-light-bg dark:via-dark-bg/50 dark:to-dark-bg pointer-events-none z-0" />
      <ScrollScene3D />

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
                className="mt-6 text-base md:text-lg text-text-light-secondary dark:text-text-dark-secondary leading-8 max-w-md mx-auto lg:mx-0"
              >
                {profile.bio}
              </motion.p>
            </div>

            {/* === TENGAH: FOTO CENTER === */}
            <div className="order-2 relative z-20 flex justify-center">
              {profile.avatar && <PhotoCard3D src={profile.avatar} alt={profile.name || "Profile photo"} />}
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

                <p className="mt-5 max-w-sm mx-auto lg:mx-0 text-sm md:text-base leading-7 text-text-light-secondary dark:text-text-dark-secondary">
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
                    <Meteors number={20} />
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
                    <ContactForm />
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
                Kumpulan komentar dinamis yang langsung tersambung ke API, Prisma ORM, dan Neon PostgreSQL.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.62fr)] gap-8 items-start">
            <div className="space-y-4">
              {commentItems.length === 0 ? (
                <FadeIn>
                  <div className="rounded-3xl border border-dashed border-light-border dark:border-white/10 bg-white/30 dark:bg-black/20 backdrop-blur-xl p-8 text-center text-text-light-secondary dark:text-text-dark-secondary">
                    Belum ada komen.
                  </div>
                </FadeIn>
              ) : (
                commentItems.map((comment, index) => (
                  <FadeIn key={comment.id} delay={index * 0.06}>
                    <motion.article
                      layout
                      className="group rounded-3xl border border-light-border/70 dark:border-white/10 bg-white/40 dark:bg-black/25 backdrop-blur-xl p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-accent-primary/30 hover:shadow-2xl"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary text-sm font-black text-white shadow-lg shadow-accent-primary/25">
                            {comment.name
                              .split(" ")
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join("")}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">{comment.name}</h3>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                              <span className="rounded-full border border-light-border/70 bg-white/50 px-2.5 py-1 dark:border-white/10 dark:bg-white/5">
                                {comment.role}
                              </span>
                              <span>{formatCommentDate(comment.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => handleEditComment(comment)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-light-border/70 bg-white/50 text-text-light-secondary transition-colors hover:border-accent-primary/40 hover:text-accent-primary dark:border-white/10 dark:bg-white/5 dark:text-text-dark-secondary"
                            aria-label={`Edit komen dari ${comment.name}`}
                          >
                            <FiEdit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-light-border/70 bg-white/50 text-text-light-secondary transition-colors hover:border-red-400/50 hover:text-red-500 dark:border-white/10 dark:bg-white/5 dark:text-text-dark-secondary"
                            aria-label={`Hapus komen dari ${comment.name}`}
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <p className="mt-5 leading-8 text-text-light-secondary dark:text-text-dark-secondary">{comment.message}</p>
                    </motion.article>
                  </FadeIn>
                ))
              )}
            </div>

            <FadeIn delay={0.1}>
              <form
                onSubmit={handleCommentSubmit}
                className="sticky top-8 rounded-[2rem] border border-light-border/70 dark:border-white/10 bg-white/50 dark:bg-black/25 backdrop-blur-2xl p-6 shadow-2xl"
              >
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                      {editingCommentId ? "Edit Komen" : "Tambah Komen"}
                    </h3>
                    <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                      Tersambung ke API saat DATABASE_URL Neon sudah aktif.
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary">
                    <FiMessageSquare className="h-6 w-6" />
                  </div>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    value={commentForm.name}
                    onChange={(event) => setCommentForm((form) => ({ ...form, name: event.target.value }))}
                    placeholder="Nama"
                    aria-label="Nama"
                    required
                    className="w-full rounded-2xl border border-light-border/70 bg-white/70 px-4 py-3 text-sm text-text-light-primary outline-none transition-colors placeholder:text-text-light-muted focus:border-accent-primary dark:border-white/10 dark:bg-white/5 dark:text-text-dark-primary"
                  />
                  <input
                    type="text"
                    value={commentForm.role}
                    onChange={(event) => setCommentForm((form) => ({ ...form, role: event.target.value }))}
                    placeholder="Role atau asal"
                    aria-label="Role atau asal"
                    className="w-full rounded-2xl border border-light-border/70 bg-white/70 px-4 py-3 text-sm text-text-light-primary outline-none transition-colors placeholder:text-text-light-muted focus:border-accent-primary dark:border-white/10 dark:bg-white/5 dark:text-text-dark-primary"
                  />
                  <textarea
                    value={commentForm.message}
                    onChange={(event) => setCommentForm((form) => ({ ...form, message: event.target.value }))}
                    placeholder="Tulis komen"
                    aria-label="Tulis komen"
                    required
                    rows={5}
                    className="w-full resize-none rounded-2xl border border-light-border/70 bg-white/70 px-4 py-3 text-sm text-text-light-primary outline-none transition-colors placeholder:text-text-light-muted focus:border-accent-primary dark:border-white/10 dark:bg-white/5 dark:text-text-dark-primary"
                  />
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={isCommentSaving || !commentForm.name.trim() || !commentForm.message.trim()}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent-primary to-accent-secondary px-5 text-sm font-bold text-white shadow-xl shadow-accent-primary/25 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    <span>{isCommentSaving ? "Menyimpan" : editingCommentId ? "Update" : "Kirim"}</span>
                    <FiSend className="h-4 w-4" />
                  </button>
                  {editingCommentId && (
                    <button
                      type="button"
                      onClick={resetCommentForm}
                      className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-light-border/70 bg-white/60 px-5 text-sm font-bold text-text-light-primary transition-all hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                    >
                      <FiX className="h-4 w-4" />
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </FadeIn>
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
           <p>© {new Date().getFullYear()} {profile.name}. All rights reserved.</p>
        </div>
      </footer>

      {/* ================= MODAL CERTIFICATE (POPUP 1) ================= */}
      <AnimatePresence>
        {selectedCertificate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCertificate(null)}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} 
              className="bg-light-card/95 dark:bg-dark-card/95 border border-white/20 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-white/10"
            >
              <button
                onClick={() => setSelectedCertificate(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-light-surface dark:bg-dark-surface hover:bg-red-500 hover:text-white transition-colors z-10"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex flex-col gap-6 overflow-y-auto">
                <div className="pr-10">
                  <h3 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
                    {selectedCertificate.name}
                  </h3>
                  <div className="flex gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    <span className="font-semibold text-accent-primary">{selectedCertificate.issuer}</span>
                    <span>•</span>
                    <span>{selectedCertificate.date}</span>
                  </div>
                </div>

                <div className="w-full rounded-xl overflow-hidden bg-light-surface dark:bg-dark-surface border border-light-border dark:border-white/10 flex items-center justify-center">
                  {selectedCertificate.imageUrl ? (
                    <Image
                      src={selectedCertificate.imageUrl}
                      alt={selectedCertificate.name}
                      width={0}
                      height={0}
                      sizes="100vw"
                      className="w-full h-auto max-h-[60vh] object-contain" 
                    />
                  ) : (
                    <div className="text-center p-12 opacity-50">
                       <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                       </svg>
                       <p>Preview image not available</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-auto">
                   <button
                    onClick={() => setSelectedCertificate(null)}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium border border-light-border dark:border-white/10 hover:bg-light-surface dark:hover:bg-white/5 transition-colors"
                  >
                    Close
                  </button>
                  <a
                    href={selectedCertificate.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl text-sm font-medium bg-accent-primary text-white hover:bg-accent-hover transition-colors flex items-center gap-2 shadow-lg shadow-accent-primary/25"
                  >
                    <span>Verify Credential</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MODAL CV PDF (POPUP 2 - BARU) ================= */}
      <AnimatePresence>
        {isCVOpen && cvUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCVOpen(false)}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} 
              className="bg-light-card/95 dark:bg-dark-card/95 border border-white/20 rounded-2xl w-full max-w-5xl h-[90vh] shadow-2xl relative flex flex-col ring-1 ring-white/10 overflow-hidden"
            >
              {/* Header Modal CV */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                 <h3 className="font-bold text-lg text-text-light-primary dark:text-text-dark-primary pl-2">Curriculum Vitae</h3>
                 <button
                    onClick={() => setIsCVOpen(false)}
                    className="p-2 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
              </div>

              {/* Content Modal CV (Iframe PDF) */}
              <div className="flex-grow bg-gray-100 dark:bg-gray-900 w-full h-full relative">
                 <iframe 
                    src={cvUrl} 
                    className="w-full h-full border-none"
                    title="CV Preview"
                 />
              </div>

              {/* Footer Modal CV (Tombol Download Asli) */}
              <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                 <button
                    onClick={() => setIsCVOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium border border-light-border dark:border-white/10 hover:bg-light-surface dark:hover:bg-white/5 transition-colors"
                  >
                    Close
                  </button>
                  <a
                    href={cvUrl}
                    download="CV_Muhammad_Nur_Ramadhan.pdf" // Nama file saat didownload
                    className="px-5 py-2.5 rounded-xl text-sm font-medium bg-accent-primary text-white hover:bg-accent-hover transition-colors flex items-center gap-2 shadow-lg shadow-accent-primary/25"
                  >
                    <span>Download File</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}