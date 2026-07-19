"use client";

import { useAccount, useBalance, useChainId, useSwitchChain } from "wagmi";
import { useModal, useLogout } from "@getpara/react-sdk";
import { useEffect, useRef, useState } from "react";
import {
  Wallet,
  ChevronDown,
  LogOut,
  Copy,
  ExternalLink,
  TriangleAlert,
  Check,
} from "lucide-react";
import { Button } from "./ui";
import { monadTestnet, EXPLORER_URL } from "@/lib/chain";
import { formatMon, shortAddr } from "@/lib/format";
import { cn } from "@/lib/cn";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { openModal } = useModal();
  const { logout } = useLogout();
  const { switchChain } = useSwitchChain();
  const { data: bal } = useBalance({
    address,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!isConnected) {
    return (
      <Button size="sm" onClick={() => openModal()}>
        <Wallet className="size-4" />
        Connect
      </Button>
    );
  }

  if (chainId !== monadTestnet.id) {
    return (
      <Button
        size="sm"
        variant="danger"
        onClick={() => switchChain({ chainId: monadTestnet.id })}
      >
        <TriangleAlert className="size-4" />
        Wrong network
      </Button>
    );
  }

  const copyAddr = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface-2/80 pl-3 pr-2.5 shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset] transition-colors hover:border-line-strong"
      >
        <span className="size-2 rounded-full bg-win" />
        <span className="font-mono text-[0.8125rem] text-ink tnum">
          {formatMon(bal?.value, 3)}{" "}
          <span className="text-ink-3">MON</span>
        </span>
        <span className="h-4 w-px bg-line" />
        <span className="font-mono text-[0.8125rem] text-ink-2">
          {shortAddr(address, 4)}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 text-ink-3 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          className="rise absolute right-0 mt-2 w-60 rounded-[var(--radius-md)] border border-white/[0.08] bg-elevated p-1 shadow-2xl shadow-black/50"
          style={{ zIndex: "var(--z-dropdown)" }}
        >
          <div className="px-2.5 py-2">
            <div className="label mb-1">Connected</div>
            <div className="font-mono text-[0.8125rem] text-ink-2">
              {shortAddr(address, 6)}
            </div>
          </div>
          <div className="my-1 h-px bg-line" />
          <MenuItem onClick={copyAddr}>
            {copied ? (
              <Check className="size-4 text-win" />
            ) : (
              <Copy className="size-4" />
            )}
            {copied ? "Copied" : "Copy address"}
          </MenuItem>
          <MenuItem
            onClick={() =>
              window.open(
                `${EXPLORER_URL}/address/${address}`,
                "_blank",
                "noopener",
              )
            }
          >
            <ExternalLink className="size-4" />
            View on explorer
          </MenuItem>
          <MenuItem
            onClick={() => {
              logout();
              setOpen(false);
            }}
            danger
          >
            <LogOut className="size-4" />
            Disconnect
          </MenuItem>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-[0.8125rem] transition-colors",
        danger
          ? "text-loss hover:bg-loss/12"
          : "text-ink-2 hover:bg-surface-2 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
