
"use client";

import MarketsPage from '@/components/pages/markets';
import { FirebaseAuthHandler } from '@/components/firebase-auth-handler';
import { useWallet } from '@/contexts/wallet-context';
import { useEffect } from 'react';

export default function Page() {
  const { walletState, walletActions } = useWallet();

  useEffect(() => {
    if (!walletState.isConnected && window.ethereum) {
      walletActions.connectWallet();
    }
  }, []);

  return (
    <>
      <FirebaseAuthHandler />
      <MarketsPage />
    </>
  );
}
