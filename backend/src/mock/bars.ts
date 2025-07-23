import { Interval } from 'src/types/common';
import type { BarData } from 'src/types/common';

export const mockBars: BarData[] = [];

// 从2025-01-01 00:00:00开始 到2025-09-01 00:00:00结束 生成一分钟K线
const start = new Date('2025-07-05 00:00:00');
const end = new Date('2025-07-24 00:00:00');

const interval = 60 * 1000; // 1分钟
let close = 10_000;
let prevBar: BarData | null = null;

for (let i = start.getTime(); i < end.getTime(); i += interval) {
  close += Math.round(Math.random() * 100 - 50);
  const bar = {
    close,
    high: Math.max(close, prevBar?.high || close),
    low: Math.min(close, prevBar?.low || close),
    interval: Interval.MINUTE_1,
    open: prevBar?.close || close,
    volume: 100,
    symbol: 'BTCUSDT:USDT',
    timestamp: i,
  };
  prevBar = bar;
  mockBars.push(bar);
}

// console.log(mockBars);
