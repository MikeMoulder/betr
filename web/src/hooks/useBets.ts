"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { BETR_ADDRESS, betrAbi, type Bet } from "@/lib/contract";

export type IndexedBet = { id: number; bet: Bet };

export function useBetCount() {
  return useReadContract({
    address: BETR_ADDRESS,
    abi: betrAbi,
    functionName: "betCount",
    query: { refetchInterval: 8_000 },
  });
}

/** Reads betCount, then batch-fetches every bet. Newest first. */
export function useAllBets() {
  const {
    data: count,
    isLoading: countLoading,
    refetch: refetchCount,
  } = useBetCount();

  const n = count ? Number(count) : 0;

  const contracts = Array.from({ length: n }, (_, i) => ({
    address: BETR_ADDRESS,
    abi: betrAbi,
    functionName: "getBet" as const,
    args: [BigInt(i)] as const,
  }));

  const {
    data,
    isLoading,
    refetch,
  } = useReadContracts({
    contracts,
    query: { enabled: n > 0, refetchInterval: 8_000 },
  });

  const bets: IndexedBet[] = (data ?? [])
    .map((r, i) =>
      r.status === "success" ? { id: i, bet: r.result as unknown as Bet } : null,
    )
    .filter((x): x is IndexedBet => x !== null)
    .reverse();

  return {
    bets,
    count: n,
    isLoading: countLoading || (n > 0 && isLoading && !data),
    refetch: async () => {
      await refetchCount();
      await refetch();
    },
  };
}

export function useBet(id?: number) {
  return useReadContract({
    address: BETR_ADDRESS,
    abi: betrAbi,
    functionName: "getBet",
    args: id !== undefined ? [BigInt(id)] : undefined,
    query: { enabled: id !== undefined, refetchInterval: 5_000 },
  });
}

export function usePending(address?: string) {
  return useReadContract({
    address: BETR_ADDRESS,
    abi: betrAbi,
    functionName: "pending",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address, refetchInterval: 8_000 },
  });
}
