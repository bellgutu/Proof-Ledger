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
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
          <style>
            {`
              @keyframes rise {
                0% { transform: scaleY(0.2); }
                50% { transform: scaleY(1); }
                100% { transform: scaleY(0.2); }
              }
              .bar1 { animation: rise 2s ease-in-out infinite; transform-origin: bottom; animation-delay: 0s; }
              .bar2 { animation: rise 2s ease-in-out infinite; transform-origin: bottom; animation-delay: 0.2s; }
              .bar3 { animation: rise 2s ease-in-out infinite; transform-origin: bottom; animation-delay: 0.4s; }
              
              @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.9; }
                100% { transform: scale(1); opacity: 1; }
              }
              .forge-icon { animation: pulse 3s ease-in-out infinite; }
            `}
          </style>
        </defs>
        <g className="forge-icon">
          <path
            d="M28 8.7619C28 7.10433 26.6575 5.7619 25 5.7619H7C5.34246 5.7619 4 7.10433 4 8.7619V23.2381C4 24.8957 5.34246 26.2381 7 26.2381H25C26.6575 26.2381 28 24.8957 28 23.2381V8.7619Z"
            fill="url(#logoGradient)"
            stroke="hsl(var(--foreground))"
            strokeWidth="1.5"
            strokeOpacity="0.3"
          />
          <rect className="bar1" x="9" y="15" width="4" height="6" fill="hsl(var(--primary-foreground))" rx="1" style={{transform: 'scaleY(0.6)'}} />
          <rect className="bar2" x="14" y="12" width="4" height="9" fill="hsl(var(--primary-foreground))" rx="1" style={{transform: 'scaleY(0.8)'}} />
          <rect className="bar3" x="19" y="9" width="4" height="12" fill="hsl(var(--primary-foreground))" rx="1" style={{transform: 'scaleY(1)'}} />
        </g>
      </svg>
      <span className="text-xl font-extrabold text-foreground tracking-tight">ProfitForge</span>
    </div>
  );
}
