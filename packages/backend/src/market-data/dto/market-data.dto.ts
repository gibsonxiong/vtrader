import { IsString, IsIn, IsOptional, IsNumber, IsArray } from 'class-validator';

export class GetAllContractsDto {
  @IsString()
  brokerType!: string;
}

export class SyncContractsDto {
  @IsString()
  brokerType!: string;
}

export class GetBarsDto {
  @IsString()
  brokerType!: string;

  @IsString()
  interval!: string;

  @IsString()
  startDate!: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsString()
  symbol!: string;

  @IsOptional()
  @IsNumber()
  preload?: number;

  @IsIn(['broker', 'db'])
  source!: 'broker' | 'db';

  @IsOptional()
  @IsNumber()
  currentPage?: number;

  @IsOptional()
  @IsNumber()
  pageSize?: number;
}

export class DownloadDto {
  @IsString()
  brokerType!: string;

  @IsString()
  symbol!: string;

  @IsString()
  interval!: string;

  @IsString()
  startDate!: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class BatchDownloadDto {
  @IsString()
  brokerType!: string;

  @IsArray()
  @IsString({ each: true })
  symbols!: string[];

  @IsArray()
  @IsString({ each: true })
  intervals!: string[];

  @IsString()
  startDate!: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class DeleteBarOverviewDto {
  @IsString()
  brokerType!: string;

  @IsString()
  symbol!: string;

  @IsString()
  interval!: string;
}

export class JobStatusDto {
  @IsString()
  jobId!: string;
}
