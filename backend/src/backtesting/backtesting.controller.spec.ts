import { Test, TestingModule } from '@nestjs/testing';

import { BacktestingController } from './backtesting.controller';
import { BacktestingService } from './backtesting.service';

describe('backtestingController', () => {
  let controller: BacktestingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BacktestingController],
      providers: [BacktestingService],
    }).compile();

    controller = module.get<BacktestingController>(BacktestingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
