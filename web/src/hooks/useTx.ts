"use client";

import { useConfig, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { toast } from "sonner";
import { useState } from "react";
import { EXPLORER_URL } from "@/lib/chain";

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
  const err = e as { shortMessage?: string; message?: string };
  const raw = err?.shortMessage || err?.message || "Transaction failed";
  if (/user rejected|denied|rejected the request/i.test(raw))
    return "Request rejected";
  // strip verbose viem tails
  return raw.split("\n")[0].slice(0, 140);
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
      const hash = await writeContractAsync(params as never);
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
