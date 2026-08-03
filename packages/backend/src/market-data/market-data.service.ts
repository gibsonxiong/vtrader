import type { BarData, ContractData } from '../types/common';

import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import dayjs from 'dayjs';
import { Interval } from '../types/common';
import { BrokerManagerService } from 'src/broker-manager/broker-manager.service';
import { BrokerConfigService } from 'src/broker-manager/broker-config.service';
import { INTERVAL_VT2DAYJS } from '../broker-manager/brokers/binance-linear';
import {
  deleteBarOverviewFiles,
  listBarOverviews,
  readBarOverview,
  readBars,
  readContracts,
  writeBarOverview,
  writeBars,
  writeContracts,
} from 'src/utils';
import type { BrokerType } from 'src/types/broker';
import type { GetAllContractsParams, SyncContractsParams, GetBarsParams, DownloadParams, BatchDownloadBarsParams, DeleteBarOverviewParams, BarOverviewRecord } from '../types/market-data';


function sortRanges(ranges: [string, string][]): [dayjs.Dayjs, dayjs.Dayjs][] {
  return ranges
    .map(([s, e]) => [dayjs(s), dayjs(e)] as [dayjs.Dayjs, dayjs.Dayjs])
    .sort((a, b) => a[0].valueOf() - b[0].valueOf());
}

function formatDate(d: dayjs.Dayjs): string {
  return d.format('YYYY-MM-DD');
}

// 计算补集
function calculateComplement(
  existingIntervals: [string, string][],
  targetInterval: [string, string]
): [string, string][] {
  const end = dayjs(targetInterval[1]);
  let currentStart = dayjs(targetInterval[0]);

  const sorted = sortRanges(existingIntervals);

  const complement: [string, string][] = [];

  for (const [exStart, exEnd] of sorted) {
    if (exEnd.isBefore(currentStart)) continue;
    if (exStart.isAfter(end)) break;

    if (currentStart.isBefore(exStart)) {
      const gapEnd = exStart.subtract(1, 'day');
      const clampedEnd = gapEnd.isAfter(end) ? end : gapEnd;
      if (currentStart.isSame(clampedEnd) || currentStart.isBefore(clampedEnd)) {
        complement.push([
          formatDate(currentStart),
          formatDate(clampedEnd),
        ]);
      }
    }

    const nextStart = exEnd.add(1, 'day');
    if (currentStart.isBefore(nextStart)) currentStart = nextStart;
    if (currentStart.isAfter(end)) break;
  }

  if (currentStart.isSame(end) || currentStart.isBefore(end)) {
    complement.push([
      formatDate(currentStart),
      formatDate(end),
    ]);
  }

  return complement;
}

// 计算并集
function calculateUnion(
  existingIntervals: [string, string][],
  newInterval: [string, string]
): [string, string][] {
  const ranges = [...existingIntervals, newInterval];
  if (ranges.length === 0) return [];

  const sorted = sortRanges(ranges);

  const merged: [string, string][] = [];
  let [start, end] = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const [nextStart, nextEnd] = sorted[i];
    const boundary = end.add(1, 'day');
    if (nextStart.isBefore(boundary) || nextStart.isSame(boundary)) {
      if (nextEnd.isAfter(end)) end = nextEnd;
    } else {
      merged.push([formatDate(start), formatDate(end)]);
      start = nextStart;
      end = nextEnd;
    }
  }

  merged.push([formatDate(start), formatDate(end)]);

  return merged;
}

// // 示例用法
// const existing = [['2025-10-10', '2025-10-18'], ['2025-11-01', '2025-11-28']] as [string, string][];
// const target = ['2025-10-01','2025-10-09'] as [string, string];
// console.log('######1', calculateComplement(existing, target));
// console.log('######2', calculateUnion(existing, target));

@Injectable()
export class MarketDataService {
  constructor(
    private brokerMgr: BrokerManagerService,
    private brokerConfigService: BrokerConfigService,
    @InjectQueue('market-data-download') private readonly downloadQueue?: Queue,
  ) {}

  async getAllContracts(params: GetAllContractsParams): Promise<ContractData[]> {
    const { brokerType } = params;
    return readContracts(brokerType);
  }

  async syncContracts(params: SyncContractsParams): Promise<number> {
    const { brokerType } = params;
    const broker = await this.brokerMgr.getBrokerByType(brokerType as any);
    const contracts = broker.getAllContracts();
    writeContracts(brokerType, contracts);
    return contracts.length;
  }

  getBars(params: GetBarsParams): Promise<{ list: BarData[]; total: number }> {
    if (params.source === 'broker') {
      return this.getBarsFromBroker(params);
    }
    return this.getBarsFromDb(params);
  }

  async getBarsFromBroker(params: Omit<GetBarsParams, 'source'>): Promise<{ list: BarData[]; total: number }> {
    const { brokerType, startDate, endDate, interval, symbol, preload, currentPage, pageSize } = params;
    let startTime = dayjs(startDate).startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const endTime = dayjs(endDate).endOf('day').format('YYYY-MM-DD HH:mm:ss');

    const broker = await this.brokerMgr.getBrokerByType(brokerType);

    if (preload) {
      const [n, unit] = INTERVAL_VT2DAYJS[interval];
      startTime = dayjs(startDate).subtract(preload * n, unit).format('YYYY-MM-DD HH:mm:ss');
    }

    const bars = await broker.queryHistory({
      startDate: startTime,
      endDate: endTime,
      interval,
      symbol,
    });
    const total = bars.length;
    let list = bars;
    if (currentPage && pageSize && currentPage > 0 && pageSize > 0) {
      const skip = (currentPage - 1) * pageSize;
      const end = skip + pageSize;
      list = bars.slice(skip, end);
    }
    return { list, total };
  }

  async getBarsFromDb(params: Omit<GetBarsParams, 'source'>): Promise<{ list: BarData[]; total: number }> {
    const { brokerType, startDate, endDate, interval, symbol, preload, currentPage, pageSize } = params;
    let startTime = dayjs(startDate).startOf('day').valueOf();
    const endTime = dayjs(endDate).endOf('day').valueOf();

    if (!interval) {
      throw new Error(`${interval}周期不能为空！`);
    }

    if (preload) {
      const [n, unit] = INTERVAL_VT2DAYJS[interval];
      startTime = dayjs(startTime).subtract(preload * n, unit).valueOf();
    }

    let bars = await readBars(brokerType, symbol, interval, startTime, endTime);
    const total = bars.length;

    if (currentPage && pageSize && currentPage > 0 && pageSize > 0) {
      const skip = (currentPage - 1) * pageSize;
      const end = skip + pageSize;
      bars = bars.slice(skip, end);
    }

    return {
      list: bars,
      total,
    };
  }

  async getBarOverview(params: {
    brokerType: BrokerType;
    symbol: string;
    interval: Interval;
  }): Promise<BarOverviewRecord | null> {
    const { brokerType, symbol, interval} = params;
    return readBarOverview(brokerType, symbol, interval);
  }

  async getBarOverviews(): Promise<BarOverviewRecord[]> {
    return listBarOverviews();
  }

  async deleteBarOverview(params: DeleteBarOverviewParams): Promise<DeleteBarOverviewParams> {
    const { brokerType, symbol, interval } = params;
    deleteBarOverviewFiles(brokerType, symbol, interval);
    return { brokerType, symbol, interval };
  }

  /**
   * 异步下载K线数据（通过队列）
   */
  async downloadBarsAsync(params: DownloadParams): Promise<{ jobId: string; message: string }> {
    if (!this.downloadQueue) {
      throw new Error('下载队列未初始化');
    }

    const job = await this.downloadQueue.add('download', params, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    return {
      jobId: job.id!,
      message: '下载任务已提交，正在后台处理...',
    };
  }

  /**
   * 同步下载K线数据（直接执行，保留向后兼容）
   */
  async downloadBars(params: DownloadParams): Promise<number> {
    let { endDate } = params;
    const { brokerType, startDate, interval, symbol } = params;

    endDate = endDate ?? formatDate(dayjs());

    const barOverview = await this.getBarOverview({
      brokerType,
      symbol,
      interval,
    });
    const ranges = (barOverview?.ranges || []) as [string, string][];

    // 如果之前下载过的日期就不下了，只下载没下载的
    // 计算需要下载的缺失区间
    const missingRanges = calculateComplement(
      ranges,
      [startDate, endDate]
    );

    // 如果没有需要下载的区间，直接返回 0
    if (missingRanges.length === 0) {
      return 0;
    }

    let totalCount = 0;
    let totalBars = barOverview?.count ?? 0;
    // 逐个区间下载
    for (const [rangeStart, rangeEnd] of missingRanges) {
      const bars = await this.getBarsFromBroker({
        brokerType,
        startDate: rangeStart,
        endDate: rangeEnd,
        interval,
        symbol,
      });

      // 写入文件
      const { count, total } = await writeBars(brokerType, symbol, interval, bars.list);

      totalCount += count;
      totalBars = total;
    }

    // 更新 barOverview
    const newRanges = calculateUnion(
      ranges,
      [startDate, endDate]
    );

    writeBarOverview({
      version: 1,
      brokerType,
      symbol,
      interval,
      ranges: newRanges,
      updatedAt: new Date().toISOString(),
      count: totalBars,
    });

    return totalCount;
  }

  /**
   * 异步批量下载K线数据（通过队列）
   */
  async batchDownloadBarsAsync(params: BatchDownloadBarsParams): Promise<{ jobId: string; message: string }> {
    if (!this.downloadQueue) {
      throw new Error('下载队列未初始化');
    }

    const job = await this.downloadQueue.add('batchDownload', params, {
      attempts: 1,
    });

    return {
      jobId: job.id!,
      message: '批量下载任务已提交，正在后台处理...',
    };
  }

  /**
   * 同步批量下载K线数据（直接执行，保留向后兼容）
   */
  async batchDownloadBars(params: BatchDownloadBarsParams): Promise<number> {
    const { brokerType, startDate, endDate, intervals, symbols } = params;

    // 组合遍历
    let allCount = 0;
    for (const symbol of symbols) {
      for (const interval of intervals) {
        const count = await this.downloadBars({
          brokerType,
          startDate,
          endDate,
          interval,
          symbol,
        });
        allCount += count;
      }
    }

    return allCount;
  }

  /**
   * 获取下载任务状态
   */
  async getDownloadStatus(jobId: string) {
    if (!this.downloadQueue) {
      throw new Error('下载队列未初始化');
    }

    const job = await this.downloadQueue.getJob(jobId);

    if (!job) {
      return { status: 'unkown', failedReason: '任务不存在' };
    }

    const state = await job.getState();
    const progress = job.progress;

    return {
      status: state,
      progress,
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason,
    };
  }
}
