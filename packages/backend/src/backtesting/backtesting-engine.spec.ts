import { toAsyncIterable, mergeSortedStreams } from './backtesting-engine';
import type { BarData, Interval } from '../types/common';

function makeBar(timestamp: number, symbol = 'BTCUSDT'): BarData {
  return {
    symbol,
    interval: '1m' as Interval,
    timestamp,
    open: 100,
    high: 101,
    low: 99,
    close: 100.5,
    volume: 1000,
  };
}

async function collect<T>(gen: AsyncGenerator<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of gen) {
    result.push(item);
  }
  return result;
}

// ==================== toAsyncIterable ====================

describe('toAsyncIterable', () => {
  it('空数组应返回空结果', async () => {
    const result = await collect(toAsyncIterable([]));
    expect(result).toEqual([]);
  });

  it('应逐条产出数组元素', async () => {
    const bars = [makeBar(1000), makeBar(2000), makeBar(3000)];
    const result = await collect(toAsyncIterable(bars));
    expect(result).toEqual(bars);
  });

  it('for await 遍历应保持顺序', async () => {
    const items = [1, 2, 3, 4, 5];
    const collected: number[] = [];
    for await (const item of toAsyncIterable(items)) {
      collected.push(item);
    }
    expect(collected).toEqual([1, 2, 3, 4, 5]);
  });
});

// ==================== mergeSortedStreams ====================

describe('mergeSortedStreams', () => {
  it('空流数组应返回空结果', async () => {
    const result = await collect(mergeSortedStreams([]));
    expect(result).toEqual([]);
  });

  it('单流应原样返回排序后的数据', async () => {
    async function* stream() {
      yield makeBar(1000);
      yield makeBar(2000);
      yield makeBar(3000);
    }
    const result = await collect(mergeSortedStreams([stream()]));
    expect(result.map((b) => b.timestamp)).toEqual([1000, 2000, 3000]);
  });

  it('两个已排序流应归并输出', async () => {
    async function* streamA() {
      yield makeBar(1000);
      yield makeBar(3000);
      yield makeBar(5000);
    }
    async function* streamB() {
      yield makeBar(2000);
      yield makeBar(4000);
      yield makeBar(6000);
    }
    const result = await collect(mergeSortedStreams([streamA(), streamB()]));
    expect(result.map((b) => b.timestamp)).toEqual([1000, 2000, 3000, 4000, 5000, 6000]);
  });

  it('交错时间戳的流应正确归并', async () => {
    async function* streamA() {
      yield makeBar(1000);
      yield makeBar(2000);
      yield makeBar(5000);
    }
    async function* streamB() {
      yield makeBar(1500);
      yield makeBar(3000);
      yield makeBar(4000);
    }
    const result = await collect(mergeSortedStreams([streamA(), streamB()]));
    expect(result.map((b) => b.timestamp)).toEqual([1000, 1500, 2000, 3000, 4000, 5000]);
  });

  it('三个流应正确归并', async () => {
    async function* streamA() {
      yield makeBar(1000);
      yield makeBar(4000);
    }
    async function* streamB() {
      yield makeBar(2000);
      yield makeBar(5000);
    }
    async function* streamC() {
      yield makeBar(3000);
      yield makeBar(6000);
    }
    const result = await collect(mergeSortedStreams([streamA(), streamB(), streamC()]));
    expect(result.map((b) => b.timestamp)).toEqual([1000, 2000, 3000, 4000, 5000, 6000]);
  });

  it('不同长度的流应正确归并', async () => {
    async function* streamA() {
      yield makeBar(1000);
      yield makeBar(3000);
      yield makeBar(5000);
      yield makeBar(7000);
    }
    async function* streamB() {
      yield makeBar(2000);
      yield makeBar(4000);
    }
    const result = await collect(mergeSortedStreams([streamA(), streamB()]));
    expect(result.map((b) => b.timestamp)).toEqual([1000, 2000, 3000, 4000, 5000, 7000]);
  });

  it('部分流为空应正确处理', async () => {
    async function* streamA() {
      yield makeBar(1000);
      yield makeBar(3000);
    }
    async function* streamB() {
      // 空流
    }
    const result = await collect(mergeSortedStreams([streamA(), streamB()]));
    expect(result.map((b) => b.timestamp)).toEqual([1000, 3000]);
  });

  it('所有流都为空应返回空', async () => {
    async function* streamA() {
      // 空
    }
    async function* streamB() {
      // 空
    }
    const result = await collect(mergeSortedStreams([streamA(), streamB()]));
    expect(result).toEqual([]);
  });

  it('大量数据归并应保持正确性', async () => {
    const count = 1000;
    async function* streamA() {
      for (let i = 0; i < count; i += 2) yield makeBar(i);
    }
    async function* streamB() {
      for (let i = 1; i < count; i += 2) yield makeBar(i);
    }
    const result = await collect(mergeSortedStreams([streamA(), streamB()]));
    expect(result.map((b) => b.timestamp)).toEqual(
      Array.from({ length: count }, (_, i) => i),
    );
  });
});