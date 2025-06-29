import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { BacktestingService } from './backtesting.service';
import { CreateBacktestingDto } from './dto/create-backtesting.dto';
import { UpdateBacktestingDto } from './dto/update-backtesting.dto';

@Controller('backtesting')
export class BacktestingController {
  constructor(private readonly backtestingService: BacktestingService) {}

  @Post()
  create(@Body() createBacktestingDto: CreateBacktestingDto) {
    return this.backtestingService.create(createBacktestingDto);
  }

  @Get()
  findAll() {
    return this.backtestingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.backtestingService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.backtestingService.remove(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBacktestingDto: UpdateBacktestingDto) {
    return this.backtestingService.update(+id, updateBacktestingDto);
  }
}
