"use client";

import { useConfig, useWriteContract } from "wagmi";
import { getChainId, switchChain, waitForTransactionReceipt } from "wagmi/actions";
import { BaseError, ContractFunctionRevertedError } from "viem";
import { toast } from "sonner";
import { useState } from "react";
import { EXPLORER_URL, monadTestnet } from "@/lib/chain";

/** Loose shape — wagmi's per-function union typing is cast at the call site. */
type WriteArgs = {
  address: `0x${string}`;
  abi: readonly unknown[];
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
};

type Labels = { pending: string; success: string };

function prettyError(e: unknown): string {
  // Pull the decoded require()/revert string straight out of viem's error tree.
  if (e instanceof BaseError) {
    const revert = e.walk((err) => err instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const reason = revert.reason ?? revert.shortMessage;
      if (reason) return reason.slice(0, 140);
    }
  }

  const err = e as { shortMessage?: string; message?: string };
  const raw = err?.shortMessage || err?.message || "Transaction failed";
  if (/user rejected|denied|rejected the request/i.test(raw))
    return "Request rejected";

  // viem prints "...reverted with the following reason:" then the reason on the
  // next line — keep the reason, not just the header.
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const headerIdx = lines.findIndex((l) =>
    /reverted with the following reason:$/i.test(l),
  );
  const msg =
    headerIdx >= 0 && lines[headerIdx + 1]
      ? lines[headerIdx + 1]
      : lines[0] ?? raw;
  return msg.slice(0, 140);
}

export function useTx() {
  const { writeContractAsync } = useWriteContract();
  const config = useConfig();
  const [isPending, setPending] = useState(false);

  async function run(
    params: WriteArgs,
    labels: Labels,
    onDone?: () => void | Promise<void>,
  ) {
    const id = toast.loading(labels.pending);
    setPending(true);
    try {
      // Para's embedded (social-login) wallet signs silently and can be left on
      // whatever chain it last stored — often eth mainnet, where Betr doesn't
      // exist. Pin it to Monad before signing; the write also asserts `chainId`
      // so a stale connector chain surfaces as an error instead of a silent
      // mainnet broadcast. No-op (no prompt) when already on Monad.
      if (getChainId(config) !== monadTestnet.id) {
        await switchChain(config, { chainId: monadTestnet.id });
      }
      const hash = await writeContractAsync({
        ...params,
        chainId: monadTestnet.id,
      } as never);
      toast.loading("Confirming on Monad…", { id });
      const receipt = await waitForTransactionReceipt(config, { hash });
      if (receipt.status === "success") {
        toast.success(labels.success, {
          id,
          action: {
            label: "View",
            onClick: () =>
              window.open(`${EXPLORER_URL}/tx/${hash}`, "_blank", "noopener"),
          },
        });
        await onDone?.();
      } else {
        toast.error("Transaction reverted", { id });
      }
    } catch (e) {
      toast.error(prettyError(e), { id });
    } finally {
      setPending(false);
    }
  }

  return { run, isPending };
}
