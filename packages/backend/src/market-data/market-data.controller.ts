import { Controller } from '@nestjs/common';

import { Post, Body } from '@nestjs/common';
import { MarketDataService } from './market-data.service';
import type { Response } from 'src/types/common';
import type { BarData, ContractData } from '../types/common';
import type { DownloadParams, GetBarsParams, GetAllContractsParams, SyncContractsParams, BatchDownloadBarsParams, DeleteBarOverviewParams, BarOverviewRecord } from '../types/market-data';
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
  ): Promise<Response<ContractData[]>> {
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
  ): Promise<Response<{ count: number }>> {
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
  ): Promise<Response<{ list: BarData[]; total: number }>> {
    const data = await this.marketDataService.getBars(body);
    return response(data);
  }

  /**
   * 获取所有K线数据概览
   */
  @Post('getBarOverviews')
  async getBarOverviews(): Promise<Response<BarOverviewRecord[]>> {
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
  ): Promise<Response<{ jobId: string; message: string }>> {
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
  ): Promise<Response<{
    status: string;
    progress?: unknown;
    data?: unknown;
    result?: unknown;
    failedReason?: string;
  }>> {
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
  ): Promise<Response<{ jobId: string; message: string }>> {
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
  ): Promise<Response<DeleteBarOverviewParams>> {
    const data = await this.marketDataService.deleteBarOverview(body);
    return response(data);
  }
}
