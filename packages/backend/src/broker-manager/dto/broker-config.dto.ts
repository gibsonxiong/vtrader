import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateBrokerDto {
  @IsString()
  name!: string;

  @IsString()
  brokerType!: string;

  @IsString()
  apiKey!: string;

  @IsString()
  apiSecret!: string;

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}

export class UpdateBrokerDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;
}

export class RemoveBrokerDto {
  @IsString()
  id!: string;
}
