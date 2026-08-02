import { Controller } from '@nestjs/common';

import { Post, Body } from '@nestjs/common';
import { MarketDataService } from './market-data.service';
import type { DownloadParams, GetBarsParams, GetAllContractsParams, SyncContractsParams, BatchDownloadBarsParams, DeleteBarOverviewParams } from '../types/market-data';
import { response } from 'src/utils';

@Controller('market-data')
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  /**
   * 获取所有合约（从文件读取）
   */
  @Post('getContracts')
  async getAllContracts(
    @Body()
    body: GetAllContractsParams
  ) {
    const data = await this.marketDataService.getAllContracts(body);
    return response(data);
  }

  /**
   * 同步合约数据（从broker拉取并保存到文件）
   */
  @Post('syncContracts')
  async syncContracts(
    @Body()
    body: SyncContractsParams
  ) {
    const count = await this.marketDataService.syncContracts(body);
    return response({ count });
  }

  /**
   * 获取K线数据
   */
  @Post('getBars')
  async getBars(
    @Body()
    body: GetBarsParams,
  ) {
    const data = await this.marketDataService.getBars(body);
    return response(data);
  }

  /**
   * 获取所有K线数据概览
   */
  @Post('getBarOverviews')
  async getBarOverviews() {
    const data = await this.marketDataService.getBarOverviews();
    return response(data);
  }

  /**
   * 下载并入库K线数据（异步）
   */
  @Post('download')
  async downloadBars(
    @Body()
    body: DownloadParams,
  ) {
    const data = await this.marketDataService.downloadBarsAsync(body);
    return response(data);
  }

  /**
   * 获取下载任务状态
   */
  @Post('download/status')
  async getDownloadStatus(
    @Body()
    body: { jobId: string },
  ) {
    const data = await this.marketDataService.getDownloadStatus(body.jobId);
    return response(data);
  }

  /**
   * 批量下载并入库K线数据（异步）
   */
  @Post('batchDownload')
  async batchDownloadBars(
    @Body()
    body: BatchDownloadBarsParams,
  ) {
    const data = await this.marketDataService.batchDownloadBarsAsync(body);
    return response(data);
  }

  /**
   * 删除概览记录
   */
  @Post('deleteBarOverview')
  async deleteBarOverview(
    @Body()
    body: DeleteBarOverviewParams,
  ) {
    const data = await this.marketDataService.deleteBarOverview(body);
    return response(data);
  }
}
