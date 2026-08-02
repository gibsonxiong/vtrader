/**
 * 市场数据下载处理器（沙盒模式）
 * 使用 BullMQ 队列异步处理下载任务
 */

import { SandboxedJob } from 'bullmq';
import dayjs from 'dayjs';
import { PrismaService } from 'src/prisma.service';
import { BrokerManagerService } from 'src/broker-manager/broker-manager.service';
import { BrokerConfigService } from 'src/broker-manager/broker-config.service';
import { MarketDataService } from './market-data.service';
import type { DownloadParams, BatchDownloadBarsParams } from '../types/market-data';
import {
  writeBars,
  writeBarOverview,
} from 'src/utils';

// 进程级单例（只创建一次）
const prisma = new PrismaService();
const brokerConfigService = new BrokerConfigService(prisma);
const brokerManagerService = new BrokerManagerService(brokerConfigService);
// 沙盒模式下不使用队列注入，传 undefined
const marketDataService = new MarketDataService(brokerManagerService, brokerConfigService, undefined);

/**
 * 计算补集（缺失区间）
 */
function sortRanges(ranges: [string, string][]): [dayjs.Dayjs, dayjs.Dayjs][] {
  return ranges
    .map(([s, e]) => [dayjs(s), dayjs(e)] as [dayjs.Dayjs, dayjs.Dayjs])
    .sort((a, b) => a[0].valueOf() - b[0].valueOf());
}

function formatDate(d: dayjs.Dayjs): string {
  return d.format('YYYY-MM-DD');
}

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

/**
 * 计算并集
 */
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

/**
 * 单个下载任务
 */
async function download(job: SandboxedJob<DownloadParams>) {
  const { data: params } = job;
  console.log(`开始处理下载任务 ${job.id}: ${params.symbol} / ${params.interval}`);

  try {
    await job.updateProgress(0);

    // 获取已有数据概览
    const barOverview = await marketDataService.getBarOverview({
      brokerType: params.brokerType,
      symbol: params.symbol,
      interval: params.interval,
    });
    const ranges = (barOverview?.ranges || []) as [string, string][];
    const endDate = params.endDate ?? formatDate(dayjs());

    // 计算缺失区间
    const missingRanges = calculateComplement(ranges, [params.startDate, endDate]);

    if (missingRanges.length === 0) {
      await job.updateProgress(100);
      console.log(`任务 ${job.id}: 数据已是最新，无需下载`);
      return { totalBars: 0, message: '数据已是最新' };
    }

    await job.updateProgress(10);
    console.log(`任务 ${job.id}: 发现 ${missingRanges.length} 个缺失区间`);

    let totalCount = 0;
    let totalBars = barOverview?.count ?? 0;

    // 逐个区间下载
    for (let i = 0; i < missingRanges.length; i++) {
      const [rangeStart, rangeEnd] = missingRanges[i];

      console.log(`任务 ${job.id}: 下载区间 ${i + 1}/${missingRanges.length} [${rangeStart} ~ ${rangeEnd}]`);

      // 从 broker 下载
      const bars = await marketDataService.getBarsFromBroker({
        brokerType: params.brokerType,
        startDate: rangeStart,
        endDate: rangeEnd,
        interval: params.interval,
        symbol: params.symbol,
      });

      // 写入文件
      const { count, total } = await writeBars(
        params.brokerType,
        params.symbol,
        params.interval,
        bars.list,
      );

      totalCount += count;
      totalBars = total;

      // 更新进度 (10% ~ 90%)
      const progress = 10 + Math.round(((i + 1) / missingRanges.length) * 80);
      await job.updateProgress(progress);
    }

    // 更新 barOverview
    const newRanges = calculateUnion(ranges, [params.startDate, endDate]);
    writeBarOverview({
      version: 1,
      brokerType: params.brokerType,
      symbol: params.symbol,
      interval: params.interval,
      ranges: newRanges,
      updatedAt: new Date().toISOString(),
      count: totalBars,
    });

    await job.updateProgress(100);
    console.log(`任务 ${job.id}: 下载完成，共 ${totalCount} 条数据`);

    return { totalBars: totalCount };
  } catch (error) {
    console.error(`任务 ${job.id} 执行失败: ${error.message}`, error.stack);
    throw new Error(`下载失败: ${error.message}`);
  }
}

/**
 * 批量下载任务
 */
async function batchDownload(job: SandboxedJob<BatchDownloadBarsParams>) {
  const { data } = job;
  console.log(`开始处理批量下载任务 ${job.id}`);

  try {
    await job.updateProgress(0);

    // 生成所有 symbol × interval 组合
    const jobs: { symbol: string; interval: string }[] = [];
    for (const symbol of data.symbols) {
      for (const interval of data.intervals) {
        jobs.push({ symbol, interval });
      }
    }

    console.log(`任务 ${job.id}: 共 ${jobs.length} 个下载子任务`);

    const results: { symbol: string; interval: string; totalBars: number }[] = [];
    let totalDownloaded = 0;

    // 逐个执行（避免并发过高）
    for (let i = 0; i < jobs.length; i++) {
      const { symbol, interval } = jobs[i];

      // 创建子任务参数
      const subParams: DownloadParams = {
        brokerType: data.brokerType,
        symbol,
        interval: interval as any,
        startDate: data.startDate,
        endDate: data.endDate,
      };

      // 直接调用下载逻辑
      const barOverview = await marketDataService.getBarOverview({
        brokerType: subParams.brokerType,
        symbol: subParams.symbol,
        interval: subParams.interval,
      });
      const ranges = (barOverview?.ranges || []) as [string, string][];
      const endDate = subParams.endDate ?? formatDate(dayjs());
      const missingRanges = calculateComplement(ranges, [subParams.startDate, endDate]);

      let subTotalBars = 0;

      if (missingRanges.length > 0) {
        for (const [rangeStart, rangeEnd] of missingRanges) {
          const bars = await marketDataService.getBarsFromBroker({
            brokerType: subParams.brokerType,
            startDate: rangeStart,
            endDate: rangeEnd,
            interval: subParams.interval,
            symbol: subParams.symbol,
          });

          const { count, total } = await writeBars(
            subParams.brokerType,
            subParams.symbol,
            subParams.interval,
            bars.list,
          );

          subTotalBars += count;

          // 更新 barOverview
          const newRanges = calculateUnion(ranges, [subParams.startDate, endDate]);
          writeBarOverview({
            version: 1,
            brokerType: subParams.brokerType,
            symbol: subParams.symbol,
            interval: subParams.interval,
            ranges: newRanges,
            updatedAt: new Date().toISOString(),
            count: total,
          });
        }
      }

      totalDownloaded += subTotalBars;
      results.push({ symbol, interval, totalBars: subTotalBars });

      // 更新总进度
      const progress = Math.round(((i + 1) / jobs.length) * 100);
      await job.updateProgress(progress);
    }

    await job.updateProgress(100);
    console.log(`任务 ${job.id}: 批量下载完成，共 ${totalDownloaded} 条数据`);

    return { results, totalBars: totalDownloaded };
  } catch (error) {
    console.error(`任务 ${job.id} 执行失败: ${error.message}`, error.stack);
    throw new Error(`批量下载失败: ${error.message}`);
  }
}

/**
 * 处理器入口
 */
export default async function (job: SandboxedJob<any>) {
  const { name } = job;

  if (name === 'download') {
    return download(job);
  } else if (name === 'batchDownload') {
    return batchDownload(job);
  } else {
    throw new Error(`未知的任务名称: ${name}`);
  }
}
