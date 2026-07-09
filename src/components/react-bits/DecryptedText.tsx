'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

// Fix S6759: Mark props as read-only
interface DecryptedTextProps {
  readonly text: string;
  readonly speed?: number;
  readonly maxIterations?: number;
  readonly sequential?: boolean;
  readonly revealDirection?: 'start' | 'end' | 'center';
  readonly useOriginalCharsOnly?: boolean;
  readonly characters?: string;
  readonly className?: string;
  readonly parentClassName?: string;
  readonly animateOn?: 'view' | 'hover';
  readonly [key: string]: any;
}

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = 'start',
  useOriginalCharsOnly = false,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
  className = '',
  parentClassName = '',
  animateOn = 'hover',
  ...props
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  // Helper to get a random character
  const getNextChar = useCallback(() => {
    const source = useOriginalCharsOnly ? text : characters;
    const index = Math.floor(Math.random() * source.length);
    return source[index];
  }, [useOriginalCharsOnly, text, characters]);

  // Fix S2004 & S3776: Extracted logic to reduce nesting and complexity
  const resolveCharacter = useCallback((
    char: string, 
    index: number, 
    currentIteration: number
  ) => {
    if (char === ' ') return char;

    if (sequential) {
      const progress = currentIteration / maxIterations;
      const len = text.length;

      if (revealDirection === 'start') {
        if (index < progress * len) return text[index];
      } else if (revealDirection === 'end') {
        if (index > len - (progress * len)) return text[index];
      } else if (revealDirection === 'center') {
        const center = len / 2;
        const range = progress * center;
        if (index >= center - range && index <= center + range) return text[index];
      }
    }
    
    return getNextChar();
  }, [sequential, revealDirection, maxIterations, text, getNextChar]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let currentIteration = 0;

    const runAnimation = () => {
      if (currentIteration >= maxIterations) {
        setDisplayText(text);
        return;
      }

      setDisplayText((prev) =>
        prev
          .split('')
          .map((char, index) => resolveCharacter(char, index, currentIteration))
          .join('')
      );
      currentIteration++;
    };

    if ((animateOn === 'view' && isScrolled) || (animateOn === 'hover' && isHovering)) {
      interval = setInterval(runAnimation, speed);
    } else {
      setDisplayText(text);
    }

    return () => clearInterval(interval);
  }, [
    text,
    speed,
    maxIterations,
    animateOn,
    isHovering,
    isScrolled,
    resolveCharacter // Added dependency
  ]);

  useEffect(() => {
    if (animateOn !== 'view') return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsScrolled(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [animateOn]);

  return (
    <motion.span
      ref={containerRef}
      className={`inline-block whitespace-nowrap ${parentClassName}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      {...props}
    >
      <span className={className}>{displayText}</span>
    </motion.span>
  );
}