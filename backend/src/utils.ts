import * as fs from 'fs';
import * as path from 'path';
import dayjs from 'dayjs';
import { OrderData, OrderStatus, BarData, TradeData, Interval } from '@vtrader/shared';
import { Response } from '@vtrader/shared';
import { BigNumber } from 'bignumber.js';
import { Table, tableFromArrays, tableFromIPC, tableToIPC } from 'apache-arrow';

let orderCount: number = 0;

let parquetWasmInited = false;
async function initParquetWasm() {
  const parquet = await import('parquet-wasm/esm/parquet_wasm.js');
  if (!parquetWasmInited) {
    const wasmPath = require.resolve('parquet-wasm/esm/parquet_wasm_bg.wasm');
    const { initSync } = parquet as any;
    const wasmBuffer = fs.readFileSync(wasmPath);
    initSync(wasmBuffer);
    parquetWasmInited = true;
  }
  return parquet as any;
}

export function genOrderId(): string {
  return String(orderCount++);
}

export function canOrderCancel(order: OrderData) {
  return order.status === OrderStatus.NOTTRADED || order.status === OrderStatus.PARTTRADED;
}

export function roundTo(source: number, target: number, roundMode?: BigNumber.RoundingMode): number {
  const _source = new BigNumber(String(source));
  const _target = new BigNumber(String(target));

  if (_source.isNaN() || _target.isNaN()) {
    return NaN;
  }

  if (_target.isZero()) {
    return 0;
  }

  const result = _source.div(target).integerValue(roundMode).times(target).toNumber();

  return result;
}

export function floorTo(source: number, target: number): number {
  return roundTo(source, target, BigNumber.ROUND_FLOOR);
}

export function ceilTo(source: number, target: number): number {
  return roundTo(source, target, BigNumber.ROUND_CEIL);
}

export function calculateStd(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function response<T>(data?: T, code: number = 0, msg: string = '成功'): Response<T> {
  return {
    code,
    msg,
    data: data as T,
  };
}

export async function writeBars(brokerName: string, symbol: string, interval: Interval, newBars: BarData[]): Promise<{count: number}> {
  const parquet = await initParquetWasm();
  const { Table, writeParquet, WriterPropertiesBuilder, Compression } = parquet;

  const exsitsBars = await readBars(brokerName, symbol, interval);
  console.log('exsitsBars', exsitsBars);
  const existsKeys = {};
  const list: BarData[] = [];
  // 去重复
  [...exsitsBars, ...newBars].forEach((b) => {
    const key = `${b.symbol}_${b.interval}_${b.timestamp}`;
    if (!existsKeys[key]) {
      existsKeys[key] = true;
      list.push(b);
    }
  });
  list.sort((a, b) => b.timestamp - a.timestamp);
  console.log('list', list);

  // 使用 Int64 存储时间戳，减少 Date 对象开销
  const timestamps = BigInt64Array.from(list.map((b) => BigInt(b.timestamp)));
  const opens = Float64Array.from(list.map((b) => b.open));
  const highs = Float64Array.from(list.map((b) => b.high));
  const lows = Float64Array.from(list.map((b) => b.low));
  const closes = Float64Array.from(list.map((b) => b.close));
  const volumes = Float64Array.from(list.map((b) => b.volume));

  const arrowTable = tableFromArrays({
    timestamp: timestamps,
    open: opens,
    high: highs,
    low: lows,
    close: closes,
    volume: volumes,
  });

  if (!list.length) {
    return {count: 0};
  }
  
  const wasmTable = Table.fromIPCStream(tableToIPC(arrowTable, 'stream'));
  const writerProps = new WriterPropertiesBuilder()
    .setCompression(Compression.SNAPPY)
    .build();
  const parquetBytes = writeParquet(wasmTable, writerProps);

  const dataDir = path.resolve(process.cwd(), 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const safeSymbol = symbol.replace(/[^a-zA-Z0-9_.-]/g, '_');
  if (!fs.existsSync(path.resolve(dataDir, brokerName))) {
    fs.mkdirSync(path.resolve(dataDir, brokerName));
  }
  const filePath = path.resolve(__dirname, '../data', `${brokerName}/${safeSymbol}_${interval}.parquet`);
  fs.writeFileSync(filePath, Buffer.from(parquetBytes));
  return { count: list.length - exsitsBars.length}
}

export async function readBars(
  brokerName: string, 
  symbol: string, 
  interval: Interval, 
  startTime?: number, 
  endTime?: number
): Promise<BarData[]> {
  const safeSymbol = symbol.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const filePath = path.resolve(__dirname, '../data', `${brokerName}/${safeSymbol}_${interval}.parquet`);
  try {
    const parquet = await initParquetWasm();
    const { readParquet } = parquet;
    const isExists = fs.existsSync(filePath);
    if (!isExists) {
      return [];
    }
    const fileBuffer = fs.readFileSync(filePath);
    const wasmTable = readParquet(new Uint8Array(fileBuffer));
    const table = tableFromIPC(wasmTable.intoIPCStream());

    const result: BarData[] = [];
    const start = typeof startTime === 'number' ? startTime : -Infinity;
    const end = typeof endTime === 'number' ? endTime : Infinity;

    for (const batch of (table as any).batches as Table['batches']) {
      const tsVec = batch.getChild('timestamp');
      const openVec = batch.getChild('open');
      const highVec = batch.getChild('high');
      const lowVec = batch.getChild('low');
      const closeVec = batch.getChild('close');
      const volVec = batch.getChild('volume');

      // 兼容读取两种时间戳表示：旧版的 Date[] 与新版的 Int64(BigInt64Array)
      const tsArr = tsVec!.toArray() as unknown as any;
      const openArr = openVec!.toArray() as unknown as Float64Array;
      const highArr = highVec!.toArray() as unknown as Float64Array;
      const lowArr = lowVec!.toArray() as unknown as Float64Array;
      const closeArr = closeVec!.toArray() as unknown as Float64Array;
      const volArr = volVec!.toArray() as unknown as Float64Array;

      const len = tsArr.length;
      for (let i = 0; i < len; i++) {
        const t = Number(tsArr[i]);
        if (t < start || t > end) continue;
        result.push({
          symbol,
          interval,
          timestamp: t,
          open: openArr[i],
          close: closeArr[i],
          high: highArr[i],
          low: lowArr[i],
          volume: volArr[i],
        });
      }
    }

    return result;
  } catch (e) {
    console.error(e);
    throw new Error('read parquet file error');
  }
}
