import { BETR_ADDRESS } from "@/lib/contract";
import { EXPLORER_URL } from "@/lib/chain";
import { shortAddr } from "@/lib/format";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1160px] flex-col gap-3 px-5 py-6 text-[0.75rem] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Betr — informal bets, settled onchain. Optimistic resolution with a
          named arbiter.
        </p>
        <div className="flex items-center gap-4 font-mono">
          <span>Monad Testnet</span>
          <a
            href={`${EXPLORER_URL}/address/${BETR_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-ink-2"
          >
            {shortAddr(BETR_ADDRESS, 4)}
          </a>
        </div>
      </div>
    </footer>
  );
}
