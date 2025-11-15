
'use client';

import React from 'react';
import '@/config/web3';

export default function Web3Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
