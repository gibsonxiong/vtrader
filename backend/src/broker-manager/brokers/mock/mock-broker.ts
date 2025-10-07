import { TradeData, OrderData, OrderType, BarData, ContractData, OrderStatus, Direction, Offset } from 'src/shared/types/common';
import {
  CancelOrderRequest,
  GatewaySettings,
  HistoryRequest,
  SendOrderRequest,
  SubscribeRequest,
  ClearHandler,
} from 'src/shared/types/broker';
import { Broker } from 'src/broker-manager/broker';
import BinanceLinearBroker from '../binance-linear/binance-linear-broker';
let tradeCount: number = 0;

export class MockBroker extends Broker {
  private market: Broker;
  private activeLimitOrders: Map<string, OrderData> = new Map();
  private limitOrders: Map<string, OrderData> = new Map();

  // TODO
  commissionRate: number = 0.0005;

  constructor() {
    super();

    // this.market = new BinanceLinearBroker();
    // this.market.connect({
    //   apiKey: 'nzadRyiGuHIrLZGHuFeMiyING98FbpZi9127Lf3I8GvMCgMcc70QqZqnVInkFJx7',
    //   apiSecret: 'KgyQpJrZiYkHsKl4Abj0cy6XwN12bAbxQ2jhbYNUAt6cysSpaEg4Eh7Ry1VEwsTM',
    //   server: 'TESTNET',
    //   klineStream: true,
    // })
  }

  public connect(settings: GatewaySettings): Promise<void> {
    return Promise.resolve();
  }
  public stop(): void {
    return;
  }

  public getAllContracts(): ContractData[] {
    return [];
  }

  public getContractByName(name: string): ContractData | undefined {
    return undefined;
  }

  public getContractBySymbol(symbol: string): ContractData | undefined {
    return undefined;
  }

  public queryHistory(req: HistoryRequest): Promise<BarData[]> {
    return Promise.resolve([]);
  }

  public async sendOrder(req: SendOrderRequest): Promise<string> {
    const { orderId, symbol, direction, offset, price, volume } = req;

    const order: OrderData = {
      symbol,
      orderId,
      type: OrderType.LIMIT,
      direction,
      offset,
      price,
      volume,
      avgPrice: 0,
      traded: 0,
      tradePrice: 0,
      tradeVolume: 0,
      status: OrderStatus.NOTTRADED,
      time: new Date(),
      tradeCommission: 0,
    };

    this.activeLimitOrders.set(orderId, order);
    this.limitOrders.set(orderId, order);

    this.emit('order', order);

    return orderId;
  }
  
  public async cancelOrder(req: CancelOrderRequest): Promise<void> {
    const { orderId } = req;

    if (this.activeLimitOrders.has(orderId)) {
      const order = this.activeLimitOrders.get(orderId);
      if (order) {
        order.status = OrderStatus.CANCELLED;
        this.activeLimitOrders.delete(orderId);
        // strategy.handleOrder(order, ctx);
        this.emit('order', order);
      }
    }
    return;
  }

  public watchOrder(watcher: (order: OrderData) => void): ClearHandler {
    this.on('order', watcher);

    return () => {
      this.off('order', watcher);
    }
  }

  public watchTrade(watcher: (trade: TradeData) => void): ClearHandler {
    this.on('trade', watcher);

    return () => {
      this.off('trade', watcher);
    }
  }

  public writeLog(msg: string): void {
    console.log(msg);
  }

  refresh(bar: BarData): void {
    this.crossLimitOrder(bar);
  }
  
  /**
   * 限价单撮合
   */
  private crossLimitOrder(bar: BarData): void {
    let longCrossPrice: number;
    let shortCrossPrice: number;
    let longBestPrice: number;
    let shortBestPrice: number;

    longCrossPrice = bar.low;
    shortCrossPrice = bar.high;
    longBestPrice = bar.open;
    shortBestPrice = bar.open;

    const activeLimitOrders = this.activeLimitOrders;

    for (const [orderId, order] of activeLimitOrders) {
      if (order.symbol !== bar.symbol) {
        continue;
      }

      // 判断是否会成交
      const longCross = 
        (
          (order.direction === Direction.LONG && order.offset === Offset.OPEN) ||
          (order.direction === Direction.SHORT && order.offset === Offset.CLOSE)
        ) &&
        order.price >= longCrossPrice &&
        longCrossPrice > 0;

      const shortCross =
        (
          (order.direction === Direction.SHORT && order.offset === Offset.OPEN) ||
          (order.direction === Direction.LONG && order.offset === Offset.CLOSE)
        ) &&
        order.price <= shortCrossPrice &&
        shortCrossPrice > 0;

      if (!longCross && !shortCross) {
        continue;
      }

      // 计算成交价格
      const tradePrice = longCross
        ? Math.min(order.price, longBestPrice)
        : Math.max(order.price, shortBestPrice);

      // 推送成交数据
      order.avgPrice = tradePrice;
      order.traded = order.volume;
      order.tradePrice = tradePrice;
      order.tradeVolume = order.volume;
      order.status = OrderStatus.ALLTRADED;
      order.tradeCommission = this.calcCommission(tradePrice, order.volume);

      this.emit('order', order);

      this.activeLimitOrders.delete(orderId);

      // 创建成交记录
      const trade: TradeData = {
        symbol: order.symbol,
        orderId: order.orderId,
        tradeId: `${tradeCount}`,
        direction: order.direction,
        offset: order.offset,
        price: tradePrice,
        volume: order.volume,
        time: new Date(bar.timestamp),
        commission: this.calcCommission(tradePrice, order.volume),
      };

      tradeCount++;
      // strategy.trades.push(trade);
      // strategy.handleTrade(trade, ctx);

      this.emit('trade', trade);
    }
  }

  calcCommission(price: number, volume: number): number {
    return price * volume * this.commissionRate;
  }
}
