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
        colors={["#7CB9E8", "#F0F8FF", "#7FFFD4", "#6F00FF"]}
        mode="colorShift"
        blur="soft"
        duration={5}
        scale={0.8}
      />
      <button
        className={`${className} relative gap-1 rounded-md bg-zinc-950 text-sm text-white outline outline-1 outline-[#fff2f21f]`}
      >
        {text}
      </button>
    </div>
  );
}
