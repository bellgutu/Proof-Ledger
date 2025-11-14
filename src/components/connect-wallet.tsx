
"use client";

import React from 'react';
import type { ButtonProps } from '@/components/ui/button';

export function ConnectWallet({ variant = "default", className }: { variant?: ButtonProps["variant"], className?: string }) {
  // The appkit-button is a web component registered globally by AppKit.
  // It automatically handles wallet connection, disconnection, and network switching.
  // The 'variant' and 'className' props are kept for potential future custom styling if we eject from the web component.
  return <appkit-button />;
}
