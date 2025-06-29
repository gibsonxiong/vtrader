import { Injectable } from '@nestjs/common';

import { CreateBacktestingDto } from './dto/create-backtesting.dto';
import { UpdateBacktestingDto } from './dto/update-backtesting.dto';

@Injectable()
export class BacktestingService {
  create(createBacktestingDto: CreateBacktestingDto) {
    return 'This action adds a new backtesting';
  }

  findAll() {
    return `This action returns all backtesting`;
  }

  findOne(id: number) {
    return `This action returns a #${id} backtesting`;
  }

  remove(id: number) {
    return `This action removes a #${id} backtesting`;
  }

  update(id: number, updateBacktestingDto: UpdateBacktestingDto) {
    return `This action updates a #${id} backtesting`;
  }
}
