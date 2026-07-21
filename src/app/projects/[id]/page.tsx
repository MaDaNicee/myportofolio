import type { Metadata } from "next";
import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FiActivity,
  FiArrowLeft,
  FiArrowRight,
  FiArrowUpRight,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiExternalLink,
  FiLayers,
  FiTarget,
  FiTrendingUp,
} from "react-icons/fi";
import { SiGithub } from "react-icons/si";
import { getPrisma, withPrismaRetry } from "@/lib/prisma";

type ProjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

const getProject = cache(async (id: string) => {
  const prisma = getPrisma();

  return withPrismaRetry(() =>
    prisma.project.findUnique({
      where: { id },
    }),
  );
});

const getRelatedProjects = cache(async (id: string) => {
  const prisma = getPrisma();

  return withPrismaRetry(() =>
    prisma.project.findMany({
      where: { id: { not: id } },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      take: 3,
      select: {
        id: true,
        title: true,
        summary: true,
        description: true,
        imageUrl: true,
        technologies: true,
      },
    }),
  );
});

export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    return { title: "Project tidak ditemukan" };
  }

  return {
    title: `${project.title} | Portfolio Muhammad Nur Ramadhan`,
    description: project.summary || project.description,
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const [project, relatedProjects] = await Promise.all([getProject(id), getRelatedProjects(id)]);

  if (!project) notFound();

  const facts = [
    project.role ? { label: "Peran", value: project.role, icon: FiBriefcase } : null,
    project.projectType ? { label: "Tipe Project", value: project.projectType, icon: FiLayers } : null,
    project.period ? { label: "Periode", value: project.period, icon: FiCalendar } : null,
    project.status ? { label: "Status", value: project.status, icon: FiActivity } : null,
  ].filter(Boolean) as Array<{
    label: string;
    value: string;
    icon: typeof FiBriefcase;
  }>;

  const hasCaseStudy = Boolean(project.problem || project.solution);

  return (
    <main className="relative min-h-screen overflow-hidden pb-28 pt-16 md:pb-20 md:pt-14">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-accent-primary/10 blur-3xl dark:bg-accent-primary/15" />
      </div>

      <article className="relative">
        <header className="mx-auto max-w-6xl px-5 md:px-10">
          <Link
            href="/#projects"
            className="inline-flex items-center gap-2 rounded-xl border border-light-border/70 bg-white/70 px-4 py-2.5 text-sm font-bold text-text-light-secondary shadow-sm backdrop-blur-xl transition-all hover:-translate-x-1 hover:border-accent-primary/40 hover:text-accent-primary dark:border-white/10 dark:bg-black/40 dark:text-text-dark-secondary"
          >
            <FiArrowLeft className="h-4 w-4" />
            Kembali ke Projects
          </Link>

          <div className="mt-12 max-w-4xl">
            <div className="flex flex-wrap items-center gap-3 text-xs font-black uppercase text-accent-primary">
              <span>Project Case Study</span>
              {project.featured && (
                <>
                  <span className="h-1 w-1 rounded-full bg-text-light-muted dark:bg-text-dark-muted" />
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <FiCheckCircle className="h-4 w-4" />
                    Featured
                  </span>
                </>
              )}
            </div>

            <h1 className="mt-5 text-4xl font-black leading-tight text-text-light-primary dark:text-text-dark-primary md:text-6xl">
              {project.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-text-light-secondary dark:text-text-dark-secondary md:text-xl">
              {project.summary || project.description}
            </p>

            {(project.demoUrl || project.githubUrl) && (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent-primary px-5 font-bold text-white shadow-lg shadow-accent-primary/20 transition-all hover:-translate-y-0.5 hover:bg-accent-hover"
                  >
                    <FiExternalLink className="h-5 w-5" />
                    Lihat Live Demo
                    <FiArrowUpRight className="h-5 w-5" />
                  </a>
                )}
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-light-border bg-white/70 px-5 font-bold text-text-light-primary backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-accent-primary/40 hover:text-accent-primary dark:border-white/10 dark:bg-white/5 dark:text-text-dark-primary"
                  >
                    <SiGithub className="h-5 w-5" />
                    Source Code
                  </a>
                )}
              </div>
            )}
          </div>
        </header>

        <div className="mx-auto mt-12 max-w-7xl px-5 md:px-10">
          <div className="relative aspect-[16/9] min-h-[260px] overflow-hidden rounded-2xl border border-light-border/70 bg-light-surface shadow-2xl shadow-black/10 dark:border-white/10 dark:bg-dark-surface dark:shadow-black/30">
            {project.imageUrl ? (
              <Image
                src={project.imageUrl}
                alt={`Tampilan utama project ${project.title}`}
                fill
                priority
                sizes="(min-width: 1280px) 1216px, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-semibold text-text-light-muted dark:text-text-dark-muted">
                Gambar project belum tersedia
              </div>
            )}
          </div>
        </div>

        {facts.length > 0 && (
          <dl className="mx-auto mt-10 grid max-w-6xl grid-cols-2 border-y border-light-border/70 px-5 dark:border-white/10 md:grid-cols-4 md:px-10">
            {facts.map(({ label, value, icon: Icon }, index) => (
              <div
                key={label}
                className={`py-6 ${index % 2 === 0 ? "pr-4" : "border-l border-light-border/70 pl-4 dark:border-white/10"} md:border-l md:border-light-border/70 md:px-6 md:first:border-l-0 md:dark:border-white/10`}
              >
                <dt className="flex items-center gap-2 text-xs font-bold uppercase text-text-light-muted dark:text-text-dark-muted">
                  <Icon className="h-4 w-4 text-accent-primary" />
                  {label}
                </dt>
                <dd className="mt-2 text-sm font-black text-text-light-primary dark:text-text-dark-primary md:text-base">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <section className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:px-10 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div>
            <p className="text-sm font-black uppercase text-accent-primary">01 / Overview</p>
            <h2 className="mt-3 text-3xl font-black text-text-light-primary dark:text-text-dark-primary md:text-4xl">
              Tentang project ini
            </h2>
            <p className="mt-6 whitespace-pre-line text-base leading-8 text-text-light-secondary dark:text-text-dark-secondary md:text-lg">
              {project.description}
            </p>
          </div>

          <aside className="border-t border-light-border/70 pt-8 dark:border-white/10 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <h2 className="text-sm font-black uppercase text-text-light-primary dark:text-text-dark-primary">
              Tech Stack
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {project.technologies.map((technology) => (
                <span
                  key={technology}
                  className="rounded-full border border-accent-primary/20 bg-accent-primary/10 px-3 py-1.5 text-xs font-bold text-accent-primary"
                >
                  {technology}
                </span>
              ))}
            </div>
          </aside>
        </section>

        {hasCaseStudy && (
          <section className="border-y border-light-border/70 bg-light-surface/55 dark:border-white/10 dark:bg-white/[0.025]">
            <div className="mx-auto max-w-6xl px-5 py-20 md:px-10">
              <p className="text-sm font-black uppercase text-accent-primary">02 / Process</p>
              <h2 className="mt-3 text-3xl font-black text-text-light-primary dark:text-text-dark-primary md:text-4xl">
                Dari masalah menuju solusi
              </h2>

              <div className="mt-12 grid gap-10 md:grid-cols-2 md:gap-0">
                {project.problem && (
                  <div className="md:pr-10">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      <FiTarget className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-xl font-black text-text-light-primary dark:text-text-dark-primary">
                      Tantangan
                    </h3>
                    <p className="mt-3 whitespace-pre-line leading-7 text-text-light-secondary dark:text-text-dark-secondary">
                      {project.problem}
                    </p>
                  </div>
                )}

                {project.solution && (
                  <div className="border-t border-light-border/70 pt-10 dark:border-white/10 md:border-l md:border-t-0 md:pl-10 md:pt-0">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <FiTrendingUp className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-xl font-black text-text-light-primary dark:text-text-dark-primary">
                      Pendekatan solusi
                    </h3>
                    <p className="mt-3 whitespace-pre-line leading-7 text-text-light-secondary dark:text-text-dark-secondary">
                      {project.solution}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {project.highlights.length > 0 && (
          <section className="mx-auto max-w-6xl px-5 py-20 md:px-10">
            <p className="text-sm font-black uppercase text-accent-primary">03 / Highlights</p>
            <div className="mt-3 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
              <h2 className="text-3xl font-black text-text-light-primary dark:text-text-dark-primary md:text-4xl">
                Fitur dan kontribusi utama
              </h2>
              <ul className="divide-y divide-light-border/70 border-y border-light-border/70 dark:divide-white/10 dark:border-white/10">
                {project.highlights.map((highlight, index) => (
                  <li key={highlight} className="flex gap-4 py-5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary">
                      <FiCheck className="h-4 w-4" />
                    </span>
                    <div>
                      <span className="text-xs font-black text-text-light-muted dark:text-text-dark-muted">
                        0{index + 1}
                      </span>
                      <p className="mt-1 leading-7 text-text-light-secondary dark:text-text-dark-secondary">
                        {highlight}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {project.outcome && (
          <section className="border-y border-light-border/70 bg-emerald-500/[0.04] dark:border-white/10 dark:bg-emerald-400/[0.035]">
            <div className="mx-auto grid max-w-6xl gap-6 px-5 py-16 md:px-10 lg:grid-cols-[14rem_1fr] lg:items-start">
              <div className="flex items-center gap-3 text-sm font-black uppercase text-emerald-700 dark:text-emerald-400">
                <FiTrendingUp className="h-5 w-5" />
                Hasil dan dampak
              </div>
              <p className="whitespace-pre-line text-xl font-bold leading-9 text-text-light-primary dark:text-text-dark-primary md:text-2xl">
                {project.outcome}
              </p>
            </div>
          </section>
        )}

        {relatedProjects.length > 0 && (
          <section className="mx-auto max-w-7xl px-5 py-20 md:px-10">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-sm font-black uppercase text-accent-primary">Project lainnya</p>
                <h2 className="mt-3 text-3xl font-black text-text-light-primary dark:text-text-dark-primary md:text-4xl">
                  Lanjut jelajahi karya
                </h2>
              </div>
              <Link
                href="/#projects"
                className="hidden items-center gap-2 text-sm font-bold text-accent-primary transition-colors hover:text-accent-hover sm:flex"
              >
                Semua project
                <FiArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {relatedProjects.map((relatedProject) => (
                <Link
                  key={relatedProject.id}
                  href={`/projects/${relatedProject.id}`}
                  className="group overflow-hidden rounded-xl border border-light-border/70 bg-white/60 transition-all hover:-translate-y-1 hover:border-accent-primary/40 hover:shadow-xl dark:border-white/10 dark:bg-white/5"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-light-surface dark:bg-dark-surface">
                    {relatedProject.imageUrl && (
                      <Image
                        src={relatedProject.imageUrl}
                        alt={relatedProject.title}
                        fill
                        sizes="(min-width: 768px) 33vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-black text-text-light-primary transition-colors group-hover:text-accent-primary dark:text-text-dark-primary">
                      {relatedProject.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-light-secondary dark:text-text-dark-secondary">
                      {relatedProject.summary || relatedProject.description}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-sm font-bold text-accent-primary">
                      Lihat case study
                      <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </main>
  );
}
