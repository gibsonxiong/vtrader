import type { ContractData } from '../../types/common';

import {
  AccountData,
  BarData,
  Exchange,
  OrderbookData,
  OrderData,
  PositionData,
  TickData,
  TradeData,
} from '../../types/common';
import { MdApi } from './md-api';
import { RestApi } from './rest-api';
import { TradeApi } from './trade-api';
import {
  CancelRequest,
  GatewaySettings,
  HistoryRequest,
  OrderRequest,
  SubscribeRequest,
} from '../../types/broker';
import { UserApi } from './user-api';
import { Broker } from 'src/broker-manager/broker';

/**
 * Binance线性合约网关
 */
export class BinanceLinearBroker extends Broker {
  public readonly exchange: Exchange = Exchange.BINANCE;
  public readonly brokerName: string = 'BINANCE_LINEAR';

  private mdApi: MdApi;
  private nameContractMap: Map<string, ContractData> = new Map();
  private orders: Map<string, OrderData> = new Map();
  private restApi: RestApi;

  private symbolContractMap: Map<string, ContractData> = new Map();
  private tradeApi: TradeApi;
  private userApi: UserApi;

  constructor() {
    super();
    this.restApi = new RestApi(this);
    this.tradeApi = new TradeApi(this);
    this.userApi = new UserApi(this);
    this.mdApi = new MdApi(this);
  }

  /**
   * 撤销订单
   */
  public async cancelOrder(req: CancelRequest): Promise<void> {
    this.tradeApi.cancelOrder(req);
  }

  /**
   * 连接到服务器
   */
  public async connect(settings: GatewaySettings): Promise<void> {
    const { apiKey, apiSecret, server, klineStream, proxyHost, proxyPort } = settings;

    await Promise.all([
      this.restApi.connect(apiKey, apiSecret, server, proxyHost, proxyPort).then(() => {
        return this.userApi.connect(this.restApi.userStreamKey, server);
      }),

      this.tradeApi.connect(apiKey, apiSecret, server, proxyHost, proxyPort),
      this.mdApi.connect(server, klineStream, proxyHost, proxyPort),
    ]);

    this.writeLog('网关连接成功');
  }

  /**
   * 根据名称获取合约
   */
  public getContractByName(name: string): ContractData | undefined {
    return this.nameContractMap.get(name);
  }

  /**
   * 根据符号获取合约
   */
  public getContractBySymbol(symbol: string): ContractData | undefined {
    return this.symbolContractMap.get(symbol);
  }

  /**
   * 获取订单
   */
  public getOrder(orderId: string): OrderData | undefined {
    return this.orders.get(orderId);
  }

  /**
   * 处理账户数据
   */
  public onAccount(account: AccountData): void {
    this.emit('account', account);
  }

  /**
   * 处理K线数据
   */
  public onBar(bar: BarData): void {
    this.emit('bar', bar);
  }

  /**
   * 处理合约数据
   */
  public onContract(contract: ContractData): void {
    this.symbolContractMap.set(contract.symbol, contract);
    this.nameContractMap.set(contract.name, contract);
    this.emit('contract', contract);
  }

  /**
   * 处理订单数据
   */
  public onOrder(order: OrderData): void {
    this.orders.set(order.orderId, { ...order });
    this.emit('order', order);
  }

  /**
   * 处理orderbook @TODO orderbook 与 tick 分开
   */
  public onOrderbook(orderbook: OrderbookData): void {
    this.emit('orderbook', orderbook);
  }

  /**
   * 处理持仓数据
   */
  public onPosition(position: PositionData): void {
    this.emit('position', position);
  }

  /**
   * 处理Tick数据
   */
  public onTick(tick: TickData): void {
    this.emit('tick', tick);
  }

  /**
   * 处理成交数据
   */
  public onTrade(trade: TradeData): void {
    this.emit('trade', trade);
  }

  /**
   * 查询历史数据
   */
  public async queryHistory(req: HistoryRequest): Promise<BarData[]> {
    return this.restApi.queryHistory(req);
  }

  /**
   * 发送订单
   */
  public sendOrder(req: OrderRequest): string {
    return this.tradeApi.sendOrder(req);
  }

  /**
   * 关闭连接
   */
  public stop(): void {
    this.restApi.stop();
    this.tradeApi.stop();
    this.userApi.stop();
    this.mdApi.stop();
    this.writeLog('网关连接已关闭');
  }

  /**
   * 订阅市场数据
   */
  public subscribe(req: SubscribeRequest): void {
    this.mdApi.subscribe(req);
  }

  /**
   * 写入日志
   */
  public writeLog(msg: string): void {
    console.log(`[${this.brokerName}] ${msg}`);
    this.emit('log', msg);
  }
}

export default BinanceLinearBroker;
