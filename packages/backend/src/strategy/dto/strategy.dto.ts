import { IsString } from 'class-validator';

export class StrategyDetailDto {
  @IsString()
  name!: string;
}
