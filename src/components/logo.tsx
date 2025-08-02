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
          <linearGradient id="flameGradient" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--accent))" />
            <stop offset="100%" stopColor="hsl(var(--primary))" />
          </linearGradient>
        </defs>
        {/* Anvil/Forge Base */}
        <path
          d="M4 22C4 21.4477 4.44772 21 5 21H27C27.5523 21 28 21.4477 28 22V24C28 25.1046 27.1046 26 26 26H6C4.89543 26 4 25.1046 4 24V22Z"
          fill="currentColor"
        />
        <path
          d="M8 17C8 16.4477 8.44772 16 9 16H23C23.5523 16 24 16.4477 24 17V21H8V17Z"
          fill="currentColor"
          className="text-primary/70"
        />
        {/* Flame */}
        <path
          d="M16 4C10 9 13 14 13 16H19C19 14 22 9 16 4Z"
          fill="url(#flameGradient)"
          transform="translate(0, -2)"
        />
         <path
          d="M12 9C9 12 11 15 11 16H13C13 15 14 12 12 9Z"
          fill="url(#flameGradient)"
          opacity="0.7"
           transform="translate(0, -2)"
        />
         <path
          d="M20 9C23 12 21 15 21 16H19C19 15 18 12 20 9Z"
          fill="url(#flameGradient)"
          opacity="0.7"
           transform="translate(0, -2)"
        />
      </svg>
      <span className="text-xl font-extrabold text-foreground">ProfitForge</span>
    </div>
  );
}
