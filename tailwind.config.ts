import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0a0a0a',
          surface: '#141414',
          card: '#1a1a1a',
          border: '#2a2a2a',
          hover: '#252525',
        },
        light: {
          bg: '#ffffff',
          surface: '#f8f9fa',
          card: '#ffffff',
          border: '#e5e7eb',
          hover: '#f3f4f6',
        },
        accent: {
          primary: '#8b5cf6',
          secondary: '#6366f1',
          hover: '#a78bfa',
          glow: 'rgba(139, 92, 246, 0.3)', 
        },
        text: {
          dark: {
            primary: '#f5f5f5',    
            secondary: '#a3a3a3',  
            muted: '#737373',      
          },
          light: {
            primary: '#171717',    
            secondary: '#525252',  
            muted: '#737373',      
          },
        },
      },
      // --- ANIMATION CONFIGURATION ---
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'gradient': 'gradient 8s linear infinite',
        'meteor': 'meteor 5s linear infinite',
        'scroll': 'scroll 40s linear infinite', // Animasi Scroll Lambat
        'scroll-reverse': 'scroll-reverse 40s linear infinite', // Scroll Arah Sebaliknya
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        gradient: {
          '0%, 100%': { 'background-position': 'left center' },
          '50%': { 'background-position': 'right center' },
        },
        meteor: {
          "0%": { transform: "rotate(215deg) translateX(0)", opacity: "1" },
          "70%": { opacity: "1" },
          "100%": {
            transform: "rotate(215deg) translateX(-500px)",
            opacity: "0",
          },
        },
        // --- KEYFRAMES SCROLL ---
        scroll: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-100%)" },
        },
        "scroll-reverse": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;