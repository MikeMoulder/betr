"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAddress, parseEther } from "viem";
import { useAccount, useChainId } from "wagmi";
import {
  ArrowLeft,
  Globe,
  Lock,
  Scale,
  Wallet,
  TriangleAlert,
  Info,
} from "lucide-react";
import {
  Button,
  Field,
  Input,
  Panel,
  Segmented,
  Textarea,
} from "@/components/ui";
import { WalletButton } from "@/components/WalletButton";
import { useBetCount } from "@/hooks/useBets";
import { useTx } from "@/hooks/useTx";
import {
  BETR_ADDRESS,
  betrAbi,
  DEFAULT_ARBITER,
  Visibility,
  ZERO_ADDRESS,
} from "@/lib/contract";
import { monadTestnet } from "@/lib/chain";
import { formatMon, shortAddr, toDatetimeLocal } from "@/lib/format";

function safeParseEther(v: string): bigint | null {
  try {
    if (!v.trim()) return null;
    const wei = parseEther(v.trim() as `${number}`);
    return wei > 0n ? wei : null;
  } catch {
    return null;
  }
}

function toUnix(local: string): number {
  const t = new Date(local).getTime();
  return Number.isFinite(t) ? Math.floor(t / 1000) : 0;
}

const STAKE_PRESETS = ["0.1", "0.5", "1", "5"];

export default function CreatePage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: betCount } = useBetCount();
  const { run, isPending } = useTx();

  const now = new Date();
  const [question, setQuestion] = useState("");
  const [stakeStr, setStakeStr] = useState("");
  const [visibility, setVisibility] = useState<Visibility>(Visibility.Public);
  const [counterparty, setCounterparty] = useState("");
  const [arbiter, setArbiter] = useState("");
  const [matchBy, setMatchBy] = useState(() =>
    toDatetimeLocal(new Date(now.getTime() + 24 * 3600 * 1000)),
  );
  const [resolveBy, setResolveBy] = useState(() =>
    toDatetimeLocal(new Date(now.getTime() + 3 * 24 * 3600 * 1000)),
  );

  const stakeWei = safeParseEther(stakeStr);
  const bondWei = stakeWei !== null ? stakeWei / 5n : null;
  const matchBySec = toUnix(matchBy);
  const resolveBySec = toUnix(resolveBy);
  // Kept fresh via an effect (not read during render) so the "must be in the
  // future" check can't go stale while the form sits open — a stale value slips
  // past client validation and reverts on-chain with "matchBy in past".
  const [nowSec, setNowSec] = useState(0);
  useEffect(() => {
    const tick = () => setNowSec(Math.floor(Date.now() / 1000));
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!question.trim()) e.question = "Describe what the bet is on.";
    if (stakeStr && stakeWei === null) e.stake = "Enter a positive amount.";
    if (visibility === Visibility.Private && counterparty.trim()) {
      if (!isAddress(counterparty.trim()))
        e.counterparty = "Not a valid address.";
      else if (
        address &&
        counterparty.trim().toLowerCase() === address.toLowerCase()
      )
        e.counterparty = "The counterparty can't be you.";
    }
    // Arbiter is optional — left blank, it falls back to Betr's default arbiter.
    const arb = arbiter.trim();
    if (arb && !isAddress(arb)) {
      e.arbiter = "Not a valid address.";
    } else {
      const usingDefault = !arb;
      const effective = (arb || DEFAULT_ARBITER).toLowerCase();
      if (address && effective === address.toLowerCase())
        e.arbiter = usingDefault
          ? "You're Betr's arbiter. Name someone else for this bet."
          : "The arbiter can't be you.";
      else if (
        visibility === Visibility.Private &&
        counterparty.trim() &&
        effective === counterparty.trim().toLowerCase()
      )
        e.arbiter = usingDefault
          ? "Betr's arbiter is the counterparty. Name someone else."
          : "The arbiter can't be the counterparty.";
    }
    if (matchBySec <= nowSec) e.matchBy = "Must be in the future.";
    if (resolveBySec <= matchBySec)
      e.resolveBy = "Must be after the match deadline.";
    return e;
  }, [
    question,
    stakeStr,
    stakeWei,
    visibility,
    counterparty,
    arbiter,
    address,
    matchBySec,
    resolveBySec,
    nowSec,
  ]);

  const wrongChain = isConnected && chainId !== monadTestnet.id;
  const ready =
    isConnected &&
    !wrongChain &&
    stakeWei !== null &&
    Object.keys(errors).length === 0;

  async function submit() {
    if (!ready || stakeWei === null) return;
    const expectedId = Number(betCount ?? 0n);
    const cp =
      visibility === Visibility.Private && counterparty.trim()
        ? (counterparty.trim() as `0x${string}`)
        : ZERO_ADDRESS;
    const arbiterAddr = (arbiter.trim() || DEFAULT_ARBITER) as `0x${string}`;

    await run(
      {
        address: BETR_ADDRESS,
        abi: betrAbi,
        functionName: "createBet",
        args: [
          question.trim(),
          visibility,
          cp,
          arbiterAddr,
          BigInt(matchBySec),
          BigInt(resolveBySec),
        ],
        value: stakeWei,
      },
      { pending: "Creating bet…", success: "Bet created & staked" },
      () => router.push(`/bet/${expectedId}`),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/markets"
          className="inline-flex items-center gap-1.5 text-sm text-ink-3 transition-colors hover:text-ink-2"
        >
          <ArrowLeft className="size-4" />
          Markets
        </Link>
        <h1 className="display mt-3 text-[1.75rem] text-ink sm:text-[2.1rem]">
          Create a bet
        </h1>
        <p className="mt-1.5 text-sm text-ink-2">
          Escrow your stake now. Whoever takes the other side matches it, and
          the winner is paid automatically.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* form */}
        <Panel className="flex flex-col gap-6 p-6">
          <Field
            label="The bet"
            hint={`${question.length}/140`}
            htmlFor="question"
          >
            <Textarea
              id="question"
              rows={3}
              maxLength={140}
              placeholder="e.g. Arsenal beat Chelsea on Saturday"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <FieldError msg={errors.question} />
          </Field>

          <Field label="Stake per side" htmlFor="stake">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  id="stake"
                  mono
                  inputMode="decimal"
                  placeholder="0.0"
                  value={stakeStr}
                  onChange={(e) => setStakeStr(e.target.value)}
                  className="pr-14"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[0.8125rem] text-ink-3">
                  MON
                </span>
              </div>
              <div className="flex gap-1">
                {STAKE_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setStakeStr(p)}
                    className="h-10 rounded-[var(--radius-sm)] border border-line bg-bg-2 px-2.5 font-mono text-[0.8125rem] text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <FieldError msg={errors.stake} />
          </Field>

          <Field label="Visibility">
            <Segmented<Visibility>
              value={visibility}
              onChange={setVisibility}
              className="w-full"
              options={[
                {
                  value: Visibility.Public,
                  label: "Public",
                  icon: <Globe className="size-3.5" />,
                },
                {
                  value: Visibility.Private,
                  label: "Private",
                  icon: <Lock className="size-3.5" />,
                },
              ]}
            />
            <p className="text-[0.75rem] leading-relaxed text-ink-3">
              {visibility === Visibility.Public
                ? "Listed on the Markets dashboard. Anyone can take the other side."
                : "Unlisted. Share the link with someone, or name their wallet below to lock it to them."}
            </p>
          </Field>

          {visibility === Visibility.Private && (
            <Field
              label="Counterparty"
              hint="optional"
              htmlFor="counterparty"
            >
              <Input
                id="counterparty"
                mono
                placeholder="0x…  (leave blank for a shareable link)"
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
              />
              <FieldError msg={errors.counterparty} />
            </Field>
          )}

          <Field label="Arbiter" hint="optional" htmlFor="arbiter">
            <Input
              id="arbiter"
              mono
              placeholder="0x…  leave blank to use Betr's arbiter"
              value={arbiter}
              onChange={(e) => setArbiter(e.target.value)}
            />
            {errors.arbiter ? (
              <FieldError msg={errors.arbiter} />
            ) : (
              <p className="flex items-center gap-1 text-[0.75rem] text-ink-3">
                <Info className="size-3 shrink-0" />
                {arbiter.trim()
                  ? "Rules only if the bet is disputed."
                  : `Defaults to Betr's arbiter · ${shortAddr(DEFAULT_ARBITER, 4)}`}
              </p>
            )}
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Match deadline" htmlFor="matchBy">
              <Input
                id="matchBy"
                type="datetime-local"
                value={matchBy}
                onChange={(e) => setMatchBy(e.target.value)}
                className="font-mono text-[0.8125rem]"
              />
              <FieldError msg={errors.matchBy} />
            </Field>
            <Field label="Resolve deadline" htmlFor="resolveBy">
              <Input
                id="resolveBy"
                type="datetime-local"
                value={resolveBy}
                onChange={(e) => setResolveBy(e.target.value)}
                className="font-mono text-[0.8125rem]"
              />
              <FieldError msg={errors.resolveBy} />
            </Field>
          </div>
        </Panel>

        {/* terms summary */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Panel className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-2 text-ink">
              <Scale className="size-4 text-brand" />
              <h2 className="text-sm font-semibold">Terms</h2>
            </div>

            <dl className="flex flex-col gap-2.5 text-sm">
              <Row label="You stake">
                {stakeWei !== null ? `${formatMon(stakeWei)} MON` : "–"}
              </Row>
              <Row label="Opponent stakes">
                {stakeWei !== null ? `${formatMon(stakeWei)} MON` : "–"}
              </Row>
              <div className="my-1 h-px bg-line" />
              <Row label="Total pot" strong>
                {stakeWei !== null ? `${formatMon(stakeWei * 2n)} MON` : "–"}
              </Row>
              <Row label="Dispute bond (20%)">
                {bondWei !== null ? `${formatMon(bondWei)} MON` : "–"}
              </Row>
            </dl>

            <p className="rounded-[var(--radius-sm)] border border-line bg-bg-2 p-3 text-[0.75rem] leading-relaxed text-ink-3">
              The bond is only posted if you claim the win, and refunded unless
              the arbiter rules against you. Winning uncontested costs nothing
              extra.
            </p>

            {!isConnected ? (
              <div className="flex flex-col items-stretch gap-2">
                <div className="flex items-center gap-2 text-[0.8125rem] text-ink-3">
                  <Wallet className="size-4" />
                  Connect a wallet to stake.
                </div>
                <WalletButton />
              </div>
            ) : wrongChain ? (
              <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-loss/30 bg-loss/12 p-3 text-[0.8125rem] text-loss">
                <TriangleAlert className="size-4" />
                Switch to Monad Testnet to continue.
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={submit}
                loading={isPending}
                disabled={!ready}
              >
                {stakeWei !== null
                  ? `Create & stake ${formatMon(stakeWei)} MON`
                  : "Create & stake"}
              </Button>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
  strong,
}: {
  label: string;
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-3">{label}</dt>
      <dd
        className={`font-mono tnum ${
          strong ? "text-base font-semibold text-ink" : "text-ink-2"
        }`}
      >
        {children}
      </dd>
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-[0.75rem] text-loss">{msg}</p>;
}
