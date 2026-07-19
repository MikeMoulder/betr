import { Dices, Coins, TrendingUp, TrendingDown, Percent, Gem } from "lucide-react";
import { cn } from "@/lib/cn";

/* Film grain — tiny SVG turbulence tile, inlined so it costs no request. */
const NOISE_URI = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E")`;

/* Floating doodles — faint betting iconography drifting behind the glass. */
type Doodle = {
  Icon: typeof Gem;
  className: string;
  anim: string;
  rot: number;
};

const DOODLES: Doodle[] = [
  { Icon: Gem, className: "left-[7%] top-[16%] size-9 text-brand/[0.10]", anim: "float-slow", rot: -12 },
  { Icon: Coins, className: "right-[10%] top-[12%] size-10 text-win/[0.09]", anim: "float-slower", rot: 8 },
  { Icon: Dices, className: "left-[14%] bottom-[14%] size-11 text-ink/[0.06]", anim: "float-slow", rot: 10 },
  { Icon: TrendingUp, className: "right-[16%] bottom-[20%] size-9 text-win/[0.08]", anim: "float-slower", rot: -6 },
  { Icon: TrendingDown, className: "left-[42%] top-[8%] size-7 text-loss/[0.08]", anim: "float-slow", rot: 6 },
  { Icon: Percent, className: "right-[38%] bottom-[10%] size-7 text-brand/[0.08]", anim: "float-slower", rot: -8 },
];

export function DynamicBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* aurora — the light the glass panels refract */}
      <div
        className="orb drift-a"
        style={{
          top: "-14%",
          left: "-8%",
          width: "52vw",
          height: "52vw",
          opacity: 0.42,
          background:
            "radial-gradient(circle at 30% 30%, color-mix(in oklch, var(--color-brand) 60%, transparent), transparent 70%)",
        }}
      />
      <div
        className="orb drift-b"
        style={{
          top: "12%",
          right: "-14%",
          width: "48vw",
          height: "48vw",
          opacity: 0.3,
          background:
            "radial-gradient(circle at 60% 40%, color-mix(in oklch, var(--color-glow) 55%, transparent), transparent 70%)",
        }}
      />
      <div
        className="orb drift-c"
        style={{
          bottom: "-20%",
          left: "22%",
          width: "46vw",
          height: "46vw",
          opacity: 0.22,
          background:
            "radial-gradient(circle at 50% 50%, color-mix(in oklch, var(--color-win) 45%, transparent), transparent 70%)",
        }}
      />

      {/* horizon beam under the nav — a thin band of cold light */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 8%, color-mix(in oklch, var(--color-brand) 45%, transparent) 50%, transparent 92%)",
          opacity: 0.5,
        }}
      />

      {/* dot field */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.45,
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
            "radial-gradient(120% 80% at 50% -10%, color-mix(in oklch, var(--color-brand) 10%, transparent), transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          boxShadow:
            "inset 0 -160px 240px -70px rgba(0,0,0,0.7), inset 0 140px 200px -90px rgba(0,0,0,0.45)",
        }}
      />

      {/* film grain — kills the vector-flat feel on large dark surfaces */}
      <div
        className="absolute inset-0 mix-blend-overlay"
        style={{ backgroundImage: NOISE_URI, opacity: 0.07 }}
      />
    </div>
  );
}
