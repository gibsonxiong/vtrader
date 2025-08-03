import { Direction, Interval, Offset, OrderStatus } from '../../types/common';
import type { BarData, OrderData, TradeData } from '../../types/common';
import { Strategy, param } from '../strategy';
import { ArrayManger } from '../array-manager';
import * as talib from 'technicalindicators';
import { BarGenerator } from '../bar-generator';
import { Context } from '../context';

let gridId = 0;

function genId(): number {
  return gridId++;
}

class GridItem {
  id: number;
  symbol: string;
  price: number;
  exitPrice: number;
  pos: number = 0;
  orderId: string = '';

  constructor(symbol: string, price: number, exitPrice: number) {
    this.id = genId();
    this.symbol = symbol;
    this.price = price;
    this.exitPrice = exitPrice;
  }
}

/**
 * 网格策略
 * 基于RSI、TEMA和布林带的网格交易策略
 */
export default class GridStrategy extends Strategy {
  // 入场参数
  @param({ type: Number, default: 14 })
  rsiLength!: number;

  @param({ type: Number, default: 25 })
  rsiDown!: number;

  @param({ type: Number, default: 75 })
  rsiUp!: number;

  @param({ type: Number, default: 9 })
  temaLength!: number;

  @param({ type: Number, default: 20 })
  bbLength!: number;

  @param({ type: Number, default: 2 })
  bbDev!: number;

  // 网格参数
  @param({ type: Number, default: 0.015 })
  gridStep!: number;

  @param({ type: Number, default: 80 })
  gridSize!: number;

  @param({ type: Number, default: 100000 })
  gridCapital!: number;

  @param({ type: Number, default: 0.001 })
  minVolume!: number;

  @param({ type: Number, default: 20 })
  basePosCount!: number;

  @param({ type: Boolean, default: true })
  useAdjustGrid!: boolean;

  // 状态变量
  private rsiValue: number = 0;
  private temaValue: number = 0;
  private lastTemaValue: number = 0;
  private bbMid: number = 0;
  private lastRsiValue: number = 0;
  private last2RsiValue: number = 0;

  private longGrid: GridItem[] = [];
  private shortGrid: GridItem[] = [];
  private longCount: number = 0;
  private shortCount: number = 0;
  private longRemoveOrderId: string = '';
  private shortRemoveOrderId: string = '';

  private enterLong: boolean = false;
  private enterShort: boolean = false;

  private bg?: BarGenerator;
  private am?: ArrayManger;

  preloadCount(): number {
    return Math.max(this.rsiLength, this.temaLength, this.bbLength) + 10;
  }

  amLength(): number {
    return Math.max(this.rsiLength, this.temaLength, this.bbLength) + 10;
  }

  /**
   * 策略初始化
   */
  public onInit(): void {
    this.writeLog('网格策略初始化');
    this.longCount = 0;
    this.shortCount = 0;
    this.longGrid = [];
    this.shortGrid = [];
    this.longRemoveOrderId = '';
    this.shortRemoveOrderId = '';
    
    // 初始化数组管理器和K线生成器
    this.am = new ArrayManger(50);
    this.bg = new BarGenerator({
      interval: Interval.HOUR_2,
      callback: (bar: BarData) => {
      }
    });
  }

  /**
   * 订单状态更新
   */
  public onOrder(order: OrderData, ctx: Context): void {
    if (order.status === OrderStatus.NOTTRADED) return;
    
    const action = order.offset === Offset.OPEN ? '开' : '平';
    const direction = order.direction === Direction.LONG ? '多' : '空';
    this.writeLog(`[${action}${direction}${order.symbol}] 价格：${order.price} 数量：${order.volume} 订单[${order.orderId}]：${order.status}`);
  }

  /**
   * 成交回报处理
   */
  public onTrade(trade: TradeData, ctx: Context): void {
    const orderId = trade.orderId;

    // 处理移除网格的订单
    if (orderId === this.longRemoveOrderId) {
      this.longRemoveOrderId = '';
      return;
    }
    if (orderId === this.shortRemoveOrderId) {
      this.shortRemoveOrderId = '';
      return;
    }

    // 处理多头网格订单
    let found = false;
    for (const gridItem of this.longGrid) {
      if (gridItem.orderId === orderId) {
        found = true;
        if (gridItem.pos === 0) {
          // 开仓订单完成
          gridItem.pos = trade.volume;
          this.longCount += 1;
          this.writeLog(`开多仓完成 价格:${trade.price} 数量:${trade.volume}`);
        } else {
          // 平仓订单完成
          gridItem.pos = 0;
          this.longCount -= 1;
          this.writeLog(`平多仓完成 价格:${trade.price} 数量:${trade.volume}`);
        }
        gridItem.orderId = '';
        break;
      }
    }

    // 处理空头网格订单
    if (!found) {
      for (const gridItem of this.shortGrid) {
        if (gridItem.orderId === orderId) {
          if (gridItem.pos === 0) {
            // 开仓订单完成
            gridItem.pos = trade.volume;
            this.shortCount += 1;
            this.writeLog(`开空仓完成 价格:${trade.price} 数量:${trade.volume}`);
          } else {
            // 平仓订单完成
            gridItem.pos = 0;
            this.shortCount -= 1;
            this.writeLog(`平空仓完成 价格:${trade.price} 数量:${trade.volume}`);
          }
          gridItem.orderId = '';
          break;
        }
      }
    }
  }

  /**
   * K线数据更新（1分钟）
   */
  public onBar(bar: BarData, ctx: Context): void {
    if (!this.bg) return;
    this.bg.update(bar);
    
    if (!this.am?.inited) return;

    // 执行网格逻辑
    this.gridLogic(bar.close, ctx);
  }

  /**
   * 1小时K线数据更新
   */
  private on1HourBar(bar: BarData, ctx: Context): void {
    if (!this.am) return;
    
    this.am.add(bar);
    if (!this.am.inited) return;

    // 计算典型价格
    const typicalPrice = this.am.high.map((high, i) => 
      (high + this.am!.low[i] + this.am!.close[i]) / 3
    );

    // 计算RSI
    const rsiArray = talib.rsi({
      values: this.am.close,
      period: this.rsiLength
    });
    this.rsiValue = rsiArray[rsiArray.length - 1] || 0;
    this.lastRsiValue = rsiArray[rsiArray.length - 2] || 0;
    this.last2RsiValue = rsiArray[rsiArray.length - 3] || 0;

    // 计算TEMA
    const temaArray = talib.ema({
      values: this.am.close,
      period: this.temaLength
    });
    this.temaValue = temaArray[temaArray.length - 1] || 0;
    this.lastTemaValue = temaArray[temaArray.length - 2] || 0;

    // 计算布林带
    const bbResult = talib.bollingerbands({
      values: typicalPrice,
      period: this.bbLength,
      stdDev: this.bbDev
    });
    this.bbMid = bbResult[bbResult.length - 1].middle || 0;

    // 计算入场信号
    this.enterLong = (
      this.rsiValue >= this.rsiDown && 
      this.lastRsiValue < this.rsiDown && 
      this.last2RsiValue < this.rsiDown &&
      this.temaValue <= this.bbMid &&
      this.temaValue > this.lastTemaValue
    );

    this.enterShort = (
      this.rsiValue <= this.rsiUp && 
      this.lastRsiValue > this.rsiUp && 
      this.last2RsiValue > this.rsiUp &&
      this.temaValue > this.bbMid &&
      this.temaValue < this.lastTemaValue
    );
  }

  /**
   * 初始化网格
   */
  private initGrid(symbol: string, entryPrice: number, isLong: boolean): void {
    if (this.longRemoveOrderId !== '' && isLong) {
      this.writeLog('移除多仓网格订单未成交，无法再初始化');
      return;
    }
    if (this.shortRemoveOrderId !== '' && !isLong) {
      this.writeLog('移除空仓网格订单未成交，无法再初始化');
      return;
    }

    const leftSize = Math.floor(this.gridSize / 2);
    const rightSize = this.gridSize - leftSize - 1;
    const grid = isLong ? this.longGrid : this.shortGrid;

    // 清空现有网格
    grid.length = 0;

    // 添加中心网格
    const stepPrice = this.getStepPrice(entryPrice);
    grid.push(new GridItem(
      symbol,
      entryPrice,
      isLong ? entryPrice + stepPrice : entryPrice - stepPrice
    ));

    // 添加左侧网格（价格更低）
    let prevPrice = entryPrice;
    for (let i = 0; i < leftSize; i++) {
      const curPrice = prevPrice - this.getStepPrice(prevPrice);
      const curStepPrice = this.getStepPrice(curPrice);
      grid.unshift(new GridItem(
        symbol,
        curPrice,
        isLong ? curPrice + curStepPrice : curPrice - curStepPrice
      ));
      prevPrice = curPrice;
    }

    // 添加右侧网格（价格更高）
    prevPrice = entryPrice;
    for (let i = 0; i < rightSize; i++) {
      const curPrice = prevPrice + this.getStepPrice(prevPrice);
      const curStepPrice = this.getStepPrice(curPrice);
      grid.push(new GridItem(
        symbol,
        curPrice,
        isLong ? curPrice + curStepPrice : curPrice - curStepPrice
      ));
      prevPrice = curPrice;
    }

    this.writeLog(`初始化${isLong ? '多头' : '空头'}网格，中心价格：${entryPrice}，网格数量：${grid.length}`);
  }

  /**
   * 调整网格
   */
  private adjustGrid(symbol: string, price: number, isLong: boolean): void {
    const grid = isLong ? this.longGrid : this.shortGrid;
    if (grid.length === 0) return;

    let minPrice = grid[0].price;
    let maxPrice = grid[grid.length - 1].price;

    // 价格低于最低网格，向下扩展
    while (price <= minPrice) {
      const newPrice = minPrice - this.getStepPrice(minPrice);
      const newStepPrice = this.getStepPrice(newPrice);
      const newGrid = new GridItem(
        symbol,
        newPrice,
        isLong ? newPrice + newStepPrice : newPrice - newStepPrice
      );

      const lastGridItem = grid[grid.length - 1];
      if (lastGridItem.pos > 0) {
        newGrid.pos = lastGridItem.pos;
      }
      if (lastGridItem.orderId !== '') {
        this.cancelOrder({
          orderId: lastGridItem.orderId,
          symbol: lastGridItem.symbol
        });
      }

      grid.unshift(newGrid);
      grid.pop();
      minPrice = newPrice;
    }

    // 价格高于最高网格，向上扩展
    while (price >= maxPrice) {
      const newPrice = maxPrice + this.getStepPrice(maxPrice);
      const newStepPrice = this.getStepPrice(newPrice);
      const newGrid = new GridItem(
        symbol,
        newPrice,
        isLong ? newPrice + newStepPrice : newPrice - newStepPrice
      );

      const firstGridItem = grid[0];
      if (firstGridItem.pos > 0) {
        newGrid.pos = firstGridItem.pos;
      }
      if (firstGridItem.orderId !== '') {
        this.cancelOrder({
          orderId: firstGridItem.orderId,
          symbol: firstGridItem.symbol
        });
      }

      grid.push(newGrid);
      grid.shift();
      maxPrice = newPrice;
    }
  }

  /**
   * 网格交易逻辑
   */
  private async gridLogic(price: number, ctx: Context): Promise<void> {
    const longGrid = this.longGrid;
    const shortGrid = this.shortGrid;

    // 多头网格处理
    if (longGrid.length === 0) {
      if (this.enterLong || this.enterShort) {
        this.initGrid(ctx.symbol, price, true);
      }
    } else if (this.useAdjustGrid) {
      this.adjustGrid(ctx.symbol, price, true);
    }

    // 建立多头底仓
    if (this.longCount === 0 && longGrid.length > 0) {
      await this.openBasePos(price, true, ctx);
    }

    // 多头平仓逻辑
    for (const gridItem of longGrid) {
      if (gridItem.pos > 0 && !gridItem.orderId) {
        try {
          const orderId = await ctx.sell({
            price: gridItem.exitPrice,
            volume: gridItem.pos
          });
          gridItem.orderId = orderId;
        } catch (error) {
          this.writeLog(`多头平仓下单失败：${error}`);
        }
      }
    }

    // 多头开仓逻辑
    for (let i = longGrid.length - 1; i >= 0; i--) {
      const gridItem = longGrid[i];
      if (gridItem.pos === 0 && !gridItem.orderId && gridItem.price <= price) {
        try {
          const volume = this.getVolume(gridItem.price);
          const orderId = await ctx.buy({
            price: gridItem.price,
            volume: volume
          });
          gridItem.orderId = orderId;
        } catch (error) {
          this.writeLog(`多头开仓下单失败：${error}`);
        }
      }
    }

    // 空头网格处理
    if (shortGrid.length === 0) {
      if (this.enterShort || this.enterLong) {
        this.initGrid(ctx.symbol, price, false);
      }
    } else if (this.useAdjustGrid) {
      this.adjustGrid(ctx.symbol, price, false);
    }

    // 建立空头底仓
    if (this.shortCount === 0 && shortGrid.length > 0) {
      await this.openBasePos(price, false, ctx);
    }

    // 空头平仓逻辑
    for (let i = shortGrid.length - 1; i >= 0; i--) {
      const gridItem = shortGrid[i];
      if (gridItem.pos > 0 && !gridItem.orderId) {
        try {
          const orderId = await ctx.cover({
            price: gridItem.exitPrice,
            volume: gridItem.pos
          });
          gridItem.orderId = orderId;
        } catch (error) {
          this.writeLog(`空头平仓下单失败：${error}`);
        }
      }
    }

    // 空头开仓逻辑
    for (const gridItem of shortGrid) {
      if (gridItem.pos === 0 && !gridItem.orderId && gridItem.price >= price) {
        try {
          const volume = this.getVolume(gridItem.price);
          const orderId = await ctx.short({
            price: gridItem.price,
            volume: volume
          });
          gridItem.orderId = orderId;
        } catch (error) {
          this.writeLog(`空头开仓下单失败：${error}`);
        }
      }
    }
  }

  /**
   * 建立底仓
   */
  private async openBasePos(price: number, isLong: boolean, ctx: Context): Promise<void> {
    let leftCount = this.basePosCount;
    const grid = isLong ? this.longGrid : this.shortGrid;

    if (isLong) {
      for (const gridItem of grid) {
        if (leftCount > 0 && gridItem.price >= price) {
          if (gridItem.pos !== 0) {
            this.writeLog('网格中已有仓位，无法开底仓');
            return;
          }
          try {
            const volume = this.getVolume(gridItem.price);
            const orderId = await ctx.buy({
              price: price,
              volume: volume
            });
            gridItem.orderId = orderId;
            leftCount -= 1;
          } catch (error) {
            this.writeLog(`多头底仓开仓失败：${error}`);
          }
        }
      }
    } else {
      for (let i = grid.length - 1; i >= 0; i--) {
        const gridItem = grid[i];
        if (leftCount > 0 && gridItem.price <= price) {
          if (gridItem.pos !== 0) {
            this.writeLog('网格中已有仓位，无法开底仓');
            return;
          }
          try {
            const volume = this.getVolume(gridItem.price);
            const orderId = await ctx.short({
              price: price,
              volume: volume
            });
            gridItem.orderId = orderId;
            leftCount -= 1;
          } catch (error) {
            this.writeLog(`空头底仓开仓失败：${error}`);
          }
        }
      }
    }
  }

  /**
   * 获取网格交易数量
   */
  private getVolume(price: number): number {
    let volume = this.gridCapital / this.gridSize / price / 2;
    volume = Math.floor(volume / this.minVolume) * this.minVolume;
    return Math.max(volume, this.minVolume);
  }

  /**
   * 获取网格步长价格
   */
  private getStepPrice(curPrice: number): number {
    return curPrice * this.gridStep;
  }

  /**
   * 移除网格
   */
  private async removeGrid(price: number, isLong: boolean, ctx: Context): Promise<void> {
    if (isLong) {
      // 平掉所有多头仓位
      if (ctx.longHolding.pos > 0) {
        try {
          const orderId = await ctx.sell({
            price: price,
            volume: ctx.longHolding.pos
          });
          this.longRemoveOrderId = orderId;
        } catch (error) {
          this.writeLog(`移除多头网格平仓失败：${error}`);
        }
      }
      // 取消所有订单
      for (const gridItem of this.longGrid) {
        if (gridItem.orderId) {
          await this.cancelOrder({
            orderId: gridItem.orderId,
            symbol: gridItem.symbol
          });
        }
      }
      this.longGrid.length = 0;
      this.longCount = 0;
    } else {
      // 平掉所有空头仓位
      if (ctx.shortHolding.pos > 0) {
        try {
          const orderId = await ctx.cover({
            price: price,
            volume: ctx.shortHolding.pos
          });
          this.shortRemoveOrderId = orderId;
        } catch (error) {
          this.writeLog(`移除空头网格平仓失败：${error}`);
        }
      }
      // 取消所有订单
      for (const gridItem of this.shortGrid) {
        if (gridItem.orderId) {
          await this.cancelOrder({
            orderId: gridItem.orderId,
            symbol: gridItem.symbol
          });
        }
      }
      this.shortGrid.length = 0;
      this.shortCount = 0;
    }
  }
}
