import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';

import { BacktestingService } from './backtesting.service';
import { CreateBacktestingDto } from './dto/create-backtesting.dto';
import { UpdateBacktestingDto } from './dto/update-backtesting.dto';

@Controller('backtesting')
export class BacktestingController {
  constructor(private readonly backtestingService: BacktestingService) {}

  @Post()
  create(
    @Body() createBacktestingDto: CreateBacktestingDto
  ) {
    return this.backtestingService.create({
      data: createBacktestingDto
    });
  }

  @Get()
  findMany() {
    return this.backtestingService.findMany();
  }

  @Get(':id')
  find(
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.backtestingService.find({
      where: { id }
    });
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.backtestingService.remove({
      where: {id}
    });
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBacktestingDto: UpdateBacktestingDto
  ) {
    return this.backtestingService.update({
      where: {id},
      data: updateBacktestingDto,
    });
  }
}
