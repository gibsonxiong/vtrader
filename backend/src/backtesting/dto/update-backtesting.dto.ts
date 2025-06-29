import { PartialType } from '@nestjs/mapped-types';

import { CreateBacktestingDto } from './create-backtesting.dto';

export class UpdateBacktestingDto extends PartialType(CreateBacktestingDto) {}
