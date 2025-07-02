import fs from 'node:fs';

import { BarData, TickData } from './backtesting-engine';

/**
 * 数据源类型
 */
export enum DataSourceType {
  API = 'api',
  CSV = 'csv',
  DATABASE = 'database',
}

/**
 * 数据加载配置
 */
export interface DataLoadConfig {
  endDate: Date;
  fields?: string[]; // 字段映射
  interval: string; // '1m', '5m', '15m', '30m', '1h', '4h', '1d'
  sourcePath?: string; // CSV文件路径或API端点
  sourceType: DataSourceType;
  startDate: Date;
  symbol: string;
}

/**
 * CSV数据格式配置
 */
export interface CsvConfig {
  columns: {
    close: number;
    datetime: number;
    high: number;
    low: number;
    open: number;
    volume: number;
  };
  dateFormat: string;
  delimiter: string;
  hasHeader: boolean;
}

/**
 * 数据加载器基类
 */
export abstract class DataLoader {
  protected config: DataLoadConfig;

  constructor(config: DataLoadConfig) {
    this.config = config;
  }

  /**
   * 加载K线数据
   */
  public abstract loadBars(): Promise<BarData[]>;

  /**
   * 加载Tick数据
   */
  public abstract loadTicks(): Promise<TickData[]>;

  /**
   * 数据排序
   */
  protected sortData(data: BarData[]): BarData[] {
    return data.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
  }

  /**
   * 验证数据完整性
   */
  protected validateData(data: BarData[]): boolean {
    if (!data || data.length === 0) {
      console.warn('数据为空');
      return false;
    }

    // 检查数据字段完整性
    for (const bar of data) {
      if (
        !bar.datetime ||
        !bar.openPrice ||
        !bar.highPrice ||
        !bar.lowPrice ||
        !bar.closePrice ||
        !bar.volume
      ) {
        console.warn('数据字段不完整:', bar);
        return false;
      }

      // 检查价格逻辑
      if (
        bar.highPrice < bar.lowPrice ||
        bar.openPrice < 0 ||
        bar.closePrice < 0 ||
        bar.volume < 0
      ) {
        console.warn('数据逻辑错误:', bar);
        return false;
      }
    }

    return true;
  }
}

/**
 * CSV数据加载器
 */
export class CsvDataLoader extends DataLoader {
  private csvConfig: CsvConfig;

  constructor(config: DataLoadConfig, csvConfig?: CsvConfig) {
    super(config);

    // 默认CSV配置
    this.csvConfig = csvConfig || {
      delimiter: ',',
      hasHeader: true,
      dateFormat: 'YYYY-MM-DD HH:mm:ss',
      columns: {
        datetime: 0,
        open: 1,
        high: 2,
        low: 3,
        close: 4,
        volume: 5,
      },
    };
  }

  /**
   * 加载K线数据
   */
  public async loadBars(): Promise<BarData[]> {
    if (!this.config.sourcePath) {
      throw new Error('CSV文件路径未指定');
    }

    try {
      // const fs = require('node:fs');
      // const path = require('node:path');

      // 检查文件是否存在
      if (!fs.existsSync(this.config.sourcePath)) {
        throw new Error(`CSV文件不存在: ${this.config.sourcePath}`);
      }

      // 读取文件内容
      const content = fs.readFileSync(this.config.sourcePath, 'utf8');
      const lines = content.split('\n').filter((line) => line.trim());

      // 跳过标题行
      const dataLines = this.csvConfig.hasHeader ? lines.slice(1) : lines;

      const bars: BarData[] = [];

      for (const line of dataLines) {
        const fields = line.split(this.csvConfig.delimiter);

        if (fields.length < 6) {
          console.warn('CSV行数据不完整:', line);
          continue;
        }

        try {
          const bar: BarData = {
            symbol: this.config.symbol,
            datetime: this.parseDateTime(fields[this.csvConfig.columns.datetime]),
            interval: this.config.interval,
            volume: Number.parseFloat(fields[this.csvConfig.columns.volume]),
            openPrice: Number.parseFloat(fields[this.csvConfig.columns.open]),
            highPrice: Number.parseFloat(fields[this.csvConfig.columns.high]),
            lowPrice: Number.parseFloat(fields[this.csvConfig.columns.low]),
            closePrice: Number.parseFloat(fields[this.csvConfig.columns.close]),
          };

          // 过滤日期范围
          if (bar.datetime >= this.config.startDate && bar.datetime <= this.config.endDate) {
            bars.push(bar);
          }
        } catch (error) {
          console.warn('解析CSV行失败:', line, error);
        }
      }

      // 验证和排序数据
      if (!this.validateData(bars)) {
        throw new Error('数据验证失败');
      }

      const sortedBars = this.sortData(bars);
      console.log(`成功加载 ${sortedBars.length} 条K线数据`);

      return sortedBars;
    } catch (error) {
      console.error('加载CSV数据失败:', error);
      throw error;
    }
  }

  /**
   * 加载Tick数据
   */
  public async loadTicks(): Promise<TickData[]> {
    // CSV Tick数据加载实现
    throw new Error('CSV Tick数据加载暂未实现');
  }

  /**
   * 解析日期时间
   */
  private parseDateTime(dateStr: string): Date {
    // 支持多种日期格式
    const formats = [
      /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/, // YYYY-MM-DD HH:mm:ss
      /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
      /^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/, // YYYY/MM/DD HH:mm:ss
      /^(\d{4})\/(\d{2})\/(\d{2})$/, // YYYY/MM/DD
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        const year = Number.parseInt(match[1]);
        const month = Number.parseInt(match[2]) - 1; // JavaScript月份从0开始
        const day = Number.parseInt(match[3]);
        const hour = match[4] ? Number.parseInt(match[4]) : 0;
        const minute = match[5] ? Number.parseInt(match[5]) : 0;
        const second = match[6] ? Number.parseInt(match[6]) : 0;

        return new Date(year, month, day, hour, minute, second);
      }
    }

    // 如果都不匹配，尝试直接解析
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      throw new TypeError(`无法解析日期: ${dateStr}`);
    }

    return date;
  }
}

/**
 * 数据库数据加载器
 */
export class DatabaseDataLoader extends DataLoader {
  private connectionString: string;

  constructor(config: DataLoadConfig, connectionString: string) {
    super(config);
    this.connectionString = connectionString;
  }

  /**
   * 加载K线数据
   */
  public async loadBars(): Promise<BarData[]> {
    // 这里应该连接到实际的数据库
    // 示例使用Prisma或其他ORM

    try {
      // 示例SQL查询
      const query = `
        SELECT 
          symbol,
          datetime,
          interval_type as interval,
          open_price as openPrice,
          high_price as highPrice,
          low_price as lowPrice,
          close_price as closePrice,
          volume
        FROM market_data 
        WHERE symbol = ? 
          AND datetime >= ? 
          AND datetime <= ?
          AND interval_type = ?
        ORDER BY datetime ASC
      `;

      // 这里需要实际的数据库连接实现
      console.log('数据库查询:', query);
      console.log('参数:', [
        this.config.symbol,
        this.config.startDate,
        this.config.endDate,
        this.config.interval,
      ]);

      // 模拟返回空数据
      return [];
    } catch (error) {
      console.error('数据库查询失败:', error);
      throw error;
    }
  }

  /**
   * 加载Tick数据
   */
  public async loadTicks(): Promise<TickData[]> {
    // 数据库Tick数据加载实现
    throw new Error('数据库Tick数据加载暂未实现');
  }
}

/**
 * API数据加载器
 */
export class ApiDataLoader extends DataLoader {
  private apiKey?: string;
  private baseUrl: string;

  constructor(config: DataLoadConfig, baseUrl: string, apiKey?: string) {
    super(config);
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * 加载K线数据
   */
  public async loadBars(): Promise<BarData[]> {
    try {
      const url = this.buildApiUrl();
      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers.Authorization = `Bearer ${this.apiKey}`;
      }

      console.log('API请求:', url);

      // 这里需要实际的HTTP请求实现
      // const response = await fetch(url, { headers });
      // const data = await response.json();

      // 模拟返回空数据
      return [];
    } catch (error) {
      console.error('API请求失败:', error);
      throw error;
    }
  }

  /**
   * 加载Tick数据
   */
  public async loadTicks(): Promise<TickData[]> {
    // API Tick数据加载实现
    throw new Error('API Tick数据加载暂未实现');
  }

  /**
   * 构建API URL
   */
  private buildApiUrl(): string {
    const params = new URLSearchParams({
      symbol: this.config.symbol,
      start: this.config.startDate.toISOString(),
      end: this.config.endDate.toISOString(),
      interval: this.config.interval,
    });

    return `${this.baseUrl}?${params.toString()}`;
  }
}

/**
 * 数据加载器工厂
 */
export const DataLoaderFactory = {
  /**
   * 创建数据加载器
   */
  createLoader(config: DataLoadConfig, options?: any): DataLoader {
    switch (config.sourceType) {
      case DataSourceType.API: {
        if (!options?.baseUrl) {
          throw new Error('API基础URL未提供');
        }
        return new ApiDataLoader(config, options.baseUrl, options?.apiKey);
      }

      case DataSourceType.CSV: {
        return new CsvDataLoader(config, options?.csvConfig);
      }

      case DataSourceType.DATABASE: {
        if (!options?.connectionString) {
          throw new Error('数据库连接字符串未提供');
        }
        return new DatabaseDataLoader(config, options.connectionString);
      }

      default: {
        throw new Error(`不支持的数据源类型: ${config.sourceType}`);
      }
    }
  },
};

/**
 * 示例数据生成器（用于测试）
 */
export class MockDataGenerator {
  /**
   * 生成模拟K线数据
   */
  static generateBars(
    symbol: string,
    startDate: Date,
    endDate: Date,
    interval: string,
    initialPrice: number = 100,
  ): BarData[] {
    const bars: BarData[] = [];
    const intervalMs = this.getIntervalMs(interval);

    let currentTime = new Date(startDate);
    let currentPrice = initialPrice;

    while (currentTime <= endDate) {
      // 生成随机价格变动
      const change = (Math.random() - 0.5) * 2; // -1 到 1 的随机变动
      const openPrice = currentPrice;
      const closePrice = openPrice + change;

      // 生成高低价
      const highPrice = Math.max(openPrice, closePrice) + Math.random();
      const lowPrice = Math.min(openPrice, closePrice) - Math.random();

      // 生成成交量
      const volume = Math.floor(Math.random() * 10_000) + 1000;

      const bar: BarData = {
        symbol,
        datetime: new Date(currentTime),
        interval,
        volume,
        openPrice,
        highPrice,
        lowPrice,
        closePrice,
      };

      bars.push(bar);

      // 更新当前价格和时间
      currentPrice = closePrice;
      currentTime = new Date(currentTime.getTime() + intervalMs);
    }

    return bars;
  }

  /**
   * 获取时间间隔的毫秒数
   */
  private static getIntervalMs(interval: string): number {
    const intervalMap: { [key: string]: number } = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
    };

    return intervalMap[interval] || 60 * 1000; // 默认1分钟
  }
}
