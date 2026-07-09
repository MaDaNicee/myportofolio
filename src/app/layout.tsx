import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import ClientNavbar from "@/components/ClientNavbar";
// Import komponen Meteors
import Meteors from "@/components/Meteors"; 

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Portfolio - Muhammad Nur Ramadhan",
  description: "FullStack Developer specializing in Next.js and modern web technologies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const savedTheme = localStorage.getItem('theme');
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              const theme = savedTheme || (prefersDark ? 'dark' : 'light');
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
              }
            })();
          `
        }} />
      </head>
      <body className={`${inter.variable} antialiased bg-light-bg dark:bg-dark-bg text-text-light-primary dark:text-text-dark-primary transition-colors duration-300 relative`}>
        <ThemeProvider>
          
          {/* === GLOBAL FIXED BACKGROUND === */}
          <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            {/* 1. Grid Pattern */}
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.6] dark:opacity-[0.5]" />
            
            {/* 2. Meteor Effect (Sekarang Sticky di seluruh halaman) */}
            <Meteors number={30} />
          </div>
          
          <ClientNavbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}