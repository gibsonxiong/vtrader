import { Controller } from '@nestjs/common';

import { Get, Query, Post, Body } from '@nestjs/common';
import { MarketDataService, type DownloadParams, type GetBarsParams, type GetAllContractsParams, type BatchDownloadBarsParams, type DeleteBarOverviewParams } from './market-data.service';
import { Interval } from '@vtrader/shared';

@Controller('market-data')
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  /**
   * 获取所有合约
   */
  @Post('getContracts')
  async getAllContracts(
    @Body()
    body: GetAllContractsParams
  ) {
    return this.marketDataService.getAllContracts(body);
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
   * 获取所有K线数据概览
   */
  @Post('getBarOverviews')
  async getBarOverviews() {
    return this.marketDataService.getBarOverviews();
  }

  /**
   * 下载并入库K线数据
   */
  @Post('download')
  async downloadBars(
    @Body()
    body: DownloadParams,
  ) {
    const count = await this.marketDataService.downloadBars(body);

    return { count };
  }

  /**
   * 批量下载并入库K线数据
   */
  @Post('batchDownload')
  async batchDownloadBars(
    @Body()
    body: BatchDownloadBarsParams,
  ) {
    const count = await this.marketDataService.batchDownloadBars(body);

    return { count };
  }

  /**
   * 删除概览记录
   */
  @Post('deleteBarOverview')
  async deleteBarOverview(
    @Body()
    body: DeleteBarOverviewParams,
  ) {
    return this.marketDataService.deleteBarOverview(body);
  }
}
