// TradingViewWidget.tsx
"use client";

import React, { useEffect, useRef, memo } from 'react';

interface TradingViewWidgetProps {
  symbol: string;
}

function TradingViewWidget({ symbol = "BINANCE:ETHUSDT" }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const isClient = typeof window !== 'undefined';

  useEffect(() => {
    if (!container.current || !isClient) return;

    // Clear the container before appending the new script
    container.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "allow_symbol_change": true,
        "calendar": false,
        "details": false,
        "hide_side_toolbar": true,
        "hide_top_toolbar": false,
        "hide_legend": false,
        "hide_volume": false,
        "hotlist": false,
        "interval": "D",
        "locale": "en",
        "save_image": true,
        "style": "1",
        "symbol": "${symbol}",
        "theme": "dark",
        "timezone": "Etc/UTC",
        "backgroundColor": "#18181b",
        "gridColor": "rgba(242, 242, 242, 0.06)",
        "watchlist": [],
        "withdateranges": false,
        "compareSymbols": [],
        "studies": [],
        "autosize": true
      }`;
      
    container.current.appendChild(script);

    // No cleanup needed since we are not adding event listeners
    return () => {
        if (container.current) {
            container.current.innerHTML = "";
        }
    };

  }, [symbol, isClient]);

  return (
    <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }}>
      <div className="tradingview-widget-container__widget" style={{ height: "calc(100%)", width: "100%" }}></div>
    </div>
  );
}

export default memo(TradingViewWidget);
