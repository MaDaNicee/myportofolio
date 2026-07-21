import HomePageClient, { type HomePageData } from "@/components/HomePageClient";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const emptyHomePageData: HomePageData = {
  profile: {
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
  },
  projects: [],
  experiences: [],
  certificates: [],
  skills: [],
  comments: [],
  currentYear: new Date().getFullYear(),
};

async function getHomePageData(): Promise<HomePageData> {
  try {
    const prisma = getPrisma();
    const [profile, projects, experiences, certificates, skills, comments] = await Promise.all([
      prisma.profile.findFirst({ orderBy: { createdAt: "asc" } }),
      prisma.project.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }),
      prisma.experience.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }),
      prisma.certificate.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }),
      prisma.skill.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }),
      prisma.comment.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    return {
      profile: profile
        ? {
            name: profile.name,
            nickname: profile.nickname,
            title: profile.title,
            avatar: profile.avatar,
            cvUrl: profile.cvUrl ?? "",
            bio: profile.bio,
            email: profile.email,
            phone: profile.phone,
            github: profile.github,
            linkedin: profile.linkedin,
            instagram: profile.instagram ?? "",
          }
        : emptyHomePageData.profile,
      projects: projects.map((project) => ({
        id: project.id,
        title: project.title,
        summary: project.summary ?? undefined,
        description: project.description,
        role: project.role ?? undefined,
        projectType: project.projectType ?? undefined,
        period: project.period ?? undefined,
        status: project.status ?? undefined,
        problem: project.problem ?? undefined,
        solution: project.solution ?? undefined,
        outcome: project.outcome ?? undefined,
        highlights: project.highlights,
        technologies: project.technologies,
        imageUrl: project.imageUrl,
        demoUrl: project.demoUrl ?? undefined,
        githubUrl: project.githubUrl ?? undefined,
        featured: project.featured,
      })),
      experiences: experiences.map((experience) => ({
        id: experience.id,
        role: experience.role,
        company: experience.company,
        type: experience.type,
        period: experience.period,
        location: experience.location,
        description: experience.description,
        highlights: experience.highlights,
        technologies: experience.technologies,
      })),
      certificates: certificates.map((certificate) => ({
        id: certificate.id,
        name: certificate.name,
        issuer: certificate.issuer,
        date: certificate.date,
        url: certificate.url,
        imageUrl: certificate.imageUrl ?? undefined,
      })),
      skills: skills.map((skill) => ({
        id: skill.id,
        name: skill.name,
        iconKey: skill.iconKey,
        group: skill.group,
        sortOrder: skill.sortOrder,
      })),
      comments: comments.map((comment) => ({
        id: comment.id,
        name: comment.name,
        role: comment.role,
        message: comment.message,
        createdAt: comment.createdAt.toISOString(),
      })),
      currentYear: new Date().getFullYear(),
    };
  } catch (error) {
    console.error("Gagal mengambil data portfolio untuk halaman utama.", error);

    return emptyHomePageData;
  }
}

export default async function Home() {
  const initialData = await getHomePageData();

  return <HomePageClient initialData={initialData} />;
}
