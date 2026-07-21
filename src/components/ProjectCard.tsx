import Image from 'next/image';
import Link from 'next/link';
import { Project } from '@/lib/data';
import { SiGithub } from 'react-icons/si';
import { FiArrowRight, FiExternalLink } from 'react-icons/fi';

interface ProjectCardProps {
  project: Project;
  index: number;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="group relative h-full overflow-hidden rounded-2xl border border-light-border bg-light-card transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl dark:border-dark-border dark:bg-dark-card">
      <Link
        href={`/projects/${project.id}`}
        className="absolute inset-0 z-20 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-primary"
        aria-label={`Lihat detail project ${project.title}`}
      />

      <div className="relative h-48 w-full overflow-hidden">
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-4 bg-light-card/70 opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-dark-card/70" />

        {project.imageUrl ? (
          <Image
            src={project.imageUrl}
            alt={project.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-light-surface text-text-light-muted dark:bg-black/30 dark:text-white/30" aria-label="Project image empty">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5l4.5-4.5a2.1 2.1 0 013 0l1.5 1.5 3-3a2.1 2.1 0 013 0L21 13.5M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2zm4-10h.01" />
            </svg>
          </div>
        )}

        <div className="absolute inset-0 z-30 flex items-center justify-center gap-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-accent-primary p-3 text-white shadow-lg transition-transform hover:scale-110"
              title="View Demo"
              aria-label={`Buka demo ${project.title}`}
            >
              <FiExternalLink size={20} />
            </a>
          )}
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-dark-surface p-3 text-white shadow-lg transition-transform hover:scale-110"
              title="View Code"
              aria-label={`Buka source code ${project.title}`}
            >
              <SiGithub size={20} />
            </a>
          )}
        </div>

        {project.featured && (
          <div className="pointer-events-none absolute right-4 top-4 z-30 rounded-full bg-accent-primary px-3 py-1 text-xs font-medium text-white shadow-lg">
            Featured
          </div>
        )}
      </div>

      <div className="flex h-[calc(100%-12rem)] flex-col p-6">
        <h3 className="mb-2 text-xl font-bold text-text-light-primary transition-colors group-hover:text-accent-primary dark:text-text-dark-primary">
          {project.title}
        </h3>

        <p className="mb-4 line-clamp-3 flex-grow text-sm text-text-light-secondary dark:text-text-dark-secondary">
          {project.summary || project.description}
        </p>

        <div className="mt-auto flex flex-wrap gap-2">
          {project.technologies.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-light-border bg-light-surface px-3 py-1 text-xs text-text-light-secondary dark:border-dark-border dark:bg-dark-surface dark:text-text-dark-secondary"
            >
              {tech}
            </span>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2 text-sm font-bold text-accent-primary">
          <span>Lihat Detail</span>
          <FiArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </article>
  );
}
