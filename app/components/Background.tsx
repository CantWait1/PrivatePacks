"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { useMousePosition } from "../../hooks/useMousePosition";
import { useReducedMotion } from "../../hooks/useReducedMotion";

export default function Background({ intensity = 1 }: { intensity?: number }) {
  const [mounted, setMounted] = useState(false);
  const mousePosition = useMousePosition();
  const reduceEffects = useReducedMotion();
  const particlesRef = useRef<any>(null);
  const [distortionIntensity, setDistortionIntensity] = useState(0);
  const distortionTimeoutRef = useRef<any>(null);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  // Use useEffect for client-side only code
  useEffect(() => {
    setMounted(true);

    return () => {
      clearTimeout(distortionTimeoutRef.current);
    };
  }, []);

  // Handle mouse movement and distortion effects
  useEffect(() => {
    if (!mounted) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newPosition = {
        x: e.clientX / window.innerWidth - 0.5,
        y: e.clientY / window.innerHeight - 0.5,
      };

      const dx = newPosition.x - previousMousePosition.current.x;
      const dy = newPosition.y - previousMousePosition.current.y;
      const speed = Math.sqrt(dx * dx + dy * dy);

      previousMousePosition.current = newPosition;

      if (speed > 0.003) {
        setDistortionIntensity((prev) => Math.min(1, prev + speed * 10));
      }

      clearTimeout(distortionTimeoutRef.current);
      distortionTimeoutRef.current = setTimeout(() => {
        setDistortionIntensity((prev) => Math.max(0, prev * 0.95));
      }, 50);
    };

    const handleClick = () => {
      setDistortionIntensity((prev) => Math.min(1, prev + 0.3));
      clearTimeout(distortionTimeoutRef.current);
      distortionTimeoutRef.current = setTimeout(() => {
        setDistortionIntensity((prev) => Math.max(0, prev * 0.9));
      }, 50);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      clearTimeout(distortionTimeoutRef.current);
    };
  }, [mounted]);

  // Initialize particles with consistent values
  useEffect(() => {
    if (!mounted) return;

    // Only initialize if not already done
    if (!particlesRef.current) {
      // Use a deterministic seed for random values
      const seed = 42;
      const pseudoRandom = (seed) => {
        let value = seed;
        return () => {
          value = (value * 9301 + 49297) % 233280;
          return value / 233280;
        };
      };

      const random = pseudoRandom(seed);

      // Generate particles with consistent properties
      particlesRef.current = Array(reduceEffects ? 10 : 20)
        .fill(0)
        .map((_, i) => ({
          id: i,
          width: random() * 4 + 1,
          height: random() * 4 + 1,
          left: random() * 100,
          top: random() * 100,
          baseOpacity: random() * 0.5 + 0.2,
          yDuration: random() * 4 + 3,
          yDelay: random() * 5,
          opacityDuration: random() * 3 + 2,
        }));
    }
  }, [mounted, reduceEffects]);

  // Don't render anything until client-side
  if (!mounted) {
    return null;
  }

  const isActive = mousePosition.x !== 0 && mousePosition.y !== 0;
  const rotationIntensity = isActive ? 1 : 0.2;

  return (
    <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden perspective-1200">
      {/* Background layers with 3D effect */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          width: "200%",
          height: "100%",
          backgroundImage: "url('/background.jpg')",
          backgroundSize: "50% 100%",
          backgroundRepeat: "repeat-x",
          opacity: 0.6,
          filter: "brightness(0.6) blur(3px)",
        }}
        animate={{
          x: [0, "-50%"],
          y: mousePosition.y * -8 * intensity,
          rotateY: mousePosition.x * 3 * rotationIntensity,
          rotateX: mousePosition.y * -2 * rotationIntensity,
          scale: isActive ? [1, 1.01, 1] : 1,
        }}
        transition={{
          x: {
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
            duration: 90,
            ease: "linear",
          },
          y: { duration: 0.1, ease: "linear" },
          rotateY: { duration: 0.2, ease: "easeOut" },
          rotateX: { duration: 0.2, ease: "easeOut" },
          scale: {
            duration: 2,
            repeat: isActive ? Number.POSITIVE_INFINITY : 0,
            repeatType: "reverse",
          },
        }}
      />

      {/* Middle layer - medium movement */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          width: "200%",
          height: "100%",
          backgroundImage: "url('/background.jpg')",
          backgroundSize: "50% 100%",
          backgroundRepeat: "repeat-x",
          opacity: 0.9,
        }}
        animate={{
          x: [0, "-50%"],
          y: mousePosition.y * -20 * intensity,
          rotateY: mousePosition.x * 6 * rotationIntensity,
          rotateX: mousePosition.y * -4 * rotationIntensity,
          scale: isActive ? [1, 1.02, 1] : 1,
        }}
        transition={{
          x: {
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
            duration: 60,
            ease: "linear",
          },
          y: { duration: 0.1, ease: "linear" },
          rotateY: { duration: 0.2, ease: "easeOut" },
          rotateX: { duration: 0.2, ease: "easeOut" },
          scale: {
            duration: 2.5,
            repeat: isActive ? Number.POSITIVE_INFINITY : 0,
            repeatType: "reverse",
          },
        }}
      />

      {/* Front layer - fastest movement */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          width: "200%",
          height: "100%",
          backgroundImage: "url('/background.jpg')",
          backgroundSize: "50% 100%",
          backgroundRepeat: "repeat-x",
          opacity: 0.5,
          filter: "brightness(1.2) contrast(1.1)",
        }}
        animate={{
          x: [0, "-50%"],
          y: mousePosition.y * -30 * intensity,
          rotateY: mousePosition.x * 9 * rotationIntensity,
          rotateX: mousePosition.y * -6 * rotationIntensity,
          scale: isActive ? [1, 1.03, 1] : 1,
        }}
        transition={{
          x: {
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
            duration: 40,
            ease: "linear",
          },
          y: { duration: 0.1, ease: "linear" },
          rotateY: { duration: 0.2, ease: "easeOut" },
          rotateX: { duration: 0.2, ease: "easeOut" },
          scale: {
            duration: 3,
            repeat: isActive ? Number.POSITIVE_INFINITY : 0,
            repeatType: "reverse",
          },
        }}
      />

      {/* Sophisticated space-time distortion effect */}
      <motion.div
        style={{
          position: "absolute",
          left: `calc(${(mousePosition.x + 0.5) * 100}% - 200px)`,
          top: `calc(${(mousePosition.y + 0.5) * 100}% - 200px)`,
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          pointerEvents: "none",
          filter: `url(#distortion-filter)`,
          opacity: 0.9,
          mixBlendMode: "multiply",
        }}
        animate={{
          scale: distortionIntensity > 0.2 ? [1, 1.05, 1] : 1,
        }}
        transition={{
          scale: {
            duration: 1.5,
            repeat: distortionIntensity > 0.2 ? Number.POSITIVE_INFINITY : 0,
            repeatType: "reverse",
          },
        }}
      >
        {/* Subtle dark center */}
        <motion.div
          style={{
            position: "absolute",
            inset: "35%",
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(0, 0, 0, ${
              0.5 + distortionIntensity * 0.3
            }) 0%, rgba(0, 0, 0, ${
              0.2 + distortionIntensity * 0.2
            }) 70%, transparent 100%)`,
            opacity: 0.7 + distortionIntensity * 0.3,
          }}
        />
      </motion.div>

      {/* Interactive light beam following cursor */}
      <motion.div
        style={{
          position: "absolute",
          left: `calc(${(mousePosition.x + 0.5) * 100}% - 200px)`,
          top: `calc(${(mousePosition.y + 0.5) * 100}% - 200px)`,
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(circle, rgba(150,150,255,0.15) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
        animate={{
          opacity: isActive ? [0.6, 0.8, 0.6] : 0.2,
          scale: isActive ? [1, 1.2, 1] : 0.8,
        }}
        transition={{
          opacity: {
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          },
          scale: {
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          },
        }}
      />

      {/* Particle effect for depth - with consistent values between server and client */}
      <div className="absolute inset-0 pointer-events-none">
        {particlesRef.current &&
          particlesRef.current.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full bg-white/10"
              style={{
                width: `${particle.width}px`,
                height: `${particle.height}px`,
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                opacity: particle.baseOpacity,
              }}
              animate={{
                y: [0, -15, 0],
                x: mousePosition.x * ((particle.id % 4) + 1) * 20 * intensity,
                opacity: isActive
                  ? [
                      particle.baseOpacity,
                      particle.baseOpacity + 0.2,
                      particle.baseOpacity,
                    ]
                  : [
                      particle.baseOpacity - 0.3,
                      particle.baseOpacity - 0.2,
                      particle.baseOpacity - 0.3,
                    ],
              }}
              transition={{
                y: {
                  duration: particle.yDuration,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                  delay: particle.yDelay,
                },
                x: { duration: 0.2 },
                opacity: {
                  duration: particle.opacityDuration,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                },
              }}
            />
          ))}
      </div>

      {/* Click ripple effect */}
      {distortionIntensity > 0.3 && (
        <motion.div
          style={{
            position: "absolute",
            left: `calc(${(mousePosition.x + 0.5) * 100}% - 100px)`,
            top: `calc(${(mousePosition.y + 0.5) * 100}% - 100px)`,
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            border: `1px solid rgba(255, 255, 255, ${
              distortionIntensity * 0.15
            })`,
            boxShadow: `0 0 10px 1px rgba(255, 255, 255, ${
              distortionIntensity * 0.1
            })`,
            opacity: 0,
          }}
          initial={{ scale: 0.2, opacity: 0.5 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{
            duration: 1.2,
            ease: "easeOut",
            repeat: 1,
          }}
        />
      )}

      {/* Enhanced 3D depth vignette - follows mouse slightly */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(
            ellipse at ${50 + mousePosition.x * 15}% ${
            50 + mousePosition.y * 15
          }%, 
            transparent 0%, 
            transparent 60%, 
            rgba(0,0,0,0.7) 100%
          )`,
          pointerEvents: "none",
        }}
        animate={{
          opacity: isActive ? [0.8, 0.9, 0.8] : 0.7,
        }}
        transition={{
          duration: 6,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "mirror",
        }}
      />

      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter id="distortion-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation={5} result="blur" />
            <feDisplacementMap
              in="blur"
              in2="blur"
              scale={30 + distortionIntensity * 20}
              xChannelSelector="R"
              yChannelSelector="G"
              result="displacement"
            />
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.005"
              numOctaves="2"
              result="turbulence"
              seed="5"
            />
            <feDisplacementMap
              in="displacement"
              in2="turbulence"
              scale={10 + distortionIntensity * 10}
              xChannelSelector="R"
              yChannelSelector="B"
            />
          </filter>
        </defs>
      </svg>

      <style jsx global>{`
        .perspective-1200 {
          perspective: 1200px;
          transform-style: preserve-3d;
          will-change: transform;
        }
      `}</style>
    </div>
  );
}
