
"use client";

import { useRef, useEffect, useCallback } from 'react';

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  time: number;
}

interface TradingChartProps {
  currentPrice: number;
  onPriceChange: (price: number) => void;
}

export function TradingChart({ currentPrice, onPriceChange }: TradingChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const candleDataRef = useRef<Candle[]>([]);

  const renderChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const yAxisWidth = 60;
    const xAxisHeight = 30;
    const chartWidth = width - yAxisWidth;
    const chartHeight = height - xAxisHeight;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#111827'; 
    ctx.fillRect(0, 0, width, height);
      
    const candles = candleDataRef.current;
    if (candles.length === 0) return;

    const maxPrice = Math.max(...candles.map(c => c.high));
    const minPrice = Math.min(...candles.map(c => c.low));
    const priceRange = maxPrice - minPrice > 0 ? maxPrice - minPrice : 1;
    const candleWidth = chartWidth / (candles.length * 1.5);
    const spacing = candleWidth * 0.5;

    const scaleY = (y: number) => chartHeight - ((y - minPrice) / priceRange) * chartHeight * 0.9 - chartHeight * 0.05;

    // Draw Y-axis (Price)
    ctx.strokeStyle = '#374151'; // border color
    ctx.fillStyle = '#9ca3af'; // muted-foreground
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
        ctx.fillText(`$${price.toFixed(2)}`, chartWidth + 5, y + 4);
    }
    
    // Draw X-axis (Time)
    ctx.textAlign = 'center';
    const numTimeLabels = Math.floor(chartWidth / 100);
    const timeInterval = Math.floor(candles.length / numTimeLabels);
    for (let i = 0; i < candles.length; i++) {
        if (i % timeInterval === 0) {
            const candle = candles[i];
            const x = i * (candleWidth + spacing) + spacing + candleWidth / 2;
            if(x < chartWidth) {
                 const time = new Date(candle.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                 ctx.fillText(time, x, chartHeight + 20);
            }
        }
    }


    candles.forEach((candle, index) => {
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

    ctx.strokeStyle = '#7DD3FC'; // primary color
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    const priceY = scaleY(currentPrice);
    ctx.moveTo(0, priceY);
    ctx.lineTo(chartWidth, priceY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillStyle = '#7DD3FC';
    ctx.fillRect(chartWidth, priceY - 10, yAxisWidth, 20);
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.fillText(`$${currentPrice.toFixed(2)}`, chartWidth + yAxisWidth / 2, priceY + 4);

  }, [currentPrice]);

  useEffect(() => {
    let candleTimer: NodeJS.Timeout;
    
    const generateNewCandle = () => {
      const lastCandle = candleDataRef.current.length > 0
        ? candleDataRef.current[candleDataRef.current.length - 1]
        : { close: 3500, time: Date.now() - 2000 };

      const open = lastCandle.close;
      const change = (Math.random() - 0.5) * (open * 0.01);
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * (open * 0.005);
      const low = Math.min(open, close) - Math.random() * (open * 0.005);
      const time = lastCandle.time + 2000;

      const newCandle = { open, high, low, close, time };
      candleDataRef.current.push(newCandle);
      if (candleDataRef.current.length > 50) {
        candleDataRef.current.shift();
      }
      onPriceChange(newCandle.close);
    };

    if (candleDataRef.current.length === 0) {
        let startTime = Date.now() - 50 * 2000;
        candleDataRef.current.push({ open: 3500, high: 3510, low: 3490, close: 3505, time: startTime });
        for(let i = 1; i < 50; i++){
            generateNewCandle();
        }
    }
    
    candleTimer = setInterval(generateNewCandle, 2000);

    return () => clearInterval(candleTimer);
  }, [onPriceChange]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        renderChart();
      }
    };

    window.addEventListener('resize', updateCanvasSize);
    updateCanvasSize();
    
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [renderChart]);

  useEffect(() => {
    renderChart();
  }, [currentPrice, renderChart]);

  return <canvas ref={canvasRef} className="w-full h-full"></canvas>;
}
