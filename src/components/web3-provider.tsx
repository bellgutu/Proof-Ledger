
"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  // Since we are simulating the wallet connection, we no longer need Wagmi or AppKit providers.
  // We'll keep QueryClientProvider as it might be useful for other data fetching.
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
