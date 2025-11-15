
'use client';

import { Web3ModalProvider } from '@/config/web3';
import React from 'react';

export default function Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Web3ModalProvider>
        {children}
    </Web3ModalProvider>
  );
}
