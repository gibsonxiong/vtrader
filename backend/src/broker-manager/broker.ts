import { EventEmitter } from 'node:events';
import type {
  CancelOrderRequest,
  BrokerSettings,
  HistoryRequest,
  SendOrderRequest,
  SubscribeRequest,
  ClearHandler,
} from '@vtrader/shared';
import type {
  AccountData,
  BarData,
  ContractData,
  OrderData,
  PositionData,
  TickData,
  TradeData,
} from '@vtrader/shared';

export abstract class Broker extends EventEmitter {
  constructor() {
    super();
  }

  public abstract connect(settings: BrokerSettings): Promise<void>;
  public abstract stop(): void;

  public abstract refresh(bar: BarData): void;

  public abstract getAllContracts(): ContractData[];
  public abstract getContractByName(name: string): ContractData | undefined;
  public abstract getContractBySymbol(symbol: string): ContractData | undefined;
  // public abstract getOrder(orderId: string): OrderData | undefined;

  public abstract queryHistory(req: HistoryRequest): Promise<BarData[]>;
  public abstract sendOrder(req: SendOrderRequest): Promise<string>;
  public abstract cancelOrder(req: CancelOrderRequest): Promise<void>;
  public abstract subscribeBar(req: SubscribeRequest): void;
  public abstract unsubscribeBar(req: SubscribeRequest): void;

  // public abstract onContract(contract: ContractData): void;
  // public abstract onAccount(account: AccountData): void;
  // public abstract onOrder(order: OrderData): void;
  // public abstract onTrade(trade: TradeData): void;
  // public abstract onBar(bar: BarData): void;
  // public abstract onPosition(position: PositionData): void;
  // public abstract onTick(tick: TickData): void;

  public abstract watchBar(watcher: (bar: BarData) => void): void;
  public abstract watchOrder(watcher: (order: OrderData) => void): ClearHandler;
  public abstract watchTrade(watcher: (trade: TradeData) => void): ClearHandler;

  public abstract writeLog(msg: string): void;
}
