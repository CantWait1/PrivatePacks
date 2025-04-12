"use client";
import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { motion } from "framer-motion";
import { nexaLight } from "@/fonts/fonts";

export function AnimatedNumberInView() {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== undefined) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true);
      setCount(0);
      const startTime = Date.now();
      const duration = 2500;

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const nextCount = Math.floor(progress * 500);

        setCount(nextCount);

        if (nextCount >= 500) {
          setCount(500);
          if (intervalRef.current !== undefined) {
            clearInterval(intervalRef.current);
          }
        }
      }, 16);
    }
  }, [isInView, hasAnimated]);

  return (
    <div
      className="flex w-full items-center justify-center mt-10 outlined-text"
      ref={ref}
    >
      <motion.span
        className={`inline-flex items-center font-mono text-7xl font-light text-zinc-800 dark:text-zinc-50 ${nexaLight.className}`}
      >
        {count}
        {count === 500 ? "+" : ""} Members
      </motion.span>
    </div>
  );
}
