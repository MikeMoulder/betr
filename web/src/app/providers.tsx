"use client";

import "@getpara/react-sdk/styles.css";
import { Environment, ParaProvider } from "@getpara/react-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { http } from "wagmi";
import { monadTestnet } from "@/lib/chain";

const PARA_API_KEY = process.env.NEXT_PUBLIC_PARA_API_KEY ?? "";
const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 5_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ParaProvider
        paraClientConfig={{ apiKey: PARA_API_KEY, env: Environment.BETA }}
        config={{ appName: "Betr" }}
        paraModalConfig={{
          oAuthMethods: ["GOOGLE", "APPLE", "DISCORD", "TWITTER", "FARCASTER"],
          disablePhoneLogin: false,
          recoverySecretStepEnabled: true,
        }}
        externalWalletConfig={{
          walletConnect: { projectId: WALLETCONNECT_PROJECT_ID },
          evmConnector: {
            config: {
              chains: [monadTestnet],
              transports: {
                [monadTestnet.id]: http("https://testnet-rpc.monad.xyz"),
              },
            },
          },
          wallets: ["METAMASK", "COINBASE"],
        }}
      >
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          gap={10}
          toastOptions={{
            style: {
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-line)",
              color: "var(--color-ink)",
              fontFamily: "var(--font-sans)",
              borderRadius: "8px",
            },
          }}
        />
      </ParaProvider>
    </QueryClientProvider>
  );
}
