import { redirect } from "next/navigation";
import { FiAward, FiBriefcase, FiGrid, FiMessageSquare, FiUser } from "react-icons/fi";
import AdminCrudPanel from "@/components/admin/AdminCrudPanel";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";

export const metadata = {
  title: "Admin Dashboard - Portfolio",
};

const statMeta = [
  { key: "projects", label: "Projects", icon: FiGrid },
  { key: "experiences", label: "Experience", icon: FiBriefcase },
  { key: "certificates", label: "Certificates", icon: FiAward },
  { key: "skills", label: "Skills", icon: FiUser },
  { key: "comments", label: "Comments", icon: FiMessageSquare },
] as const;

type StatKey = (typeof statMeta)[number]["key"];

const emptyCounts: Record<StatKey, number> = {
  projects: 0,
  experiences: 0,
  certificates: 0,
  skills: 0,
  comments: 0,
};

function getDatabaseSetupMessage(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";

  if (code === "P2021") {
    return "Tabel database belum dibuat di Neon. Jalankan npm run db:push, lalu refresh dashboard.";
  }

  if (code === "P2022") {
    return "Kolom database belum sesuai schema Prisma. Jalankan npm run db:push, lalu refresh dashboard.";
  }

  return error instanceof Error ? error.message : "Database belum bisa dibaca. Cek DATABASE_URL dan schema Prisma.";
}

async function getDashboardCounts() {
  const prisma = getPrisma();

  try {
    const [projectCount, experienceCount, certificateCount, skillCount, commentCount] = await Promise.all([
      prisma.project.count(),
      prisma.experience.count(),
      prisma.certificate.count(),
      prisma.skill.count(),
      prisma.comment.count(),
    ]);

    return {
      counts: {
        projects: projectCount,
        experiences: experienceCount,
        certificates: certificateCount,
        skills: skillCount,
        comments: commentCount,
      },
      databaseMessage: "",
    };
  } catch (error) {
    console.error("Admin dashboard count failed:", error);

    return {
      counts: emptyCounts,
      databaseMessage: getDatabaseSetupMessage(error),
    };
  }
}

export default async function AdminDashboardPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin");
  }

  const { counts, databaseMessage } = await getDashboardCounts();

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-5 rounded-[2rem] border border-light-border/70 bg-white/65 p-6 shadow-2xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-black/30 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-accent-primary">Portfolio Admin</p>
            <h1 className="mt-2 text-3xl font-black text-text-light-primary dark:text-text-dark-primary">Dashboard</h1>
          </div>
          <AdminLogoutButton />
        </header>

        {databaseMessage ? (
          <section className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-amber-900 shadow-xl shadow-black/5 backdrop-blur-xl dark:text-amber-100">
            <p className="text-base font-black">Database belum sinkron</p>
            <p className="mt-2 text-sm font-semibold opacity-80">{databaseMessage}</p>
            <code className="mt-4 block rounded-xl border border-amber-500/30 bg-white/60 px-4 py-3 text-sm font-bold text-text-light-primary dark:bg-black/30 dark:text-text-dark-primary">
              npm run db:push
            </code>
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {statMeta.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.key}
                className="rounded-2xl border border-light-border/70 bg-white/65 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-black/25"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-5 text-3xl font-black text-text-light-primary dark:text-text-dark-primary">
                  {counts[item.key]}
                </p>
                <p className="mt-1 text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary">
                  {item.label}
                </p>
              </article>
            );
          })}
        </section>

        <AdminCrudPanel />
      </div>
    </main>
  );
}
