import type { BarData, OrderData, TradeData } from '../../engine/types/common';
import { Strategy, TechnicalIndicators } from '../strategy';
import type { StrategyEngie } from '../strategy';

/**
 * 双均线策略
 * 参考vnpy的双均线策略实现
 */
export default class DoubleMaStrategy extends Strategy {
  // 策略作者
  public author: string = 'VTrader';

  // 策略变量
  public fastMa: number = 0; // 快速均线值
  public fastMa1: number = 0; // 上一根K线快速均线值
  // 策略参数
  public fastWindow: number = 10; // 快速均线周期

  public fixedSize: number = 1; // 固定手数

  // 策略参数列表
  public parameters: string[] = ['fastWindow', 'slowWindow', 'fixedSize'];
  public slowMa: number = 0; // 慢速均线值
  public slowMa1: number = 0; // 上一根K线慢速均线值
  public slowWindow: number = 20; // 慢速均线周期

  // 策略变量列表
  public variables: string[] = ['fastMa', 'slowMa', 'fastMa1', 'slowMa1'];

  // 数据缓存
  private closeData: number[] = [];

  constructor(engine: StrategyEngie, strategyName: string, vtSymbol: string, setting: any) {
    super(engine, strategyName, vtSymbol, setting);
  }

  /**
   * K线数据更新
   */
  public onBar(bar: BarData): void {
    // 保存上一根K线的均线值
    this.fastMa1 = this.fastMa;
    this.slowMa1 = this.slowMa;

    // 添加新的收盘价
    this.closeData.push(bar.close);

    // 保持数据长度不超过慢速均线周期的2倍
    if (this.closeData.length > this.slowWindow * 2) {
      this.closeData.shift();
    }

    // 计算均线
    if (this.closeData.length >= this.slowWindow) {
      const fastMaArray = TechnicalIndicators.sma(this.closeData, this.fastWindow);
      const slowMaArray = TechnicalIndicators.sma(this.closeData, this.slowWindow);

      this.fastMa = fastMaArray[fastMaArray.length - 1];
      this.slowMa = slowMaArray[slowMaArray.length - 1];

      // 执行交易逻辑
      this.executeTrading(bar);
    }
  }

  /**
   * 策略初始化
   */
  public onInit(): void {
    super.onInit();
    this.writeLog('双均线策略初始化');
    this.writeLog(`快速均线周期: ${this.fastWindow}`);
    this.writeLog(`慢速均线周期: ${this.slowWindow}`);
    this.writeLog(`固定手数: ${this.fixedSize}`);
  }

  /**
   * 委托状态更新
   */
  public onOrder(order: OrderData): void {
    //   this.writeLog(`[委托更新] 订单Id：${order.orderId} 方向：${order.direction} ${order.offset} 价格：${order.price} 数量：${order.volume} 状态：${order.status}`);
  }

  /**
   * 成交信息更新
   */
  public onTrade(trade: TradeData): void {
    this.writeLog(
      `[成交信息] 成交Id：${trade.orderId} 方向：${trade.direction} ${trade.offset} 价格：${trade.price} 数量：${trade.volume}`,
    );
    this.writeLog(`[当前持仓] ${this.pos}`);
  }

  /**
   * 执行交易逻辑
   */
  private executeTrading(bar: BarData): void {
    // 如果均线值无效，不执行交易
    if (!this.fastMa || !this.slowMa || !this.fastMa1 || !this.slowMa1) {
      return;
    }

    // 金叉：快线上穿慢线，买入开仓
    if (this.fastMa > this.slowMa && this.fastMa1 <= this.slowMa1) {
      // 如果当前有空头持仓，先平仓
      if (this.pos < 0) {
        this.cover(bar.close, Math.abs(this.pos));
        this.writeLog('平-空仓');
      }

      // 如果没有多头持仓，开多仓
      else if (this.pos === 0) {
        this.buy(bar.close, this.fixedSize);
        this.writeLog('开-多仓');
      }
    }

    // 死叉：快线下穿慢线，卖出开仓
    else if (this.fastMa < this.slowMa && this.fastMa1 >= this.slowMa1) {
      // 如果当前有多头持仓，先平仓
      if (this.pos > 0) {
        this.sell(bar.close, this.pos);
        this.writeLog('平-多仓');
      }

      // 如果没有空头持仓，开空仓
      else if (this.pos === 0) {
        this.short(bar.close, this.fixedSize);
        this.writeLog('开-空仓');
      }
    }
  }
}
