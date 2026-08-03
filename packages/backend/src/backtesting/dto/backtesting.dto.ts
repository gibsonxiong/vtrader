import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator';
import type { BrokerType } from 'src/types/broker';
import type { Interval } from 'src/types/common';

export class CreateBacktestingDto {
  @IsString()
  brokerType!: BrokerType;

  @IsString()
  startDate!: string;

  @IsString()
  endDate!: string;

  @IsString()
  symbol!: string;

  @IsString()
  interval!: Interval;

  @IsNumber()
  commissionRate!: number;

  @IsNumber()
  assetBalance!: number;

  @IsString()
  assetName!: string;

  @IsString()
  strategyName!: string;

  @IsOptional()
  @IsObject()
  strategySetting?: Record<string, any>;
}

export class QueryBacktestingDto {
  @IsNumber()
  id!: number;
}

export class QueryManyBacktestingDto {
  @IsOptional()
  @IsObject()
  where?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  skip?: number;

  @IsOptional()
  @IsNumber()
  take?: number;

  @IsOptional()
  @IsObject()
  orderBy?: Record<string, any>;
}

export class RemoveBacktestingDto {
  @IsNumber()
  id!: number;
}

export class JobStatusDto {
  @IsString()
  jobId!: string;
}
