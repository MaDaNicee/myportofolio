import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL belum diisi. Isi .env dengan connection string Neon terlebih dahulu.");
}

const schema = new URL(databaseUrl).searchParams.get("schema") ?? undefined;

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl, schema ? { schema } : undefined),
});

async function main() {
  await prisma.$transaction([
    prisma.comment.deleteMany(),
    prisma.skill.deleteMany(),
    prisma.certificate.deleteMany(),
    prisma.experience.deleteMany(),
    prisma.project.deleteMany(),
    prisma.profile.deleteMany(),
  ]);

  await prisma.profile.create({
    data: {
      name: "Muhammad Nur Ramadhan",
      nickname: "Madan",
      title: "Junior Web Developer",
      avatar: "/uploads/profile/photos/fotoku.jpeg",
      cvUrl: "/uploads/profile/documents/cv.pdf",
      bio: "Mahasiswa Informatika Semester 6 yang fokus pada Web Development. Berpengalaman membangun aplikasi Fullstack menggunakan React.js, Node.js, dan PostgreSql. Suka memecahkan masalah kompleks dan menciptakan UI yang interaktif serta performa tinggi.",
      email: "26oktoberramadhan@gmail.com",
      phone: "+6283141931776",
      github: "https://github.com/madan-stack",
      linkedin: "https://linkedin.com/in/muhammad-nur-ramadhan",
      instagram: "https://instagram.com/madan_stack",
    },
  });

  await prisma.project.createMany({
    data: [
      {
        title: "Katalog Restoran PWA",
        description: "Aplikasi katalog restoran dengan fitur Progressive Web App (PWA), favorite restaurant (IDB), dan End-to-End Testing.",
        technologies: ["JavaScript", "PWA", "Webpack", "Jasmine"],
        imageUrl: "/projects/restaurant.jpg",
        demoUrl: "https://restaurant-apps.vercel.app",
        githubUrl: "https://github.com/madan-stack/restaurant-apps",
        featured: true,
        sortOrder: 1,
      },
      {
        title: "E-Commerce Dashboard",
        description: "Platform manajemen produk untuk UMKM dengan fitur CRUD, upload gambar, dan manajemen stok real-time.",
        technologies: ["Next.js", "TypeScript", "Prisma", "Tailwind"],
        imageUrl: "/projects/ecommerce.jpg",
        demoUrl: "https://demo-ecommerce.vercel.app",
        githubUrl: "https://github.com/madan-stack/ecommerce",
        featured: true,
        sortOrder: 2,
      },
    ],
  });

  await prisma.experience.createMany({
    data: [
      {
        role: "Frontend Developer Intern",
        company: "PT Nusantara Digital",
        type: "Internship",
        period: "Jan 2025 - Apr 2025",
        location: "Remote",
        description: "Membantu tim produk membangun halaman dashboard internal dengan fokus pada komponen UI yang reusable dan responsif.",
        highlights: [
          "Membuat komponen tabel, filter, dan form input menggunakan React dan Tailwind CSS.",
          "Berkoordinasi dengan designer untuk menyesuaikan tampilan berdasarkan feedback pengguna.",
          "Melakukan slicing halaman dari Figma ke komponen frontend yang siap diintegrasikan.",
        ],
        technologies: ["React", "Tailwind CSS", "TypeScript", "Figma"],
        sortOrder: 1,
      },
      {
        role: "Fullstack Web Developer",
        company: "Freelance Project",
        type: "Freelance",
        period: "Mei 2025 - Agu 2025",
        location: "Makassar, Indonesia",
        description: "Mengembangkan aplikasi web sederhana untuk manajemen data pelanggan dan transaksi bagi kebutuhan bisnis kecil.",
        highlights: [
          "Membangun fitur CRUD, autentikasi dasar, dan dashboard ringkasan data.",
          "Mendesain struktur database agar data pelanggan, produk, dan transaksi mudah dikelola.",
          "Menyiapkan deployment aplikasi serta dokumentasi singkat untuk pengguna akhir.",
        ],
        technologies: ["Next.js", "Node.js", "PostgreSQL", "Vercel"],
        sortOrder: 2,
      },
      {
        role: "Backend Developer Assistant",
        company: "Informatics Student Project",
        type: "Project Based",
        period: "Sep 2025 - Nov 2025",
        location: "Hybrid",
        description: "Berperan dalam pengembangan API untuk aplikasi tugas kelompok dengan perhatian pada validasi data dan struktur endpoint.",
        highlights: [
          "Membuat REST API untuk modul pengguna, data utama, dan riwayat aktivitas.",
          "Menambahkan validasi request agar payload lebih konsisten sebelum masuk database.",
          "Membantu pengujian endpoint menggunakan Postman dan memperbaiki bug integrasi.",
        ],
        technologies: ["Express.js", "MySQL", "Postman", "Git"],
        sortOrder: 3,
      },
    ],
  });

  await prisma.certificate.createMany({
    data: [
      ["Belajar Fundamental Back-End dengan JavaScript", "Dicoding Indonesia", "30 November 2025", "https://www.dicoding.com/uploads/certificates/0LZ05MN53X65", "/uploads/certificates/Fundamental-Back-End.png"],
      ["Belajar Back-End Pemula dengan JavaScript", "Dicoding Indonesia", "27 Oktober 2025", "https://www.dicoding.com/uploads/certificates/QLZ96654MZ5D", "/uploads/certificates/Back-End-Pemula.png"],
      ["Belajar Fundamental Aplikasi Web dengan React", "Dicoding Indonesia", "17 September 2025", "https://www.dicoding.com/uploads/certificates/1OP8JW8VLPQK", "/uploads/certificates/Fundamental-Aplikasi-Web.png"],
      ["Belajar Membuat Aplikasi Web dengan React", "Dicoding Indonesia", "24 September 2025", "https://www.dicoding.com/uploads/certificates/JLX15DNRNZ72", "/uploads/certificates/Membuat-Aplikasi-Web-dengan-React.png"],
      ["Belajar Membuat Front-End Web untuk Pemula", "Dicoding Indonesia", "17 September 2025", "https://www.dicoding.com/uploads/certificates/L4PQ28R4OZO1", "/uploads/certificates/Membuat-Front-End-Web-untuk-Pemula.png"],
      ["Belajar Dasar Pemrograman Web", "Dicoding Indonesia", "03 September 2025", "https://www.dicoding.com/uploads/certificates/0LZ05G573X65", "/uploads/certificates/Dasar-Pemrograman-Web.png"],
      ["Belajar Dasar Pemrograman JavaScript", "Dicoding Indonesia", "10 September 2025", "https://www.dicoding.com/uploads/certificates/JMZVV91K3ZN9", "/uploads/certificates/Dasar-Pemrograman-JavaScript.png"],
      ["Memulai Dasar Pemrograman untuk Menjadi Pengembang Software", "Dicoding Indonesia", "27 Agustus 2025", "https://www.dicoding.com/uploads/certificates/GRX5JL9KKX0M", "/uploads/certificates/Memulai-Dasar-Pemrograman-untuk-Menjadi-Pengembang-Software.png"],
      ["Belajar Dasar AI", "Dicoding Indonesia", "08 Oktober 2025", "https://www.dicoding.com/uploads/certificates/EYX4KV4Q6PDL", "/uploads/certificates/Belajar-Dasar-AI.png"],
    ].map(([name, issuer, date, url, imageUrl], index) => ({
      name,
      issuer,
      date,
      url,
      imageUrl,
      sortOrder: index + 1,
    })),
  });

  await prisma.skill.createMany({
    data: [
      ...["React", "Next.js", "Tailwind CSS", "JavaScript", "Express.js", "Netlify", "Railway"].map((name, index) => ({
        name,
        iconKey: name.toLowerCase().replaceAll(".", "").replaceAll(" ", "-"),
        group: "row1",
        sortOrder: index + 1,
      })),
      ...["Node.js", "MySQL", "Git", "Postman", "PostgreSQL", "Figma", "Vercel", "Google Gemini"].map((name, index) => ({
        name,
        iconKey: name.toLowerCase().replaceAll(".", "").replaceAll(" ", "-"),
        group: "row2",
        sortOrder: index + 1,
      })),
    ],
  });

  await prisma.comment.createMany({
    data: [
      {
        name: "Rizky Pratama",
        role: "Frontend Developer",
        message: "Portofolionya terasa modern dan interaktif. Bagian 3D background membuat halaman terlihat lebih hidup tanpa mengganggu konten utama.",
      },
      {
        name: "Nadia Putri",
        role: "UI Designer",
        message: "Layout foto, tombol, dan section project sudah rapi. Sidebar icon-only juga membuat navigasi terlihat lebih bersih.",
      },
      {
        name: "Dimas Saputra",
        role: "Backend Learner",
        message: "Section komentar ini cocok untuk nanti disambungkan ke API, ORM, dan database supaya bisa jadi fitur CRUD penuh.",
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
