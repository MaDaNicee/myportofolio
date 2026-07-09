'use client';

import { SkillItem } from '@/lib/data';

interface SkillSliderProps {
  skills: SkillItem[];
  direction: 'left' | 'right';
}

export default function SkillSlider({ skills, direction }: SkillSliderProps) {
  const animationClass = direction === 'left' ? 'animate-scroll-left' : 'animate-scroll-right';
  const duplicatedSkills = [...skills, ...skills];

  return (
    // UPDATE 1: Ubah 'py-4' menjadi 'py-1' agar tidak terlalu tinggi (gemuk)
    <div className="w-full overflow-hidden relative hover-pause py-1">
      
      {/* Gradient Overlay */}
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-light-bg to-transparent dark:from-dark-bg z-10 pointer-events-none"></div>
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-light-bg to-transparent dark:from-dark-bg z-10 pointer-events-none"></div>

      {/* UPDATE 2: Ubah 'gap-6' menjadi 'gap-4' agar icon lebih dekat satu sama lain */}
      <div className={`flex gap-4 w-max ${animationClass}`}>
        {duplicatedSkills.map((skill, index) => (
          <div
            key={index}
            // UPDATE 3: Opsional, ubah px-5 py-3 jadi px-4 py-2 agar kotak item lebih ramping
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-light-card/80 dark:bg-dark-card/80 border border-light-border/50 dark:border-dark-border/50 backdrop-blur-md shadow-sm hover:border-accent-primary/50 transition-colors group cursor-default"
          >
            <span className="group-hover:scale-110 transition-transform duration-300 text-xl">
                {skill.icon}
            </span>
            <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary whitespace-nowrap">
              {skill.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}