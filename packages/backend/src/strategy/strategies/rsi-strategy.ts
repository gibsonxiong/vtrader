import { Direction, Interval, Offset, OrderStatus } from '../../types/common';
import type { BarData, OrderData } from '../../types/common';
import { Strategy, param } from '../strategy';
import { ArrayManger } from '../array-manager';
import { rsi } from 'technicalindicators';
import { BarGenerator } from '../bar-generator';
import { Context } from '../context';

/**
 * 双均线策略
 * 参考vnpy的双均线策略实现
 */
export default class RSIStrategy extends Strategy {
  @param({
    type: Number,
    default: 14,
  })
  rsiWindow!: number;

  currentOrderId = '';

  preloadCount(): number {
    return this.rsiWindow;
  }

  amLength(): number {
    return this.rsiWindow + 1;
  }

  /**
   * 策略初始化
   */
  public onInit(): void {
    console.log('rsiWindow', this.rsiWindow);
  }

  public onOrder(order: OrderData, ctx: Context): void {
    if (order.status === OrderStatus.NOTTRADED) return;
    console.log(`[${order.offset === Offset.OPEN ? '开' : '平'}${order.direction === Direction.LONG ? '多' : '空'}${order.symbol}] 价格：${order.price} 交易额：${order.price * order.volume} 订单[${order.orderId}] ：${order.status}`);

    if (order.orderId === this.currentOrderId) {
      this.currentOrderId = '';
    }

    console.log(`[${ctx.asset.name}] ${ctx.asset.balance} / ${ctx.asset.available}`);
    console.log('');
  }

  /**
   * K线数据更新
   */
  public async onBar(bar: BarData, ctx: Context): Promise<void> {
    if (!ctx.am?.inited) return;

    const rsiResult = rsi({
      values: ctx.am.close,
      period: Number(this.rsiWindow),
    });

    if (this.currentOrderId) return;
    
    if (ctx.longPos.size === 0 && rsiResult[rsiResult.length - 1] <= 20) {
      this.currentOrderId = await ctx.buy({
        price: bar.close,
        volume: (ctx.asset.available * 0.95) / bar.close
      });
    }

    if (ctx.longPos.size > 0 && rsiResult[rsiResult.length - 1] >= 80) {
      this.currentOrderId = await ctx.sell({
        price: bar.close, 
        volume: ctx.longPos.size
      });
    }
  }
}
