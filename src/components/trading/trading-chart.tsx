
"use client";

import { useRef, useEffect, useCallback } from 'react';

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  time: number;
}

interface TradingChartProps {
  initialPrice: number;
  onPriceChange: (price: number) => void;
  onCandleDataUpdate: (candles: Candle[]) => void;
}

export function TradingChart({ initialPrice, onPriceChange, onCandleDataUpdate }: TradingChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const candleDataRef = useRef<Candle[]>([]);
  const currentPriceRef = useRef(initialPrice);
  const animationFrameIdRef = useRef<number>();
  const lastUpdateRef = useRef(Date.now());
  const lastCandleUpdateRef = useRef(Date.now());
  const lastPriceUpdateRef = useRef(Date.now());


  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    
    const cardColor = getComputedStyle(document.documentElement).getPropertyValue('--card').trim();
    ctx.fillStyle = `hsl(${cardColor})`;
    ctx.fillRect(0, 0, width, height);
      
    const candles = candleDataRef.current;
    if (candles.length === 0) return;

    const Y_AXIS_WIDTH = 60;
    const X_AXIS_HEIGHT = 30;
    const chartWidth = width - Y_AXIS_WIDTH;
    const chartHeight = height - X_AXIS_HEIGHT;
    
    const visibleCandles = candles.slice(-80);
    const maxPrice = Math.max(...visibleCandles.map(c => c.high));
    const minPrice = Math.min(...visibleCandles.map(c => c.low));
    const priceRange = maxPrice - minPrice;

    const scaleY = (price: number) => {
        const paddedRange = priceRange * 1.1; // 10% padding
        const paddedMin = minPrice - (priceRange * 0.05);
        return chartHeight - ((price - paddedMin) / paddedRange) * chartHeight;
    };
    
    const scaleX = (index: number) => {
        return index * (chartWidth / (visibleCandles.length - 1));
    }

    const textColor = `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--muted-foreground').trim()})`;
    const borderColor = `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--border').trim()})`;

    ctx.font = '12px Inter';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    const numPriceLabels = 5;
    for (let i = 0; i <= numPriceLabels; i++) {
        const price = maxPrice - (priceRange / numPriceLabels) * i;
        const y = scaleY(price);
        ctx.fillText(price.toFixed(2), chartWidth + 5, y + 4);
        
        ctx.beginPath();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 0.5;
        ctx.moveTo(0, y);
        ctx.lineTo(chartWidth, y);
        ctx.stroke();
    }
    
    ctx.textAlign = 'center';
    const numTimeLabels = Math.floor(chartWidth / 100);
    const timeInterval = Math.max(1, Math.floor(visibleCandles.length / numTimeLabels));
    for (let i = 0; i < visibleCandles.length; i++) {
        if (i % timeInterval === 0) {
            const candle = visibleCandles[i];
            const date = new Date(candle.time);
            const timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            ctx.fillText(timeString, scaleX(i), chartHeight + 20);
        }
    }

    const candleWidth = (chartWidth / visibleCandles.length) * 0.6;

    visibleCandles.forEach((candle, index) => {
      const x = scaleX(index) - candleWidth / 2;
      const color = candle.close >= candle.open ? '#22c55e' : '#ef4444';

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.moveTo(x + candleWidth / 2, scaleY(candle.high));
      ctx.lineTo(x + candleWidth / 2, scaleY(candle.low));
      ctx.stroke();

      const bodyY = scaleY(Math.max(candle.open, candle.close));
      const bodyHeight = Math.abs(scaleY(candle.open) - scaleY(candle.close)) || 1;
      ctx.fillStyle = color;
      ctx.fillRect(x, bodyY, candleWidth, bodyHeight);
    });
    
    const currentPrice = currentPriceRef.current;
    const priceY = scaleY(currentPrice);

    if (priceY >= 0 && priceY <= chartHeight) {
      const primaryColorHsl = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
      const primaryColor = `hsl(${primaryColorHsl})`;
      
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, priceY);
      ctx.lineTo(chartWidth, priceY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = primaryColor;
      ctx.fillRect(chartWidth, priceY - 10, Y_AXIS_WIDTH, 20);
      const primaryFgColor = `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--primary-foreground').trim()})`;
      ctx.fillStyle = primaryFgColor;
      ctx.font = 'bold 12px Inter';
      ctx.textAlign = 'center';
      const currentPriceDecimalPlaces = currentPrice < 0.1 ? 4 : (currentPrice < 10 ? 2 : 0);
      ctx.fillText(`${currentPrice.toFixed(currentPriceDecimalPlaces)}`, chartWidth + Y_AXIS_WIDTH / 2, priceY + 4);
    }
  }, []);

  useEffect(() => {
    const generateInitialCandles = () => {
        candleDataRef.current = [];
        let startTime = Date.now() - 100 * 10000;
        let price = initialPrice;
        for(let i = 0; i < 100; i++){
            const open = price;
            const change = (Math.random() - 0.49) * open * 0.005; // Reduced volatility
            const close = open + change;
            const high = Math.max(open, close) + Math.random() * open * 0.0025;
            const low = Math.min(open, close) - Math.random() * open * 0.0025;
            const time = startTime + i * 10000;
            candleDataRef.current.push({ open, high, low, close, time });
            price = close;
        }
        currentPriceRef.current = price;
        onPriceChange(price);
        onCandleDataUpdate([...candleDataRef.current]);
    };
    
    generateInitialCandles();
    lastUpdateRef.current = Date.now();
    lastCandleUpdateRef.current = Date.now();
    lastPriceUpdateRef.current = Date.now();


    const updateSimulation = () => {
        const now = Date.now();
        lastUpdateRef.current = now;

        // Update price only every 1.5 seconds
        if (now - lastPriceUpdateRef.current > 1500) {
            lastPriceUpdateRef.current = now;

            const lastPrice = currentPriceRef.current;
            const volatility = 0.0001; // Reduced volatility
            const trend = 0.000005; 
            const priceChange = (Math.random() - 0.5 + trend) * lastPrice * volatility;
            const newPrice = Math.max(0, lastPrice + priceChange);

            currentPriceRef.current = newPrice;
            onPriceChange(newPrice);
            
            const currentCandle = candleDataRef.current[candleDataRef.current.length - 1];
            if (currentCandle) {
              currentCandle.close = newPrice;
              currentCandle.high = Math.max(currentCandle.high, newPrice);
              currentCandle.low = Math.min(currentCandle.low, newPrice);
            }
        }
        
        // Generate new candle every 10 seconds
        if (now - lastCandleUpdateRef.current > 10000) {
            lastCandleUpdateRef.current = now;
            const currentCandle = candleDataRef.current[candleDataRef.current.length - 1];
            const open = currentCandle.close;
            const time = now;
            const newCandle = { open, high: open, low: open, close: open, time };
            candleDataRef.current.push(newCandle);

            if (candleDataRef.current.length > 200) {
                candleDataRef.current.shift();
            }
            onCandleDataUpdate([...candleDataRef.current]);
        }
        
        drawChart();
        animationFrameIdRef.current = requestAnimationFrame(updateSimulation);
    };

    animationFrameIdRef.current = requestAnimationFrame(updateSimulation);

    return () => {
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
        }
    };
  }, [initialPrice, onCandleDataUpdate, onPriceChange, drawChart]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
        drawChart();
    });
    observer.observe(canvas);
    
    return () => {
        observer.disconnect();
    }
  }, [drawChart]);

  return <canvas ref={canvasRef} className="w-full h-full"></canvas>;
}
