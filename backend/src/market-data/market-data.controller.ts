import { Controller } from '@nestjs/common';

import { Get, Query, Post, Body } from '@nestjs/common';
import { MarketDataService, type DownloadParams, type GetBarsParams } from './market-data.service';
import { Interval } from '@vtrader/shared';

@Controller('market-data')
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  /**
   * 获取所有合约
   */
  @Post('getContracts')
  async getAllContracts() {
    return this.marketDataService.getAllContracts();
  }

  /**
   * 获取K线数据
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
   */
  @Post('download')
  async downloadBars(
    @Body()
    body: DownloadParams,
  ) {
    const { symbol, interval, startDate, endDate } = body;


    const count = await this.marketDataService.downloadBars({
      symbol,
      interval,
      startDate,
      endDate,
    });

    return { count };
  }
}
