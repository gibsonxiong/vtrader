import type { ContractData } from '@vtrader/shared';
import type { BinanceLinearBroker } from './broker';

import * as crypto from 'node:crypto';

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import dayjs from 'dayjs';

import { BarData, Interval, Product, type OrderData, OrderStatus, OrderType, Direction, Offset } from '@vtrader/shared';
import {
  INTERVAL_VT2BINANCE,
  INTERVAL_VT2DAYJS,
  PRODUCT_BINANCE2VT,
  binance2direction,
  binance2offset,
  binance2ordertype,
  binance2status
} from './constants';
import { HistoryRequest } from '@vtrader/shared';

/**
 * REST API客户端
 */
export class RestApi {
  public userStreamKey: string = '';
  private apiKey: string = '';
  private apiSecret: string = '';
  private client: AxiosInstance;
  private broker: BinanceLinearBroker;
  private keepAliveCount: number = 0;
  private server: string = '';

  private host: string = '';

  constructor(broker: BinanceLinearBroker) {
    this.broker = broker;
    this.client = axios.create();
  }

  /**
   * 连接到REST API
   */
  public async connect(
    apiKey: string,
    apiSecret: string,
    // server: string,
    // proxyHost?: string,
    // proxyPort?: number,
  ): Promise<void> {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    // this.server = server;

    // const baseURL = server === 'REAL' ? REAL_REST_HOST : TESTNET_REST_HOST;
    this.client = axios.create({
      baseURL: this.broker.REST_HOST,
      // proxy: proxyHost && proxyPort ? {
      //   host: proxyHost,
      //   port: proxyPort,
      //   protocol: 'http'
      // } : undefined,
    });

    // 查询服务器时间
    await this.queryTime();

    // 查询合约信息
    await this.queryContract();

    // 启动用户数据流
    await this.startUserStream();

    this.broker.writeLog('REST API连接成功');
  }

  /**
   * 保持用户数据流活跃
   */
  public async keepUserStream(): Promise<void> {
    if (!this.userStreamKey) {
      return;
    }

    this.keepAliveCount++;
    if (this.keepAliveCount < 600) {
      return;
    }
    this.keepAliveCount = 0;

    try {
      await this.sendSignedRequest('PUT', '/fapi/v1/listenKey', {
        listenKey: this.userStreamKey,
      });
    } catch (error) {
      this.broker.writeLog(`保持用户数据流失败: ${error}`);
    }
  }

  /**
   * 查询历史数据
   */
  public async queryHistory(
    req: HistoryRequest,
    callback?: (bars: BarData[]) => void,
  ): Promise<BarData[]> {
    // Check if the contract exists
    const contract = this.broker.getContractBySymbol(req.symbol);
    if (!contract) {
      return [];
    }

    // Prepare history list
    const history: BarData[] = [];
    const limit = 1500;
    let startTime = dayjs(req.startDate).valueOf();
    let endTime = dayjs(req.endDate).valueOf();

    while (true) {
      // Create query parameters
      const params: any = {
        symbol: contract.name,
        interval: INTERVAL_VT2BINANCE[req.interval],
        limit,
        startTime,
        endTime,
      };

      // if (req.endDate) {
      //   params.endTime = dayjs(req.endDate).valueOf();
      // }

      try {
        const response = await this.client.get('/fapi/v1/klines', { params });
        const data = response.data;

        if (!data || data.length === 0) {
          const msg = `未接收到K线历史数据，起始时间: ${startTime}`;
          this.broker.writeLog(msg);
          break;
        }

        const buf: BarData[] = [];

        for (const row of data) {
          const bar: BarData = {
            symbol: req.symbol,
            timestamp: row[0],
            interval: req.interval,
            volume: Number.parseFloat(row[5]),
            open: Number.parseFloat(row[1]),
            high: Number.parseFloat(row[2]),
            low: Number.parseFloat(row[3]),
            close: Number.parseFloat(row[4]),
          };
          buf.push(bar);
        }

        const begin = dayjs(buf[0].timestamp).format('YYYY-MM-DD HH:mm:ss');
        const end = dayjs(buf[buf.length - 1].timestamp).format('YYYY-MM-DD HH:mm:ss');

        history.push(...buf);

        if (callback) {
          callback(buf);
        }

        this.broker.writeLog(`K线历史数据查询完成，${req.symbol} - ${req.interval}, ${begin} - ${end}`);

        const lastTimestamp = buf[buf.length - 1].timestamp;
        // Break the loop if the latest data received
        if (
          data.length < limit ||
          (lastTimestamp >= endTime)
        ) {
          break;
        }

        // Update query start time
       
        startTime = this.getNextStartTime(lastTimestamp, req.interval);

        // Wait to meet request flow limit
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        this.broker.writeLog(`K线历史数据查询失败: ${error}`);
        break;
      }
    }

    this.broker.writeLog(`K线历史数据查询完成，共${history.length}条数据`);

    // if (history[history.length - 1]?.timestamp === dayjs(req.endDate).valueOf()) {
    //   history.pop();
    // }

    return history;
  }

  /**
   * 停止REST API
   */
  public stop(): void {
    // 清理资源
  }

  /**
   * 查询单个订单
   */
  public async queryOrder(req: { symbol: string; orderId: string }): Promise<OrderData | null> {
    const contract = this.broker.getContractBySymbol(req.symbol);
    if (!contract) return null;

    const params: Record<string, any> = { 
      symbol: contract.name,
      origClientOrderId: req.orderId,
    };

    try {
      const data = await this.sendSignedRequest('GET', '/fapi/v1/order', params);
      return this.mapOrder(data, req.symbol);
    } catch (error) {
      // this.broker.writeLog(`查询订单失败: ${error}`);
      return null;
    }
  }

  /**
   * 查询历史订单列表
   */
  public async queryOrders(req: { symbol: string; startTime?: number; endTime?: number; limit?: number }): Promise<OrderData[]> {
    const contract = this.broker.getContractBySymbol(req.symbol);
    if (!contract) return [];

    const params: Record<string, any> = { symbol: contract.name };
    if (req.startTime) params.startTime = req.startTime;
    if (req.endTime) params.endTime = req.endTime;
    if (req.limit) params.limit = req.limit;

    try {
      const list = await this.sendSignedRequest('GET', '/fapi/v1/allOrders', params);
      if (!Array.isArray(list)) return [];
      return list.map((o: any) => this.mapOrder(o, req.symbol));
    } catch (error) {
      this.broker.writeLog(`查询历史订单失败: ${error}`);
      return [];
    }
  }

  private getNextStartTime(timestamp: number, interval: Interval): number {
    const args = INTERVAL_VT2DAYJS[interval];
    const nextTime = dayjs(timestamp).add(...args);
    return nextTime.valueOf();
  }

  private mapOrder(order: any, symbol: string): OrderData {
    console.log(order);

    return {
      direction: binance2direction(order.positionSide),
      offset: binance2offset(order.positionSide, order.side),
      type: binance2ordertype(order.type),
      status: binance2status(order.status),
      orderId: order.clientOrderId,
      price: Number(order.price ?? 0),
      volume: Number(order.origQty ?? 0),
      avgPrice: Number(order.avgPrice ?? 0),
      traded: Number(order.executedQty ?? 0),
      tradePrice: 0,
      tradeVolume: 0,
      tradeCommission: 0,
      symbol: symbol,
      time: new Date(order.time),
      msg: '',
    };
  }

  /**
   * 查询合约信息
   */
  private async queryContract(): Promise<void> {
    try {
      const response = await this.client.get('/fapi/v1/exchangeInfo');
      const data = response.data;

      for (const symbolData of data.symbols) {
        if (symbolData.status !== 'TRADING') {
          continue;
        }

        const contract: ContractData = {
          symbol: `${symbolData.symbol}:${symbolData.marginAsset}`,
          name: symbolData.symbol,
          product: PRODUCT_BINANCE2VT[symbolData.contractType] || Product.FUTURES,
          priceTick: Number.parseFloat(
            symbolData.filters.find((f: any) => f.filterType === 'PRICE_FILTER')?.tickSize ||
              '0.01',
          ),
          minVolume: Number.parseFloat(
            symbolData.filters.find((f: any) => f.filterType === 'LOT_SIZE')?.minQty || '1',
          ),
          supportStopOrder: true,
          netPosition: true,
          supportHistory: true,
        };

        this.broker.onContract(contract);
      }

      this.broker.writeLog(`合约信息查询完成，共${data.symbols.length}个合约`);
    } catch (error) {
      this.broker.writeLog(`查询合约信息失败: ${error}`);
      throw error;
    }
  }

  /**
   * 查询服务器时间
   */
  private async queryTime(): Promise<void> {
    try {
      const response = await this.client.get('/fapi/v1/time');
      const serverTime = response.data.serverTime;
      const localTime = Date.now();
      this.broker.timeOffset = localTime - serverTime;
      this.broker.writeLog(`服务器时间同步完成，偏移: ${this.broker.timeOffset}ms`);
    } catch (error) {
      this.broker.writeLog(`查询服务器时间失败: ${error}`);
      throw error;
    }
  }

  /**
   * 发送签名请求
   */
  private async sendSignedRequest(
    method: 'DELETE' | 'GET' | 'POST' | 'PUT',
    path: string,
    params: Record<string, any> = {},
  ): Promise<any> {
    const config: AxiosRequestConfig = {
      method,
      url: path,
      headers: {
        'X-MBX-APIKEY': this.apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    if (method === 'GET') {
      config.params = params;
      config.paramsSerializer = () => this.sign(params);
    } else {
      config.data = this.sign(params);
    }

    try {
      const response = await this.client.request(config);
      return response.data;
    } catch (error) {
      const res = error.response?.data;
      const msg = res?.msg || error.message;
      this.broker.writeLog(`REST API请求失败: ${msg}`);
      throw error;
    }
  }

  /**
   * 签名请求
   */
  private sign(params: Record<string, any>): string {
    const timestamp = Date.now() - this.broker.timeOffset;
    params.timestamp = timestamp;

    const queryString = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    const signature = crypto.createHmac('sha256', this.apiSecret).update(queryString).digest('hex');

    return `${queryString}&signature=${signature}`;
  }

  /**
   * 启动用户数据流
   */
  private async startUserStream(): Promise<void> {
    try {
      const response = await this.sendSignedRequest('POST', '/fapi/v1/listenKey');
      this.userStreamKey = response.listenKey;
      this.broker.writeLog('用户数据流启动成功');
    } catch (error) {
      this.broker.writeLog(`启动用户数据流失败: ${error}`);
      throw error;
    }
  }
}
