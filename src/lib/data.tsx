// src/lib/data.tsx

import React from "react";
import { 
  SiReact, SiNextdotjs, SiTailwindcss, SiNodedotjs, SiJavascript, SiGit, SiPostgresql,
  SiFigma, SiVercel, SiPostman, SiMysql, SiGooglegemini, SiNetlify, SiRailway, SiExpress
} from "react-icons/si";

// --- INTERFACES ---

export interface Project {
  id: string | number;
  title: string;
  summary?: string;
  description: string;
  role?: string;
  projectType?: string;
  period?: string;
  status?: string;
  problem?: string;
  solution?: string;
  outcome?: string;
  highlights: string[];
  technologies: string[];
  imageUrl?: string | null;
  demoUrl?: string;
  githubUrl?: string;
  featured: boolean;
}

export interface ProfileData {
  name: string;
  nickname: string;
  title: string;
  avatar: string;
  cvUrl?: string;
  bio: string;
  email: string;
  phone: string;
  github: string;
  linkedin: string;
  instagram?: string;
}

// UPDATE: Tambahkan imageUrl di sini
export interface Certificate {
  id: string | number;
  name: string;
  issuer: string;
  date: string;
  url: string;
  imageUrl?: string; // Field baru untuk gambar sertifikat
}

export interface Experience {
  id: string | number;
  role: string;
  company: string;
  type: string;
  period: string;
  location: string;
  description: string;
  highlights: string[];
  technologies: string[];
}

export interface PortfolioComment {
  id: string | number;
  name: string;
  role: string;
  message: string;
  createdAt: string;
}

export interface SkillItem {
  name: string;
  icon: React.JSX.Element;
}

export interface ApiSkill {
  id: string | number;
  name: string;
  iconKey?: string | null;
  group?: string | null;
  sortOrder?: number | null;
}



const skillIconClassName = "w-6 h-6";

function normalizeSkillKey(value?: string | null) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getSkillIcon(name: string, iconKey?: string | null) {
  const key = normalizeSkillKey(iconKey || name);
  const iconMap: Record<string, React.JSX.Element> = {
    react: <SiReact className={`${skillIconClassName} text-[#61DAFB]`} />,
    nextjs: <SiNextdotjs className={`${skillIconClassName} text-black dark:text-white`} />,
    "next-js": <SiNextdotjs className={`${skillIconClassName} text-black dark:text-white`} />,
    "tailwind-css": <SiTailwindcss className={`${skillIconClassName} text-[#38BDF8]`} />,
    tailwindcss: <SiTailwindcss className={`${skillIconClassName} text-[#38BDF8]`} />,
    javascript: <SiJavascript className={`${skillIconClassName} text-[#F7DF1E]`} />,
    expressjs: <SiExpress className={`${skillIconClassName} text-black dark:text-white`} />,
    "express-js": <SiExpress className={`${skillIconClassName} text-black dark:text-white`} />,
    netlify: <SiNetlify className={`${skillIconClassName} text-[#00C7B7]`} />,
    railway: <SiRailway className={`${skillIconClassName} text-black dark:text-white`} />,
    nodejs: <SiNodedotjs className={`${skillIconClassName} text-[#339933]`} />,
    "node-js": <SiNodedotjs className={`${skillIconClassName} text-[#339933]`} />,
    mysql: <SiMysql className={`${skillIconClassName} text-[#00758F]`} />,
    git: <SiGit className={`${skillIconClassName} text-[#F05032]`} />,
    postman: <SiPostman className={`${skillIconClassName} text-[#FF6C37]`} />,
    postgresql: <SiPostgresql className={`${skillIconClassName} text-[#336791]`} />,
    figma: <SiFigma className={`${skillIconClassName} text-[#F24E1E]`} />,
    vercel: <SiVercel className={`${skillIconClassName} text-black dark:text-white`} />,
    "google-gemini": <SiGooglegemini className={`${skillIconClassName} text-[#8E75B2]`} />,
  };

  return (
    iconMap[key] ?? (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-primary/10 text-xs font-black text-accent-primary">
        {name.slice(0, 2).toUpperCase()}
      </span>
    )
  );
}

export function buildSkillsData(apiSkills: ApiSkill[]) {
  const sortedSkills = [...apiSkills].sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
  const row1 = sortedSkills
    .filter((skill) => (skill.group ?? "row1") === "row1")
    .map((skill) => ({ name: skill.name, icon: getSkillIcon(skill.name, skill.iconKey) }));
  const row2 = sortedSkills
    .filter((skill) => (skill.group ?? "row1") !== "row1")
    .map((skill) => ({ name: skill.name, icon: getSkillIcon(skill.name, skill.iconKey) }));

  return { row1, row2 };
}
