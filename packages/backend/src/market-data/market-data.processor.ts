/**
 * 市场数据下载处理器（沙盒模式）
 * 使用 BullMQ 队列异步处理下载任务
 */

import { SandboxedJob, Queue, QueueEvents, Job } from 'bullmq';
import dayjs from 'dayjs';
import { getORM } from 'src/database/get-orm';
import { Broker } from 'src/entities/broker.entity';
import { BrokerService } from 'src/broker/broker.service';
import { BrokerManagerService } from 'src/broker/broker-manager.service';
import { MarketDataService } from './market-data.service';
import type { DownloadParams, BatchDownloadBarsParams } from '../types/market-data';
import type { Interval } from '../types/common';
import {
  writeBars,
  writeBarOverview,
} from 'src/utils';

// 进程级单例（只创建一次）
let services: {
  brokerService: BrokerService;
  brokerManagerService: BrokerManagerService;
  marketDataService: MarketDataService;
} | null = null;

async function getServices() {
  if (services) return services;
  const orm = await getORM();
  const em = orm.em;
  const brokerService = new BrokerService(em, em.getRepository(Broker));
  await brokerService.refreshCache();
  const brokerManagerService = new BrokerManagerService(brokerService);
  const marketDataService = new MarketDataService(brokerManagerService, brokerService, undefined);
  services = { brokerService, brokerManagerService, marketDataService };
  return services;
}

// Redis 连接配置（与 app.module.ts 中 BullModule.forRoot 保持一致）
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

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

  const { marketDataService } = await getServices();

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
 * 批量下载任务（异步并发模式）
 *
 * 将每个 symbol × interval 组合拆成独立的 `download` 作业入队，
 * 利用队列的并发能力（DOWNLOAD_WORKERS）并行执行。
 * 支持部分成功/失败的结果聚合。
 */
async function batchDownload(job: SandboxedJob<BatchDownloadBarsParams>) {
  const { data } = job;
  const { marketDataService } = await getServices();
  const combinations = generateCombinations(data.symbols, data.intervals);
  console.log(
    `[批量下载 ${job.id}] 开始, ${data.symbols.length} symbols × ${data.intervals.length} intervals = ${combinations.length} 个子任务`,
  );

  const queueName = 'market-data-download';
  const queue = new Queue(queueName, { connection });
  const queueEvents = new QueueEvents(queueName, { connection });

  try {
    await job.updateProgress(0);

    // 1. 将每个组合作为独立 download 作业入队
    const subJobs: { job: Job; symbol: string; interval: Interval }[] = [];
    for (const { symbol, interval } of combinations) {
      const subJob = await queue.add(
        'download',
        {
          brokerType: data.brokerType,
          symbol,
          interval,
          startDate: data.startDate,
          endDate: data.endDate,
        },
        {
          // 确定性 jobId（BullMQ 不允许 `:`，需 sanitize）
          jobId: `batch-${job.id}-${sanitizeJobId(symbol)}-${sanitizeJobId(interval)}`,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      );
      subJobs.push({ job: subJob, symbol, interval });
    }

    console.log(`[批量下载 ${job.id}] ${subJobs.length} 个子任务已入队，等待执行...`);

    // 2. 并发等待所有子任务完成
    type SubResult = {
      symbol: string;
      interval: string;
      status: 'success' | 'failed';
      totalBars: number;
      error?: string;
    };

    const results: SubResult[] = [];
    let completed = 0;
    const total = subJobs.length;

    await Promise.all(
      subJobs.map(async ({ job: subJob, symbol, interval }) => {
        try {
          const result = await subJob.waitUntilFinished(queueEvents);
          results.push({
            symbol,
            interval,
            status: 'success',
            totalBars: result?.totalBars ?? 0,
          });
        } catch (err: any) {
          results.push({
            symbol,
            interval,
            status: 'failed',
            totalBars: 0,
            error: err.message,
          });
        }
        completed++;
        await job.updateProgress(Math.round((completed / total) * 100));
      }),
    );

    // 3. 聚合统计
    const successResults = results.filter((r) => r.status === 'success');
    const failedResults = results.filter((r) => r.status === 'failed');
    const totalBars = successResults.reduce((sum, r) => sum + r.totalBars, 0);

    await job.updateProgress(100);
    console.log(
      `[批量下载 ${job.id}] 完成, 成功 ${successResults.length}/${total}, ` +
        `失败 ${failedResults.length}/${total}, 共 ${totalBars} 条数据`,
    );

    return {
      results: successResults,
      errors: failedResults.length > 0 ? failedResults : undefined,
      totalBars,
      totalSuccess: successResults.length,
      totalFailed: failedResults.length,
    };
  } finally {
    await queueEvents.close();
    await queue.close();
  }
}

/** 生成 symbol × interval 笛卡尔积 */
function generateCombinations(
  symbols: string[],
  intervals: Interval[],
): { symbol: string; interval: Interval }[] {
  const combos: { symbol: string; interval: Interval }[] = [];
  for (const symbol of symbols) {
    for (const interval of intervals) {
      combos.push({ symbol, interval });
    }
  }
  return combos;
}

/** BullMQ jobId 不允许包含 `:`，替换为 `_` */
function sanitizeJobId(str: string): string {
  return str.replace(/:/g, '_');
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
