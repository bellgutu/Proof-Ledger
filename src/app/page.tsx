
"use client";

import MarketsPage from '@/components/pages/markets';
import { FirebaseAuthHandler } from '@/components/firebase-auth-handler';

export default function Page() {
  return (
    <>
      <FirebaseAuthHandler />
      <MarketsPage />
    </>
  );
}
