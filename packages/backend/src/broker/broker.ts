import { EventEmitter } from 'node:events';
import type {
  BrokerSettings,
  CancelOrderRequest,
  HistoryRequest,
  SendOrderRequest,
  SubscribeRequest,
  ClearHandler,
  BrokerType,
} from '../types/broker';
import type {
  BarData,
  ContractData,
  OrderData,
  TradeData,
} from '../types/common';

export abstract class Broker extends EventEmitter {
  constructor() {
    super();
  }

  public abstract timeOffset: number;

  public abstract getBrokerType(): BrokerType;
  public abstract stop(): void;

  private apiKey: string = '';
  private apiSecret: string = '';

  public setCredentials(settings: BrokerSettings): void {
    this.apiKey = settings.apiKey;
    this.apiSecret = settings.apiSecret;
  }

  public getCredentials(): BrokerSettings {
    return { apiKey: this.apiKey, apiSecret: this.apiSecret };
  }

  public abstract refresh(bar: BarData): void;

  public abstract getAllContracts(): Promise<ContractData[]>;
  public abstract getContractByName(name: string): ContractData | undefined;
  public abstract getContractBySymbol(symbol: string): ContractData | undefined;
  // public abstract getOrder(orderId: string): OrderData | undefined;

  public abstract queryHistory(req: HistoryRequest): Promise<BarData[]>;
  public abstract sendOrder(req: SendOrderRequest): Promise<string>;
  public abstract cancelOrder(req: CancelOrderRequest): Promise<void>;
  public abstract subscribeBar(req: SubscribeRequest): Promise<void>;
  public abstract unsubscribeBar(req: SubscribeRequest): Promise<void>;

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
