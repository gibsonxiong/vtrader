import { Controller } from '@nestjs/common';

import { Get, Query, Post, Body } from '@nestjs/common';
import { MarketDataService, type GetBarsParams } from './market-data.service';
import { Interval } from '@vtrader/shared';

@Controller('market-data')
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  /**
   * 获取所有合约
   * GET /market-data/contracts
   */
  @Post('getContracts')
  async getAllContracts() {
    return this.marketDataService.getAllContracts();
  }

  /**
   * 获取K线数据
   * GET /market-data/bars?symbol=BTCUSDT:USDT&interval=1m&start=2024-01-01&end=2024-02-01&preload=100
   */
  @Post('getBars')
  async getBars(
    @Body()
    body: GetBarsParams,
  ) {
    return this.marketDataService.getBars(body);
  }

  /**
   * 下载并入库K线数据
   * POST /market-data/download
   * body: { symbol, interval, start, end? }
   */
  @Post('download')
  async downloadBars(
    @Body()
    body: {
      symbol: string;
      interval: string; // 将在运行时转换为 Interval
      start: string;
      end?: string;
    },
  ) {
    const { symbol, interval, start, end } = body;

    if (!symbol || !interval || !start) {
      throw new Error('symbol, interval, start 为必填参数');
    }

    const intervalTyped = interval as Interval;

    const count = await this.marketDataService.downloadBars({
      symbol,
      interval: intervalTyped,
      start,
      end,
    });

    return { count };
  }
}
