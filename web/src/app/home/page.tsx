"use client";

import Link from "next/link";
import { motion, type Variants } from "motion/react";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Scale,
  Globe,
  Lock,
  RotateCcw,
  Trophy,
  Swords,
  Gavel,
  Coins,
  Wallet,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

export default function HomePage() {
  return (
    <div className="flex flex-col gap-24 pb-16 sm:gap-32">
      <Hero />
      <HowItWorks />
      <Resolution />
      <Features />
      <FinalCta />
    </div>
  );
}

/* ------------------------------------------------------------------- Hero */

function Hero() {
  return (
    <section className="relative pt-8 sm:pt-14">
      <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div initial="hidden" animate="show" variants={stagger}>
          <motion.h1
            variants={fadeUp}
            className="display text-balance text-[2.6rem] leading-[1.02] text-ink sm:text-[3.4rem] lg:text-[3.9rem]"
          >
            Bet on anything.
            <br />
            Get paid <span className="text-brand">automatically</span>.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-md text-pretty text-base leading-relaxed text-ink-2"
          >
            Betr escrows both stakes onchain and pays the winner the moment a
            bet settles. No arguing, no chasing, no forgotten IOUs. Public or
            private, between friends or total strangers.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap gap-3">
            <Link href="/markets">
              <Button size="lg">
                Launch app
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <a href="#how">
              <Button size="lg" variant="outline">
                How it works
              </Button>
            </a>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[0.75rem] text-ink-3"
          >
            {["Non-custodial", "Optimistic settlement", "400ms blocks"].map(
              (t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-win" />
                  {t}
                </span>
              ),
            )}
          </motion.div>
        </motion.div>

        <HeroCard />
      </div>
    </section>
  );
}

function HeroCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: 1.5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
      className="relative mx-auto w-full max-w-sm"
    >
      {/* ambient light behind the glass, so the panel visibly refracts it */}
      <div
        aria-hidden
        className="absolute -inset-10 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(55% 55% at 30% 20%, color-mix(in oklch, var(--color-brand) 22%, transparent), transparent 70%), radial-gradient(50% 50% at 80% 85%, color-mix(in oklch, var(--color-glow) 20%, transparent), transparent 70%)",
        }}
      />

      {/* stacked card behind */}
      <div className="glass absolute -right-4 -top-4 hidden h-full w-full rounded-[var(--radius-xl)] opacity-40 sm:block" />

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
        className="glass-strong relative rounded-[var(--radius-xl)] p-6"
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-win/25 bg-win/12 px-2.5 py-1 text-[0.6875rem] font-medium text-win">
            <span className="size-1.5 rounded-full bg-win" />
            Settled
          </span>
          <span className="font-mono text-[0.6875rem] text-ink-3">
            BET #042
          </span>
        </div>

        <h3 className="mt-4 text-lg font-semibold leading-snug text-ink">
          Will BTC close above $100k on Friday?
        </h3>

        <div className="mt-5 space-y-2.5">
          <StakeRow name="you" amount="1.00" you />
          <StakeRow name="0x9f…c2a1" amount="1.00" />
        </div>

        <div className="my-5 h-px bg-gradient-to-r from-transparent via-line-strong to-transparent" />

        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-3">Payout</span>
          <span className="font-mono text-xl font-semibold text-win tnum">
            +2.00 MON
          </span>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[0.75rem] text-ink-3">
          <Zap className="size-3.5 text-brand" />
          Auto-paid to the winner onchain
        </p>
      </motion.div>
    </motion.div>
  );
}

function StakeRow({
  name,
  amount,
  you,
}: {
  name: string;
  amount: string;
  you?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-line bg-bg-2/60 px-3 py-2.5">
      <span className="flex items-center gap-2 font-mono text-[0.8125rem] text-ink-2">
        <Wallet className="size-3.5 text-ink-3" />
        {name}
        {you && (
          <span className="rounded-full bg-brand/12 px-1.5 py-px text-[0.625rem] text-brand">
            YOU
          </span>
        )}
      </span>
      <span className="font-mono text-[0.8125rem] text-ink tnum">
        {amount} MON
      </span>
    </div>
  );
}

/* --------------------------------------------------------- How it works */

const STEPS = [
  {
    icon: Coins,
    title: "Create",
    desc: "Set the question, stake, and a neutral arbiter. Your stake is escrowed onchain.",
  },
  {
    icon: Swords,
    title: "Match",
    desc: "Someone takes the other side with an equal stake. The bet locks in and goes live.",
  },
  {
    icon: Trophy,
    title: "Claim",
    desc: "After the outcome, the winner claims. Silence from the other side is concession.",
  },
  {
    icon: ShieldCheck,
    title: "Settle",
    desc: "Unchallenged, it settles itself and pays out. Disputes go to the arbiter.",
  },
];

function HowItWorks() {
  return (
    <Section id="how" title="Four steps, then it pays itself.">
      {/* One instrument panel, not four clone cards: the flow reads as a
          single rail because it is one — a strict onchain sequence. */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        className="glass overflow-hidden rounded-[var(--radius-xl)]"
      >
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.title}
              variants={fadeUp}
              className={cn(
                "group relative flex flex-col gap-3 p-6",
                // internal hairlines instead of card borders
                i > 0 && "border-line/70 max-lg:border-t lg:border-l",
                i === 1 && "sm:max-lg:border-t-0 sm:max-lg:border-l",
                i === 3 && "sm:max-lg:border-l",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="grid size-10 place-items-center rounded-[var(--radius-md)] border border-brand/25 bg-brand/10 text-brand transition-transform duration-200 group-hover:scale-110">
                  <s.icon className="size-5" />
                </div>
                <span className="font-mono text-[0.6875rem] text-ink-3">
                  {String(i + 1).padStart(2, "0")} / 04
                </span>
              </div>
              <h3 className="text-base font-semibold text-ink">{s.title}</h3>
              <p className="text-[0.8125rem] leading-relaxed text-ink-3">
                {s.desc}
              </p>
              {i < STEPS.length - 1 && (
                <ArrowRight className="absolute -right-2 top-9 z-[2] hidden size-4 text-ink-3 lg:block" />
              )}
            </motion.li>
          ))}
        </ol>
      </motion.div>
    </Section>
  );
}

/* ----------------------------------------------------- Optimistic resolution */

const LADDER = [
  {
    tone: "win" as const,
    icon: Trophy,
    title: "Claim & concede",
    step: "Common case",
    body: "One side claims the win. The other has a challenge window to object. Silence is concession: it settles to the claimant, free.",
  },
  {
    tone: "warn" as const,
    icon: Swords,
    title: "Dispute",
    step: "If contested",
    body: "Disagree? Post a bond and dispute. Frivolous disputes cost you that bond, so only the honest bother.",
  },
  {
    tone: "brand" as const,
    icon: Gavel,
    title: "Arbiter rules",
    step: "Last resort",
    body: "The named arbiter decides. The winner takes the pot and both bonds; the liar forfeits theirs. If the arbiter vanishes, everyone is refunded.",
  },
];

const LADDER_TONES = {
  win: "border-win/25 bg-win/10 text-win",
  warn: "border-warn/25 bg-warn/10 text-warn",
  brand: "border-brand/25 bg-brand/10 text-brand",
};

function Resolution() {
  return (
    <Section
      title="Honest bets settle themselves."
      subtitle="Most bets never need a referee. Whoever's right just claims, and if nobody objects, the pot pays out. A referee only steps in when both sides insist they won."
    >
      {/* One escalation ladder — each rung only exists if the one above fails */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        className="glass overflow-hidden rounded-[var(--radius-xl)]"
      >
        {LADDER.map((r, i) => (
          <motion.div
            key={r.title}
            variants={fadeUp}
            className={cn(
              "grid gap-4 p-6 sm:grid-cols-[auto_200px_1fr] sm:items-center sm:gap-8",
              i > 0 && "border-t border-line/70",
            )}
          >
            <div
              className={cn(
                "grid size-11 place-items-center rounded-[var(--radius-md)] border",
                LADDER_TONES[r.tone],
              )}
            >
              <r.icon className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-ink">{r.title}</h3>
              <span className="label mt-1 block">{r.step}</span>
            </div>
            <p className="max-w-prose text-[0.875rem] leading-relaxed text-ink-2">
              {r.body}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}

/* ---------------------------------------------------------------- Features */

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Trustless escrow",
    desc: "Both stakes are locked in a verified smart contract. No middleman ever holds your money.",
    span: "sm:col-span-2",
  },
  {
    icon: Zap,
    title: "Automatic payout",
    desc: "The winner is paid the instant it settles.",
  },
  {
    icon: Globe,
    title: "Public markets",
    desc: "List a bet anyone can take from the dashboard.",
  },
  {
    icon: Lock,
    title: "Private bets",
    desc: "Share a link, or lock it to one wallet.",
  },
  {
    icon: RotateCcw,
    title: "Guaranteed refunds",
    desc: "Every stall (no match, no result, absent arbiter) unwinds to a full refund. Funds are never stuck.",
    span: "sm:col-span-2",
  },
];

function Features() {
  return (
    <Section title="Built to be fair by construction.">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        className="grid gap-4 sm:grid-cols-3"
      >
        {FEATURES.map((f) => (
          <motion.div
            key={f.title}
            variants={fadeUp}
            className={cn(
              "glass glass-hover group flex flex-col gap-3 rounded-[var(--radius-lg)] p-6",
              f.span,
            )}
          >
            <div className="grid size-10 place-items-center rounded-[var(--radius-md)] border border-line bg-surface-2 text-brand transition-colors group-hover:border-brand/40">
              <f.icon className="size-5" />
            </div>
            <h3 className="text-base font-semibold text-ink">{f.title}</h3>
            <p className="text-[0.8125rem] leading-relaxed text-ink-3">
              {f.desc}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}

/* --------------------------------------------------------------- Final CTA */

function FinalCta() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: EASE }}
      className="glass-strong relative overflow-hidden rounded-[var(--radius-xl)] px-6 py-16 text-center sm:py-24"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 100% at 30% 0%, color-mix(in oklch, var(--color-brand) 14%, transparent), transparent 70%), radial-gradient(50% 90% at 80% 100%, color-mix(in oklch, var(--color-glow) 12%, transparent), transparent 70%)",
        }}
      />
      <div className="relative">
        <Scale className="mx-auto size-8 text-brand" />
        <h2 className="display mx-auto mt-6 max-w-xl text-balance text-3xl text-ink sm:text-[2.6rem] sm:leading-[1.08]">
          Settle the score, once and for all.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-pretty text-ink-2">
          Stop chasing your friends for a tenner. Put it onchain and let the
          contract pay out.
        </p>
        <div className="mt-9 flex justify-center">
          <Link href="/markets">
            <Button size="lg">
              Launch app
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.section>
  );
}

/* ----------------------------------------------------------------- Section */

function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        className="mb-9 max-w-2xl"
      >
        <motion.h2
          variants={fadeUp}
          className="display text-balance text-[1.75rem] text-ink sm:text-[2.15rem]"
        >
          {title}
        </motion.h2>
        {subtitle && (
          <motion.p
            variants={fadeUp}
            className="mt-3 max-w-prose text-pretty leading-relaxed text-ink-2"
          >
            {subtitle}
          </motion.p>
        )}
      </motion.div>
      {children}
    </section>
  );
}
