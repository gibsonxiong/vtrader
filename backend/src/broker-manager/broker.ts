import { EventEmitter } from 'node:events';
import type {
  CancelRequest,
  GatewaySettings,
  HistoryRequest,
  OrderRequest,
  SubscribeRequest,
} from 'src/engine/types/broker';
import type {
  AccountData,
  BarData,
  ContractData,
  OrderData,
  PositionData,
  TickData,
  TradeData,
} from 'src/engine/types/common';

export abstract class Broker extends EventEmitter {
  constructor() {
    super();
  }

  public abstract connect(settings: GatewaySettings): Promise<void>;
  public abstract stop(): void;

  public abstract getContractByName(name: string): ContractData | undefined;
  public abstract getContractBySymbol(symbol: string): ContractData | undefined;
  public abstract getOrder(orderId: string): OrderData | undefined;

  public abstract queryHistory(req: HistoryRequest): Promise<BarData[]>;
  public abstract sendOrder(req: OrderRequest): string;
  public abstract cancelOrder(req: CancelRequest): Promise<void>;
  public abstract subscribe(req: SubscribeRequest): void;

  public abstract onContract(contract: ContractData): void;
  public abstract onAccount(account: AccountData): void;
  public abstract onOrder(order: OrderData): void;
  public abstract onTrade(trade: TradeData): void;
  public abstract onBar(bar: BarData): void;
  public abstract onPosition(position: PositionData): void;
  public abstract onTick(tick: TickData): void;

  public abstract writeLog(msg: string): void;
}
