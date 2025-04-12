import { TextEffect } from "@/components/motion-primitives/text-effect";

interface TextEffectSpeedProps {
  text: string;
  className?: string;
}

export default function TextEffectSpeed({
  text,
  className,
}: TextEffectSpeedProps) {
  return (
    <TextEffect
      preset="fade-in-blur"
      speedReveal={1.1}
      speedSegment={0.3}
      className={`${className}`}
    >
      {text}
    </TextEffect>
  );
}
