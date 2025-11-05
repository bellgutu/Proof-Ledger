
import React from 'react';

export function Logo() {
  return (
    <div className="flex items-center gap-3" aria-label="Enterprise Verification Platform logo">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
        <path
            d="M16 2L2 8.5V23.5L16 30L30 23.5V8.5L16 2Z"
            stroke="url(#logoGradient)"
            strokeWidth="2"
            fill="none"
        />
        <path
            d="M16 12V30M16 12L2 8.5M16 12L30 8.5M2 8.5L9 12M30 8.5L23 12M9 12L9 21.5M23 12L23 21.5M9 21.5L16 25L23 21.5"
            stroke="hsl(var(--primary))"
            strokeOpacity="0.6"
            strokeWidth="1.5"
        />
        <path
            d="M16 7L20.5 9.5L16 12L11.5 9.5L16 7Z"
            fill="hsl(var(--primary-foreground))"
            stroke="hsl(var(--primary))"
        />
      </svg>
      <span className="text-xl font-extrabold tracking-tight">
        EnterpriseVerifi
      </span>
    </div>
  );
}
