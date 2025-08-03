
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
    
    // Define constants for layout
    const Y_AXIS_WIDTH = 60;
    const X_AXIS_HEIGHT = 30;
    const PRICE_BUFFER = 0.05; // 5% buffer for better scaling

    const yAxisWidth = 60;
    const xAxisHeight = 30;
    const chartWidth = width - yAxisWidth;
    const chartHeight = height - xAxisHeight;

    // Clear canvas with a light background color
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
    ctx.fillRect(0, 0, width, height);
      
    const candles = candleDataRef.current;
    if (candles.length === 0) return;

    const visibleCandles = candles.slice(-50);
    const maxPrice = Math.max(...visibleCandles.map(c => c.high));
    const minPrice = Math.min(...visibleCandles.map(c => c.low));
    const priceRange = maxPrice - minPrice;

    const scaleY = (price: number) => {
        return chartHeight - ((price - minPrice) / priceRange) * chartHeight;
    };

    const candleWidth = chartWidth / (visibleCandles.length * 1.5);
    const spacing = candleWidth * 0.5;

    // Draw Y-axis (Price) and grid lines
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border').trim();
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--muted-foreground').trim();
    ctx.font = '12px Inter';
    ctx.textAlign = 'left';
    const numPriceLevels = 6;
    for (let i = 0; i <= numPriceLevels; i++) {
        const price = minPrice + (priceRange / numPriceLevels) * i;
        const y = scaleY(price);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(chartWidth, y);
        ctx.stroke();
        
        // Dynamic decimal places for price labels
        const priceDecimalPlaces = priceRange < 0.1 ? 4 : (priceRange < 10 ? 2 : 0);
        ctx.fillText(`$${price.toFixed(priceDecimalPlaces)}`, chartWidth + 5, y + 4);
    }

    // Draw X-axis (Time)
    ctx.textAlign = 'center';
    const numTimeLabels = Math.floor(chartWidth / 100);
    const timeInterval = Math.max(1, Math.floor(visibleCandles.length / numTimeLabels));
    for (let i = 0; i < visibleCandles.length; i++) {
        if (i % timeInterval === 0) {
            const candle = visibleCandles[i];
            const x = i * (candleWidth + spacing) + spacing + candleWidth / 2;
            if(x < chartWidth) {
                // Dynamic time label formatting
                const firstTime = visibleCandles[0].time;
                const lastTime = visibleCandles[visibleCandles.length - 1].time;
                const timeRange = lastTime - firstTime;
                const timeFormatOptions: Intl.DateTimeFormatOptions = timeRange > 24 * 60 * 60 * 1000 ? { month: 'short', day: 'numeric' } : { hour: '2-digit', minute: '2-digit' };
                const time = new Date(candle.time).toLocaleTimeString([], timeFormatOptions);
                 ctx.fillText(time, x, chartHeight + 20);
            }
        }
    }

    // Draw candles
    visibleCandles.forEach((candle, index) => {
      const x = index * (candleWidth + spacing) + spacing;
      const color = candle.close >= candle.open 
        ? '#22c55e' // Hardcoded green for better visibility
        : '#ef4444'; // Hardcoded red for better visibility

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
    
    // Draw current price line
    const currentPrice = currentPriceRef.current;
    const priceY = scaleY(currentPrice);

    if (priceY >= 0 && priceY <= chartHeight) {
      const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
      ctx.strokeStyle = `hsl(${primaryColor})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, priceY);
      ctx.lineTo(chartWidth, priceY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = `hsl(${primaryColor})`;
      ctx.fillRect(chartWidth, priceY - 10, yAxisWidth, 20);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-foreground').trim();
      ctx.textAlign = 'center';
      // Dynamic decimal places for current price label
      const currentPriceDecimalPlaces = currentPrice < 0.1 ? 4 : (currentPrice < 10 ? 2 : 0);
      ctx.fillText(`$${currentPrice.toFixed(currentPriceDecimalPlaces)}`, chartWidth + yAxisWidth / 2, priceY + 4);
    }
  }, []);

  useEffect(() => {
    let candleTimer: NodeJS.Timeout;
    
    const generateNewCandle = () => {
      const lastCandle = candleDataRef.current.length > 0
        ? candleDataRef.current[candleDataRef.current.length - 1]
        : { close: initialPrice, time: Date.now() - 2000 };

      const open = currentPriceRef.current; // Start new candle from current price
      const change = (Math.random() - 0.5) * (open * 0.01);
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * (open * 0.005);
      const low = Math.min(open, close) - Math.random() * (open * 0.005);
      const time = lastCandle.time + 2000;

      const newCandle = { open, high, low, close, time };
      candleDataRef.current.push(newCandle);
      if (candleDataRef.current.length > 100) {
        candleDataRef.current.shift();
      }
      onCandleDataUpdate([...candleDataRef.current]);
    };

    candleDataRef.current = [];
    let startTime = Date.now() - 100 * 2000;
    let price = initialPrice;
    for(let i = 0; i < 50; i++){
        const open = price;
        const change = (Math.random() - 0.5) * (open * 0.005);
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * (open * 0.005);
        const low = Math.min(open, close) - Math.random() * (open * 0.005);
        const time = startTime + i * 2000;
        candleDataRef.current.push({ open, high, low, close, time });
        price = close;
    }
    
    candleTimer = setInterval(generateNewCandle, 2000);

    return () => clearInterval(candleTimer);
  }, [initialPrice, onCandleDataUpdate]);

  useEffect(() => {
      let priceTimer: NodeJS.Timeout;
      const updatePrice = () => {
        const lastCandle = candleDataRef.current[candleDataRef.current.length-1];
        if(!lastCandle) return;

        const volatility = 0.005; // 0.5%
        const priceChange = (Math.random() - 0.5) * (lastCandle.close * volatility);
        const newPrice = lastCandle.close + priceChange;

        currentPriceRef.current = newPrice;
        onPriceChange(newPrice);
      }
      priceTimer = setInterval(updatePrice, 500); // Update price more frequently
      return () => clearInterval(priceTimer);
  }, [initialPrice, onPriceChange]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
        drawChart();
    };

    window.addEventListener('resize', updateCanvasSize);
    
    let animationFrameId: number;
    const renderLoop = () => {
        drawChart();
        animationFrameId = requestAnimationFrame(renderLoop);
    }
    renderLoop();
    
    return () => {
        window.removeEventListener('resize', updateCanvasSize);
        cancelAnimationFrame(animationFrameId);
    }
  }, [drawChart]);

  return <canvas ref={canvasRef} className="w-full h-full"></canvas>;
}
