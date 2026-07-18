import { Dices, Coins, TrendingUp, TrendingDown, Percent, Gem } from "lucide-react";
import { cn } from "@/lib/cn";

type Doodle = {
  Icon: typeof Gem;
  className: string;
  anim: string;
  rot: number;
};

const DOODLES: Doodle[] = [
  { Icon: Gem, className: "left-[7%] top-[16%] size-9 text-brand/[0.09]", anim: "float-slow", rot: -12 },
  { Icon: Coins, className: "right-[10%] top-[12%] size-10 text-win/[0.08]", anim: "float-slower", rot: 8 },
  { Icon: Dices, className: "left-[14%] bottom-[14%] size-11 text-ink/[0.05]", anim: "float-slow", rot: 10 },
  { Icon: TrendingUp, className: "right-[16%] bottom-[20%] size-9 text-win/[0.07]", anim: "float-slower", rot: -6 },
  { Icon: TrendingDown, className: "left-[42%] top-[8%] size-7 text-loss/[0.07]", anim: "float-slow", rot: 6 },
  { Icon: Percent, className: "right-[38%] bottom-[10%] size-7 text-brand/[0.07]", anim: "float-slower", rot: -8 },
];

export function DynamicBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* drifting colour orbs */}
      <div
        className="orb drift-a"
        style={{
          top: "-12%",
          left: "-6%",
          width: "48vw",
          height: "48vw",
          opacity: 0.3,
          background:
            "radial-gradient(circle at 30% 30%, color-mix(in oklch, var(--color-brand) 55%, transparent), transparent 70%)",
        }}
      />
      <div
        className="orb drift-b"
        style={{
          top: "18%",
          right: "-12%",
          width: "44vw",
          height: "44vw",
          opacity: 0.18,
          background:
            "radial-gradient(circle at 60% 40%, color-mix(in oklch, var(--color-win) 45%, transparent), transparent 70%)",
        }}
      />
      <div
        className="orb drift-c"
        style={{
          bottom: "-18%",
          left: "24%",
          width: "42vw",
          height: "42vw",
          opacity: 0.16,
          background:
            "radial-gradient(circle at 50% 50%, color-mix(in oklch, oklch(0.6 0.17 285) 50%, transparent), transparent 70%)",
        }}
      />

      {/* dot field */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.5,
          backgroundImage:
            "radial-gradient(color-mix(in oklch, var(--color-line) 65%, transparent) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage:
            "radial-gradient(ellipse 100% 80% at 50% 25%, black, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 100% 80% at 50% 25%, black, transparent 80%)",
        }}
      />

      {/* floating doodles */}
      {DOODLES.map(({ Icon, className, anim, rot }, i) => (
        <div
          key={i}
          className={cn("absolute", anim, className)}
          style={{ ["--r" as string]: `${rot}deg` }}
        >
          <Icon className="size-full" strokeWidth={1.25} />
        </div>
      ))}

      {/* top brand glow + edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, color-mix(in oklch, var(--color-brand) 9%, transparent), transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          boxShadow:
            "inset 0 -140px 220px -70px rgba(0,0,0,0.65), inset 0 140px 200px -90px rgba(0,0,0,0.4)",
        }}
      />
    </div>
  );
}
