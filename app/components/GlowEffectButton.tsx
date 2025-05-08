import { GlowEffect } from "@/components/motion-primitives/glow-effect";
import { ArrowRight } from "lucide-react";

interface GlowEffectProps {
  text: string;
  className?: string;
}

export function GlowEffectButton({ text, className }: GlowEffectProps) {
  return (
    <div className="relative">
      <GlowEffect
        colors={["#003769", "#003769", "#000000", "#000000"]}
        mode="colorShift"
        blur="softest"
        duration={10}
        scale={1.0}
      />
      <button className={`${className}`}>{text}</button>
    </div>
  );
}
