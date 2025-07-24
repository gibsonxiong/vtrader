import { Interval } from '../../types/common';
import type { BarData } from '../../types/common';
import { Strategy, param } from '../strategy';
import { ArrayManger } from '../array-manager';
import { rsi } from 'technicalindicators';
import { BarGenerator } from '../bar-generator';

/**
 * 双均线策略
 * 参考vnpy的双均线策略实现
 */
export default class MyStrategy extends Strategy {
  @param({
    type: String,
    default: 14,
  })
  rsiWindow!: number;

  am: ArrayManger;
  bg!: BarGenerator;

  /**
   * 策略初始化
   */
  public onInit(): void {
    console.log('rsiWindow', this.rsiWindow);

    this.am = new ArrayManger();
    this.bg = new BarGenerator({
      interval: Interval.DAILY_1,
      callback: (bar: BarData) => {
        console.log(bar);
      },
    });
  }

  public onOrder(): void {
    console.log(this.wallet);
  }

  /**
   * K线数据更新
   */
  public onBar(bar: BarData): void {
    this.bg.update(bar);
    this.am.add(bar);

    if (!this.am.inited) return;

    const rsiResult = rsi({
      values: this.am.close,
      period: this.rsiWindow,
    });

    if (this.longHolding.pos === 0 && rsiResult[rsiResult.length - 1] > 70) {
      this.buy(bar.close, this.wallet.available / bar.close);
    }

    if (this.longHolding.pos > 0 && rsiResult[rsiResult.length - 1] < 30) {
      this.sell(bar.close, this.longHolding.pos);
    }
  }
}
