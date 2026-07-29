import * as fs from 'fs';
import * as path from 'path';
import dayjs from 'dayjs';
import { OrderData, OrderStatus, BarData, TradeData, Interval } from './types/common';
import type { Response } from 'src/types/common';
import type { BarOverviewRecord } from './types/market-data';
import { BigNumber } from 'bignumber.js';
import { Table, tableFromArrays, tableFromIPC, tableToIPC } from 'apache-arrow';

let orderCount: number = 0;

let parquet;
let parquetWasmInited = false;
async function initParquetWasm() {
  if (!parquetWasmInited) {
    parquet = await import('parquet-wasm/esm/parquet_wasm.js');
    const wasmPath = require.resolve('parquet-wasm/esm/parquet_wasm_bg.wasm');
    const { initSync } = parquet;
    const wasmBuffer = fs.readFileSync(wasmPath);
    initSync({ module: wasmBuffer });
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

function getMarketDataDir() {
  return path.resolve(__dirname, '../data/bars');
}

function getSafeSymbol(symbol: string) {
  return symbol.replace(/[^a-zA-Z0-9_.-]/g, '_');
}

function getBrokerDir(brokerName: string) {
  return path.resolve(getMarketDataDir(), brokerName);
}

function getBarFilePath(brokerName: string, symbol: string, interval: Interval) {
  const safeSymbol = getSafeSymbol(symbol);
  return path.resolve(getBrokerDir(brokerName), `${safeSymbol}_${interval}.parquet`);
}

function getBarMetaFilePath(brokerName: string, symbol: string, interval: Interval) {
  const safeSymbol = getSafeSymbol(symbol);
  return path.resolve(getBrokerDir(brokerName), `${safeSymbol}_${interval}.meta.json`);
}

function ensureBrokerDir(brokerName: string) {
  fs.mkdirSync(getBrokerDir(brokerName), { recursive: true });
}

export function readBarOverview(brokerName: string, symbol: string, interval: Interval): BarOverviewRecord | null {
  const filePath = getBarMetaFilePath(brokerName, symbol, interval);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as BarOverviewRecord;
  } catch (e) {
    console.error(e);
    throw new Error('read bar overview file error');
  }
}

export function writeBarOverview(overview: BarOverviewRecord): void {
  ensureBrokerDir(overview.brokerType);
  const filePath = getBarMetaFilePath(overview.brokerType, overview.symbol, overview.interval);
  fs.writeFileSync(filePath, JSON.stringify(overview, null, 2));
}

export function listBarOverviews(): BarOverviewRecord[] {
  const dataDir = getMarketDataDir();
  if (!fs.existsSync(dataDir)) {
    return [];
  }

  const result: BarOverviewRecord[] = [];
  const brokerDirs = fs.readdirSync(dataDir, { withFileTypes: true });
  for (const brokerDir of brokerDirs) {
    if (!brokerDir.isDirectory()) {
      continue;
    }

    const files = fs.readdirSync(path.resolve(dataDir, brokerDir.name), { withFileTypes: true });
    for (const file of files) {
      if (!file.isFile() || !file.name.endsWith('.meta.json')) {
        continue;
      }

      const filePath = path.resolve(dataDir, brokerDir.name, file.name);
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        result.push(JSON.parse(raw) as BarOverviewRecord);
      } catch (e) {
        console.error(e);
        throw new Error('list bar overview files error');
      }
    }
  }

  return result.sort((a, b) => {
    if (a.brokerType !== b.brokerType) {
      return a.brokerType.localeCompare(b.brokerType);
    }
    if (a.symbol !== b.symbol) {
      return a.symbol.localeCompare(b.symbol);
    }
    return a.interval.localeCompare(b.interval);
  });
}

export function deleteBarOverviewFiles(brokerName: string, symbol: string, interval: Interval): void {
  const barFilePath = getBarFilePath(brokerName, symbol, interval);
  const metaFilePath = getBarMetaFilePath(brokerName, symbol, interval);

  if (fs.existsSync(barFilePath)) {
    fs.unlinkSync(barFilePath);
  }
  if (fs.existsSync(metaFilePath)) {
    fs.unlinkSync(metaFilePath);
  }
}

export async function writeBars(brokerName: string, symbol: string, interval: Interval, newBars: BarData[]): Promise<{count: number; total: number}> {
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
    return {count: 0, total: 0};
  }
  
  const wasmTable = Table.fromIPCStream(tableToIPC(arrowTable, 'stream'));
  const writerProps = new WriterPropertiesBuilder()
    .setCompression(Compression.SNAPPY)
    .build();
  const parquetBytes = writeParquet(wasmTable, writerProps);

  ensureBrokerDir(brokerName);
  const filePath = getBarFilePath(brokerName, symbol, interval);
  fs.writeFileSync(filePath, Buffer.from(parquetBytes));
  return { count: list.length - exsitsBars.length, total: list.length}
}

export async function readBars(
  brokerName: string, 
  symbol: string, 
  interval: Interval, 
  startTime?: number, 
  endTime?: number
): Promise<BarData[]> {
  const filePath = getBarFilePath(brokerName, symbol, interval);
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
