
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
    
    const cardColor = getComputedStyle(document.documentElement).getPropertyValue('--card').trim();
    ctx.fillStyle = `hsl(${cardColor})`;
    ctx.fillRect(0, 0, width, height);
      
    const candles = candleDataRef.current;
    if (candles.length === 0) return;

    const visibleCandles = candles.slice(-50);
    const maxPrice = Math.max(...visibleCandles.map(c => c.high));
    const minPrice = Math.min(...visibleCandles.map(c => c.low));
    const priceRange = maxPrice - minPrice;

    const Y_AXIS_WIDTH = 60;
    const X_AXIS_HEIGHT = 30;
    const chartWidth = width - Y_AXIS_WIDTH;
    const chartHeight = height - X_AXIS_HEIGHT;

    const scaleY = (price: number) => {
        const paddedRange = priceRange * 1.1;
        const paddedMin = minPrice - (priceRange * 0.05);
        return chartHeight - ((price - paddedMin) / paddedRange) * chartHeight;
    };

    const textColor = `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim()})`;
    const borderColor = `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--border').trim()})`;

    ctx.font = '12px Inter';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    const numPriceLabels = 5;
    for (let i = 0; i <= numPriceLabels; i++) {
        const price = minPrice + (priceRange / numPriceLabels) * i;
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
            const x = (i * (chartWidth / visibleCandles.length)) + (chartWidth / (visibleCandles.length * 2));
            ctx.fillText(timeString, x, chartHeight + 20);
        }
    }

    const candleWidth = (chartWidth / (visibleCandles.length * 1.5));
    const spacing = candleWidth * 0.5;

    visibleCandles.forEach((candle, index) => {
      const x = index * (candleWidth + spacing) + spacing;
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
      const primaryColor = `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()})`;
      
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
    let candleTimer: NodeJS.Timeout;
    
    const generateNewCandle = () => {
      const lastCandle = candleDataRef.current.length > 0
        ? candleDataRef.current[candleDataRef.current.length - 1]
        : { close: initialPrice, time: Date.now() - 5000 };

      const open = currentPriceRef.current;
      const change = (Math.random() - 0.5) * (open * 0.0005);
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * (open * 0.0002);
      const low = Math.min(open, close) - Math.random() * (open * 0.0002);
      const time = lastCandle.time + 5000;

      const newCandle = { open, high, low, close, time };
      candleDataRef.current.push(newCandle);
      if (candleDataRef.current.length > 100) {
        candleDataRef.current.shift();
      }
      onCandleDataUpdate([...candleDataRef.current]);
    };

    candleDataRef.current = [];
    let startTime = Date.now() - 100 * 5000;
    let price = initialPrice;
    for(let i = 0; i < 50; i++){
        const open = price;
        const change = (Math.random() - 0.5) * (open * 0.0005);
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * (open * 0.0002);
        const low = Math.min(open, close) - Math.random() * (open * 0.0002);
        const time = startTime + i * 5000;
        candleDataRef.current.push({ open, high, low, close, time });
        price = close;
    }
    
    candleTimer = setInterval(generateNewCandle, 5000);

    return () => clearInterval(candleTimer);
  }, [initialPrice, onCandleDataUpdate]);

  useEffect(() => {
      let priceTimer: NodeJS.Timeout;
      const updatePrice = () => {
        const lastCandle = candleDataRef.current[candleDataRef.current.length-1];
        if(!lastCandle) return;

        const volatility = 0.0001;
        const priceChange = (Math.random() - 0.5) * (lastCandle.close * volatility);
        const newPrice = lastCandle.close + priceChange;

        currentPriceRef.current = newPrice;
        onPriceChange(newPrice);
      }
      priceTimer = setInterval(updatePrice, 1500);
      return () => clearInterval(priceTimer);
  }, [initialPrice, onPriceChange]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
        drawChart();
    });
    observer.observe(canvas);
    
    let animationFrameId: number;
    const renderLoop = () => {
        drawChart();
        animationFrameId = requestAnimationFrame(renderLoop);
    }
    renderLoop();
    
    return () => {
        observer.disconnect();
        cancelAnimationFrame(animationFrameId);
    }
  }, [drawChart]);

  return <canvas ref={canvasRef} className="w-full h-full"></canvas>;
}
