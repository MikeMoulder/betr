import { BETR_ADDRESS } from "@/lib/contract";
import { EXPLORER_URL } from "@/lib/chain";
import { shortAddr } from "@/lib/format";

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-line/70">
      <div className="mx-auto flex max-w-[1160px] flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-sm font-semibold lowercase tracking-tight text-ink-2">
            betr
          </span>
          <span className="size-1 rounded-full bg-brand/70" />
          <span className="text-[0.75rem] text-ink-3">
            informal bets, settled onchain.
          </span>
        </div>
        <div className="flex items-center gap-4 font-mono text-[0.75rem] text-ink-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-win live-dot" />
            Monad Testnet
          </span>
          <a
            href={`${EXPLORER_URL}/address/${BETR_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-line px-2.5 py-1 transition-colors hover:border-line-strong hover:text-ink-2"
          >
            {shortAddr(BETR_ADDRESS, 4)}
          </a>
        </div>
      </div>
    </footer>
  );
}
