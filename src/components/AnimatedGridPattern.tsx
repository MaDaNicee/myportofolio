'use client';

import { useEffect, useId, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedGridPatternProps {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  strokeDasharray?: any;
  numSquares?: number;
  className?: string;
  maxOpacity?: number;
  duration?: number;
  repeatDelay?: number;
}

export default function AnimatedGridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray = 0,
  numSquares = 30, // Jumlah kotak yang menyala bersamaan
  className,
  maxOpacity = 0.5,
  duration = 3,
  repeatDelay = 1,
  ...props
}: AnimatedGridPatternProps) {
  const id = useId();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // State untuk menyimpan posisi kotak-kotak yang sedang menyala
  const [squares, setSquares] = useState<{ id: number; x: number; y: number }[]>([]);

  // Fungsi untuk mendapatkan posisi grid acak
  const getPos = () => {
    return [
      Math.floor((Math.random() * dimensions.width) / width),
      Math.floor((Math.random() * dimensions.height) / height),
    ];
  };

  // Hitung ukuran layar untuk grid
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize(); // Set awal
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Loop untuk mengubah posisi kotak yang menyala
  useEffect(() => {
    if (dimensions.width === 0) return;

    const interval = setInterval(() => {
      setSquares((currentSquares) => {
        // Hapus kotak lama, tambah kotak baru agar terlihat "berjalan/hidup"
        const newSquares = [...currentSquares];
        
        // Hapus beberapa kotak lama jika terlalu banyak
        if (newSquares.length >= numSquares) {
            newSquares.shift(); // Hapus yang paling awal
        }

        // Tambah kotak baru
        const [x, y] = getPos();
        newSquares.push({ id: Date.now(), x, y });
        
        return newSquares;
      });
    }, 200); // Kecepatan muncul kotak baru (semakin kecil semakin cepat)

    return () => clearInterval(interval);
  }, [dimensions, numSquares]);

  return (
    <div className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}>
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full stroke-gray-200/30 dark:stroke-gray-700/30"
        {...props}
      >
        <defs>
          <pattern
            id={id}
            width={width}
            height={height}
            patternUnits="userSpaceOnUse"
            x={x}
            y={y}
          >
            <path
              d={`M.5 ${height}V.5H${width}`}
              fill="none"
              strokeDasharray={strokeDasharray}
            />
          </pattern>
        </defs>
        
        {/* Grid Dasar */}
        <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />

        {/* Kotak-Kotak yang Menyala */}
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(({ x, y, id: squareId }) => (
            <motion.rect
              initial={{ opacity: 0 }}
              animate={{ opacity: maxOpacity }}
              exit={{ opacity: 0 }}
              transition={{
                duration: duration,
                repeat: 1,
                repeatType: "reverse",
              }}
              onAnimationComplete={() => {
                 // Opsional: Bersihkan state jika perlu, tapi useEffect sudah menangani antrian
              }}
              key={squareId}
              width={width - 1}
              height={height - 1}
              x={x * width + 1}
              y={y * height + 1}
              className="fill-accent-primary/30 stroke-accent-primary" // Warna kotak
              strokeWidth="0"
            />
          ))}
        </svg>
      </svg>
    </div>
  );
}