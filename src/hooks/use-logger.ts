
"use client";

import { useCallback } from 'react';

type EventName = 'page_view' | 'generate_strategy' | 'connect_wallet' | 'trade_attempt' | 'open_position' | 'close_position';

export function useLogger() {

  const logEvent = useCallback((eventName: EventName, details: Record<string, any> = {}) => {
    
    const payload = {
      event: eventName,
      timestamp: new Date().toISOString(),
      details,
    };

    // Use sendBeacon for robustness, as it works even if the page is unloading.
    // Fallback to fetch for older browsers.
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('/api/log', blob);
    } else {
      fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true, // Important for requests during page unload
      }).catch(error => {
        // We generally don't want to bother the user with logging errors.
        console.error('Logger fetch failed:', error);
      });
    }
  }, []);

  return { logEvent };
}
