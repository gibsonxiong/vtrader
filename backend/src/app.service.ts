import { Injectable } from '@nestjs/common';

import { Direction, Interval, Offset, OrderStatus } from '@vtrader/shared';
import type { BarData, OrderData, TradeData } from '@vtrader/shared';
import { MarketDataService } from './market-data/market-data.service';
import { BacktestingService } from './backtesting/backtesting.service';
import { StrategyService } from './strategy/strategy.service';
import { BrokerManagerService } from './broker-manager/broker-manager.service';
import { BarGenerator } from './strategy/bar-generator';
import { mockBars } from './mock/bars';
// import { gridStrategyOptimizationExample } from './strategy/optimization/optimization-example';
import { test } from './optimization/index';
import type { BacktestingSetting } from '@vtrader/shared';
import config from './config';
import axios from 'axios';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import * as fs from 'fs';
import * as path from 'path';

// 
// console.log(bollingerbands({period : 3, values : [2,3,4,5,6,7,8,9,10,11], stdDev : 2}));

const brokerId = config.brokers[1].id;

@Injectable()
export class AppService {
  constructor(
    private readonly marketDataService: MarketDataService,
    private readonly backtestingService: BacktestingService,
    private readonly brokerMgrService: BrokerManagerService,
    private readonly strategyService: StrategyService,
  ) {
    this.getBars();
  }

    async testBroker(): Promise<void> {
    const broker = await this.brokerMgrService.getBroker(brokerId);

    // const contract = broker.getContractBySymbol('BTCUSDT:USDT');

    // console.log('contract', contract);

    // broker.subscribeBar({
    //   symbol: 'BTCUSDT:USDT',
    //   interval: Interval.MINUTE_5,
    // });

    // broker.watchBar((bar: BarData) => {
    //   // console.log(bar);

    //   broker.unsubscribeBar({
    //     symbol: 'BTCUSDT:USDT',
    //     interval: Interval.MINUTE_5,
    //   });
    // });

    // broker.watchTrade((trade: TradeData) => {
    //   console.log('trade', trade);
    // });

    // broker.watchOrder((order: OrderData) => {
    //   console.log('order', order);

    //   if (order.status === OrderStatus.NOTTRADED) {
    //     // 取消订单
    //     broker.cancelOrder({
    //       orderId: order.orderId,
    //       symbol: order.symbol,
    //     });
    //   }
    // });

    // 发送订单
    // broker.sendOrder({
    //   orderId: '123456',
    //   symbol: 'BTCUSDT:USDT',
    //   direction: Direction.LONG,
    //   offset: Offset.OPEN,
    //   price: 83600,
    //   volume: 0.56,
    // });

    // 查询订单
    // @ts-expect-error
    const orders = await broker.restApi.queryOrders({
      symbol: 'BTCUSDT:USDT',
      limit: 10,
    });

    console.log('orders', orders);

    // // @ts-expect-error
    // const order = await broker.restApi.queryOrder({
    //   symbol: 'BTCUSDT:USDT',
    //   orderId: '123456',
    // });

    // @ts-expect-error
    const assets = await broker.restApi.queryAssets();
    console.log('assets', assets);

    // @ts-expect-error
    const positions = await broker.restApi.queryPositions();
    console.log('positions', positions);

  }

  // 获取K线
  async getBars(): Promise<void> {
    const barsRes = await this.marketDataService.getBarsFromDb({
      brokerId,
      startDate: '2020-01-01',
      endDate: '2025-05-28',
      interval: Interval.MINUTE_1,
      symbol: 'BTCUSDT:USDT',
    });
    const list = barsRes.list;
    const symbol = 'BTCUSDT:USDT';
    const interval = Interval.MINUTE_1;

    const arrow = await import('apache-arrow');
    const { tableFromArrays, tableToIPC } = arrow as any;
    const parquet = await import('parquet-wasm/esm/parquet_wasm.js');
    const { initSync, Table, writeParquet, WriterPropertiesBuilder, Compression } = parquet as any;
    const wasmPath = require.resolve('parquet-wasm/esm/parquet_wasm_bg.wasm');
    const wasmBuffer = fs.readFileSync(wasmPath);
    initSync(wasmBuffer);

    const timestamps = list.map((b) => new Date(b.timestamp));
    const opens = Float64Array.from(list.map((b) => b.open));
    const highs = Float64Array.from(list.map((b) => b.high));
    const lows = Float64Array.from(list.map((b) => b.low));
    const closes = Float64Array.from(list.map((b) => b.close));
    const volumes = Float64Array.from(list.map((b) => b.volume));
    const symbols = list.map((b) => b.symbol);
    const intervals = list.map((b) => b.interval);

    const arrowTable = tableFromArrays({
      symbol: symbols,
      interval: intervals,
      timestamp: timestamps,
      open: opens,
      high: highs,
      low: lows,
      close: closes,
      volume: volumes,
    });

    if (!list.length) {
      return;
    }
    const wasmTable = Table.fromIPCStream(tableToIPC(arrowTable, 'stream'));
    const writerProps = new WriterPropertiesBuilder()
      .setCompression(Compression.SNAPPY)
      .build();
    const parquetBytes = writeParquet(wasmTable, writerProps);

    const dataDir = path.resolve(process.cwd(), 'src', 'data');
    fs.mkdirSync(dataDir, { recursive: true });
    const safeSymbol = symbol.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const filePath = path.resolve(dataDir, `${safeSymbol}_${interval}.parquet`);
    fs.writeFileSync(filePath, Buffer.from(parquetBytes));
  }

  async readFile(): Promise<void> {
    const t0 = Date.now();
    const filePath = 'd:\\Projects\\trade\\vtrader\\backend\\src\\data\\BTCUSDT_USDT_15m.parquet';
    try {
      const parquet = await import('parquet-wasm/esm/parquet_wasm.js');
      const { initSync, readParquet } = parquet as any;
      const wasmPath = require.resolve('parquet-wasm/esm/parquet_wasm_bg.wasm');
      const wasmBuffer = fs.readFileSync(wasmPath);
      initSync(wasmBuffer);
      const arrow = await import('apache-arrow');
      const { tableFromIPC } = arrow as any;
      const buf = fs.readFileSync(filePath);
      const wasmTable = readParquet(new Uint8Array(buf));
      const table = tableFromIPC(wasmTable.intoIPCStream());
      const dt = Date.now() - t0;
      console.log('parquet open time(ms):', dt);
      console.table(table.select(['open','close','high','low','volume']).toArray());
    } catch (e) {
      const dt = Date.now() - t0;
      console.log('parquet open failed time(ms):', dt);
      console.error(e);
    }
  }

  // 下载K线
  async downlaod(): Promise<void> {
    const count = await this.marketDataService.downloadBars({
      brokerId,
      startDate: '2025-07-01',
      // endDate: '2025-05-02',
      interval: Interval.MINUTE_1,
      symbol: 'BTCUSDT:USDT',
    });

    console.log(count);
  }

  // 回测
  async backtesting(): Promise<void> {
    // 1. 设置回测参数
    const setting: BacktestingSetting = {
      brokerId,
      startDate: '2025-07-08',
      endDate: '2025-07-23',
      symbols: ['BTCUSDT:USDT', 'ETHUSDT:USDT'],
      interval: Interval.MINUTE_1,
      balance: 100_000,
      commissionRate: 0.0005,
      strategy: {
        strategyName: 'GridStrategy',
        strategySetting: {
          // rsiWindow: 20,
        },
      },
    };

    this.backtestingService.createBacktesting(setting);
  }

  async createStrategy(): Promise<void> {
    const strategy = await this.strategyService.createInstance('MyStrategy', {
      engine: {} as any,
      symbols: ['BTCUSDT:USDT'],
      assetBalance: 1000,
      assetName: 'USDT',
      setting: {
        fastWindow: 10,
        slowWindow: 20,
        fixedSize: 1,
      },
    });

    console.log(strategy);
  }


  testBarGenerator(): void {
    const bg = new BarGenerator({
      interval: Interval.DAILY_1,
      callback: (bar: BarData) => {
        console.log(bar);
      },
    });

    mockBars.forEach((bar) => {
      bg.update(bar);
    });
  }

  async getStategies(): Promise<void> {
    const stategies = await this.strategyService.getStategies();
    console.log('stategies', stategies);
  }

  async optimization(): Promise<void> {
    test();
  }
}
