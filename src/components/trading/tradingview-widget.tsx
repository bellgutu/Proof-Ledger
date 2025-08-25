// TradingViewWidget.tsx
"use client";

import React, { useEffect, useRef, memo } from 'react';

interface TradingViewWidgetProps {
  symbol: string;
  onPriceUpdate?: (price: number) => void;
}

function TradingViewWidget({ symbol = "BINANCE:ETHUSDT", onPriceUpdate }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const isClient = typeof window !== 'undefined';

  useEffect(() => {
    if (!container.current || !isClient) return;

    // Clear the container before appending the new script
    container.current.innerHTML = "";

    // Set up a listener for messages from the widget's iframe
    const handleMessage = (event: MessageEvent) => {
      // It's good practice to check the origin for security
      if (event.origin !== "https://s.tradingview.com") return;

      if (event.data && event.data.name === 'tv-price-update') {
        const price = event.data.price;
        if (onPriceUpdate && typeof price === 'number') {
          onPriceUpdate(price);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);

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
        "studies": [
          {
            "id": "price-update-emitter@tv-scripting-101",
            "version": "1.0.0"
          }
        ],
        "autosize": true
      }`;
      
    // A script to define our price emitter study
    const studyScript = document.createElement("script");
    studyScript.type = "text/javascript";
    studyScript.innerHTML = `
      (function(root) {
        if (typeof root.TradingView === 'undefined') return;
        var PineJS = root.PineJS;

        class PriceUpdateEmitter {
          constructor() {
            this.lastPrice = null;
          }

          init(context, input) {
            this.context = context;
            this.pine = input;
          }

          main(context, input) {
            this.context = context;
            this.pine = input;
            const price = this.pine.security(this.pine.symbol, this.pine.resolution, this.pine.close);
            if (price !== this.lastPrice) {
              this.lastPrice = price;
              window.parent.postMessage({ name: 'tv-price-update', price: price }, '*');
            }
          }
        }

        PineJS.Std.Indicator(PriceUpdateEmitter, "price-update-emitter@tv-scripting-101", "Price Emitter", true);
      })(window);
    `;

    container.current.appendChild(studyScript);
    container.current.appendChild(script);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };

  }, [symbol, onPriceUpdate, isClient]);

  return (
    <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }}>
      <div className="tradingview-widget-container__widget" style={{ height: "calc(100%)", width: "100%" }}></div>
    </div>
  );
}

export default memo(TradingViewWidget);
