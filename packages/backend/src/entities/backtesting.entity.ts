import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import type { TradeData } from '../types/common';
import type { BacktestingModel } from '../types/backtesting';

@Entity({ tableName: 'backtesting' })
export class Backtesting implements BacktestingModel {
  @PrimaryKey({ type: 'int', autoincrement: true })
  id!: number;

  @Property({ type: 'varchar', length: 255, fieldName: 'brokerId' })
  brokerId!: string;

  @Property({ type: 'varchar', length: 255, fieldName: 'strategyName' })
  strategyName!: string;

  @Property({ type: 'varchar', length: 50 })
  symbol!: string;

  @Property({ type: 'varchar', length: 20 })
  interval!: string;

  @Property({ type: 'varchar', length: 20, fieldName: 'startDate' })
  startDate!: string;

  @Property({ type: 'varchar', length: 20, fieldName: 'endDate' })
  endDate!: string;

  @Property({ type: 'decimal', precision: 30, scale: 8, fieldName: 'startBalance' })
  startBalance!: string;

  @Property({ type: 'decimal', precision: 30, scale: 8, fieldName: 'endBalance' })
  endBalance!: string;

  @Property({ type: 'decimal', precision: 30, scale: 8, fieldName: 'maxDrawdown' })
  maxDrawdown!: string;

  @Property({ type: 'decimal', precision: 30, scale: 8, fieldName: 'maxDrawdownPercent' })
  maxDrawdownPercent!: string;

  @Property({ type: 'decimal', precision: 30, scale: 8, fieldName: 'totalNetPnl' })
  totalNetPnl!: string;

  @Property({ type: 'decimal', precision: 30, scale: 8, fieldName: 'totalReturnPercent' })
  totalReturnPercent!: string;

  @Property({ type: 'json', fieldName: 'dailyResults' })
  dailyResults!: object;

  @Property({ type: 'json' })
  trades!: TradeData[];

  @Property({ type: 'datetime', defaultRaw: 'now()', fieldName: 'createdAt' })
  createdAt = new Date();
}
