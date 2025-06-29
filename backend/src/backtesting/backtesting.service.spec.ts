import { Test, TestingModule } from '@nestjs/testing';

import { BacktestingService } from './backtesting.service';

describe('backtestingService', () => {
  let service: BacktestingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BacktestingService],
    }).compile();

    service = module.get<BacktestingService>(BacktestingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
