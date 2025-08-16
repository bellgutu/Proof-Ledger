

"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { Position } from '@/services/blockchain-service';

// Define the Candle data structure
export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  time: number;
}

type PriceScenario = 'uptrend' | 'downtrend' | 'normal';

// We pass the whole position object to get all necessary details
interface PositionWithUI extends Position {
  pair: string;
  leverage: number;
}

// Props for the TradingChart component
interface TradingChartProps {
  initialPrice: number;
  onPriceChange: (price: number) => void;
  onCandleDataUpdate: (candles: Candle[]) => void;
  priceScenario: PriceScenario | null;
  position: PositionWithUI | null;
}

export function TradingChart({ initialPrice, onPriceChange, onCandleDataUpdate, priceScenario, position }: TradingChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const candleDataRef = useRef<Candle[]>([]);
  const currentPriceRef = useRef(initialPrice);
  const animationFrameIdRef = useRef<number>();

  const getThemeColors = useCallback(() => {
    if (typeof window === 'undefined') {
        return {
            background: '#0f172a', text: '#94a3b8', grid: '#334155',
            upCandle: '#22c55e', downCandle: '#ef4444', priceLine: '#3b82f6',
            priceLabelBackground: '#3b82f6', priceLabelText: '#ffffff',
            entryLine: '#a855f7', slLine: '#f59e0b', tpLine: '#14b8a6',
            positionText: '#ffffff'
        };
    }
    const styles = getComputedStyle(document.documentElement);
    return {
        background: `hsl(${styles.getPropertyValue('--card').trim()})`,
        text: `hsl(${styles.getPropertyValue('--muted-foreground').trim()})`,
        grid: `hsl(${styles.getPropertyValue('--border').trim()})`,
        upCandle: '#22c55e',
        downCandle: '#ef4444',
        priceLine: `hsl(${styles.getPropertyValue('--primary').trim()})`,
        priceLabelBackground: `hsl(${styles.getPropertyValue('--primary').trim()})`,
        priceLabelText: `hsl(${styles.getPropertyValue('--primary-foreground').trim()})`,
        entryLine: '#a855f7', // Purple
        slLine: '#f59e0b',    // Amber
        tpLine: '#14b8a6',    // Teal
        positionText: '#ffffff'
    };
  }, []);

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const theme = getThemeColors();

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    const yAxisWidth = 60;
    const xAxisHeight = 30;
    const chartWidth = width - yAxisWidth;
    const chartHeight = height - xAxisHeight;

    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, width, height);

    const candles = candleDataRef.current;
    if (candles.length === 0) return;

    const visibleCandles = candles.slice(-80);
    if (visibleCandles.length === 0) return;

    const buffer = 0.05; 
    let maxPrice = Math.max(...visibleCandles.map(c => c.high));
    let minPrice = Math.min(...visibleCandles.map(c => c.low));

    // Include position lines in price range calculation
    if (position) {
        maxPrice = Math.max(maxPrice, position.entryPrice, position.takeProfit || -Infinity);
        minPrice = Math.min(minPrice, position.entryPrice, position.stopLoss || Infinity);
    }

    const priceRange = maxPrice - minPrice;
    const paddedMax = maxPrice + priceRange * buffer;
    const paddedMin = minPrice - priceRange * buffer;
    const paddedPriceRange = paddedMax - paddedMin > 0 ? paddedMax - paddedMin : 1;

    const scaleY = (price: number) => {
      return chartHeight - ((price - paddedMin) / paddedPriceRange) * chartHeight;
    };

    const candleWidth = chartWidth / (visibleCandles.length * 1.8);
    const spacing = candleWidth * 0.8;

    ctx.strokeStyle = theme.grid;
    ctx.fillStyle = theme.text;
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'left';
    const numPriceLevels = Math.max(2, Math.floor(chartHeight / 50));
    for (let i = 0; i <= numPriceLevels; i++) {
        const price = paddedMin + (paddedPriceRange / numPriceLevels) * i;
        const y = scaleY(price);
        if (y > 0 && y < chartHeight) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(chartWidth, y);
            ctx.stroke();
            ctx.fillText(price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}), chartWidth + 5, y + 4);
        }
    }

    ctx.textAlign = 'center';
    const numTimeLabels = Math.floor(chartWidth / 100);
    const timeInterval = Math.max(1, Math.floor(visibleCandles.length / numTimeLabels));
    for (let i = 0; i < visibleCandles.length; i++) {
        if (i % timeInterval === 0) {
            const candle = visibleCandles[i];
            const x = i * (candleWidth + spacing) + spacing + candleWidth / 2;
            if (x < chartWidth) {
                const time = new Date(candle.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                ctx.fillText(time, x, chartHeight + 20);
            }
        }
    }

    visibleCandles.forEach((candle, index) => {
      const x = index * (candleWidth + spacing) + spacing;
      const color = candle.close >= candle.open ? theme.upCandle : theme.downCandle;

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

    const drawPositionLine = (price: number, color: string, text: string, dash: number[] = []) => {
        const y = scaleY(price);
        if (y > 0 && y < chartHeight) {
            ctx.setLineDash(dash);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(chartWidth, y);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = color;
            ctx.fillRect(chartWidth, y - 10, yAxisWidth, 20);
            ctx.fillStyle = theme.positionText;
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(text, chartWidth + yAxisWidth / 2, y + 3);
        }
    };

    if (position && position.active) {
        drawPositionLine(position.entryPrice, theme.entryLine, 'Entry');
        if (position.stopLoss) drawPositionLine(position.stopLoss, theme.slLine, 'SL', [5, 5]);
        if (position.takeProfit) drawPositionLine(position.takeProfit, theme.tpLine, 'TP', [5, 5]);
    }

    const currentPrice = currentPriceRef.current;
    const priceY = scaleY(currentPrice);

    if (priceY >= 0 && priceY <= chartHeight) {
      ctx.strokeStyle = theme.priceLine;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.moveTo(0, priceY);
      ctx.lineTo(chartWidth, priceY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = theme.priceLabelBackground;
      ctx.fillRect(chartWidth, priceY - 12, yAxisWidth, 24);
      ctx.fillStyle = theme.priceLabelText;
      ctx.textAlign = 'center';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(currentPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}), chartWidth + yAxisWidth / 2, priceY + 4);
    }
  }, [getThemeColors, position]);

  // Effect for generating candle data and simulating price
  useEffect(() => {
    const candleInterval = 2000;
    const volatility = 0.00005; // Reduced volatility for more stable simulation

    const generateNewCandle = () => {
      const lastCandle = candleDataRef.current.length > 0
        ? candleDataRef.current[candleDataRef.current.length - 1]
        : { close: initialPrice, time: Date.now() - candleInterval };
      
      const open = lastCandle.close;
      let change;

      // --- Scenario Logic ---
      switch (priceScenario) {
        case 'uptrend':
          // Mostly positive changes with some small dips
          change = (Math.random() - 0.45) * (open * volatility * 10); 
          break;
        case 'downtrend':
          // Mostly negative changes with some small rallies
          change = (Math.random() - 0.55) * (open * volatility * 10);
          break;
        default: // 'normal' or null
          change = (Math.random() - 0.5) * (open * volatility * 10);
          break;
      }
      // --- End Scenario Logic ---

      const close = open + change;
      const high = Math.max(open, close) + Math.random() * (open * volatility * 2);
      const low = Math.min(open, close) - Math.random() * (open * volatility * 2);
      const time = lastCandle.time + candleInterval;

      const newCandle = { open, high, low, close, time };
      candleDataRef.current.push(newCandle);
      if (candleDataRef.current.length > 200) {
        candleDataRef.current.shift();
      }
      currentPriceRef.current = close;
      onPriceChange(close);
      onCandleDataUpdate([...candleDataRef.current]);
    };
    
    // Generate initial set of candles if empty
    if (candleDataRef.current.length === 0) {
        let startTime = Date.now() - 100 * candleInterval;
        let price = initialPrice;
        for (let i = 0; i < 100; i++) {
            const open = price;
            const change = (Math.random() - 0.5) * (open * volatility * 10);
            const close = open + change;
            const high = Math.max(open, close) + Math.random() * (open * volatility);
            const low = Math.min(open, close) - Math.random() * (open * volatility);
            const time = startTime + i * candleInterval;
            candleDataRef.current.push({ open, high, low, close, time });
            price = close;
        }
        
        currentPriceRef.current = price;
        onPriceChange(price);
        onCandleDataUpdate([...candleDataRef.current]);
    }


    const candleTimer = setInterval(generateNewCandle, candleInterval);

    return () => clearInterval(candleTimer);
  }, [initialPrice, onPriceChange, onCandleDataUpdate, priceScenario]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
      drawChart();
    });
    observer.observe(canvas);

    const renderLoop = () => {
      drawChart();
      animationFrameIdRef.current = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    return () => {
      observer.disconnect();
      if(animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [drawChart]);

  return <canvas ref={canvasRef} className="w-full h-full"></canvas>;
}
