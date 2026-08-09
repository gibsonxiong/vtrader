import { Controller } from '@nestjs/common';

import { Post, Body } from '@nestjs/common';
import { MarketDataService } from './market-data.service';
import type { Response } from '../types/common';
import type { BarData, ContractData } from '../types/common';
import type {
  GetAllContractsParams,
  SyncContractsParams,
  GetBarsParams,
  DownloadParams,
  BatchDownloadBarsParams,
  DeleteBarOverviewParams,
  BarOverviewRecord,
} from '../types/market-data';
import { response } from '../utils';
import {
  GetAllContractsDto,
  SyncContractsDto,
  GetBarsDto,
  DownloadDto,
  BatchDownloadDto,
  DeleteBarOverviewDto,
  JobStatusDto,
} from './dto/market-data.dto';

@Controller('market-data')
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  /**
   * 获取所有合约（从文件读取）
   */
  @Post('getContracts')
  async getAllContracts(
    @Body()
    body: GetAllContractsDto,
  ): Promise<Response<ContractData[]>> {
    const data = await this.marketDataService.getAllContracts(body as GetAllContractsParams);
    return response(data);
  }

  /**
   * 同步合约数据（从broker拉取并保存到文件）
   */
  @Post('syncContracts')
  async syncContracts(
    @Body()
    body: SyncContractsDto,
  ): Promise<Response<{ count: number }>> {
    const count = await this.marketDataService.syncContracts(body as SyncContractsParams);
    return response({ count });
  }

  /**
   * 获取K线数据
   */
  @Post('getBars')
  async getBars(
    @Body()
    body: GetBarsDto,
  ): Promise<Response<{ list: BarData[]; total: number }>> {
    const data = await this.marketDataService.getBars(body as GetBarsParams);
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
    body: DownloadDto,
  ): Promise<Response<{ jobId: string; message: string }>> {
    const data = await this.marketDataService.downloadBarsAsync(body as DownloadParams);
    return response(data);
  }

  /**
   * 获取下载任务状态
   */
  @Post('download/status')
  async getDownloadStatus(
    @Body()
    body: JobStatusDto,
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
    body: BatchDownloadDto,
  ): Promise<Response<{ jobId: string; message: string }>> {
    const data = await this.marketDataService.batchDownloadBarsAsync(body as BatchDownloadBarsParams);
    return response(data);
  }

  /**
   * 删除概览记录
   */
  @Post('deleteBarOverview')
  async deleteBarOverview(
    @Body()
    body: DeleteBarOverviewDto,
  ): Promise<Response<DeleteBarOverviewParams>> {
    const data = await this.marketDataService.deleteBarOverview(body as DeleteBarOverviewParams);
    return response(data);
  }
}
