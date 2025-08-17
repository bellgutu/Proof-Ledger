import React from 'react';

export function Logo() {
  return (
    <div className="flex items-center gap-2" aria-label="ProfitForge logo">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32ZM13.0621 8.83101C12.0621 8.35101 11 9.06101 11 10.191V21.821C11 22.951 12.0621 23.661 13.0621 23.181L22.9321 17.361C23.9421 16.871 23.9421 15.141 22.9321 14.651L13.0621 8.83101Z"
          fill="url(#logoGradient)"
        />
      </svg>
      <span className="text-xl font-extrabold text-foreground tracking-tight">ProfitForge</span>
    </div>
  );
}
