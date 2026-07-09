// src/components/MagneticButton.tsx
'use client';

import { motion } from 'framer-motion';
import { useRef, useState, ReactNode } from 'react';

interface MagneticButtonProps {
  children: ReactNode;
  href?: string;
  className?: string;
}

export default function MagneticButton({ children, href, className = "" }: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    // Mengambil posisi & ukuran tombol saat ini
    const { height, width, left, top } = ref.current!.getBoundingClientRect();
    
    // Hitung posisi kursor relatif terhadap tengah tombol
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    
    // Gerakkan tombol sedikit mengikuti kursor (0.2 = kekuatan magnet)
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 }); // Kembali ke posisi semula saat mouse keluar
  };

  const { x, y } = position;

  return (
    <motion.a
      ref={ref}
      href={href}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={`inline-block ${className}`} // inline-block agar transform bekerja
    >
      {children}
    </motion.a>
  );
}