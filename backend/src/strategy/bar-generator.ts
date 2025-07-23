import { BarData, Interval } from '../types/common';

export interface Params {
  interval: Interval;
  callback: (bar: BarData) => void;
}

const msOfMinute = 60 * 1000;
const msMap: Record<Interval, number> = {
  [Interval.MINUTE_1]: msOfMinute,
  [Interval.MINUTE_5]: 5 * msOfMinute,
  [Interval.MINUTE_15]: 15 * msOfMinute,
  [Interval.MINUTE_30]: 30 * msOfMinute,
  [Interval.HOUR_1]: 60 * msOfMinute,
  [Interval.HOUR_2]: 2 * 60 * msOfMinute,
  [Interval.HOUR_4]: 4 * 60 * msOfMinute,
  [Interval.HOUR_6]: 6 * 60 * msOfMinute,
  [Interval.HOUR_8]: 8 * 60 * msOfMinute,
  [Interval.HOUR_12]: 12 * 60 * msOfMinute,
  [Interval.DAILY_1]: 24 * 60 * msOfMinute,
  [Interval.DAILY_3]: 3 * 24 * 60 * msOfMinute,
  [Interval.WEEKLY_1]: 7 * 24 * msOfMinute,
  [Interval.MONTHLY_1]: 30 * 24 * msOfMinute,
};

export class BarGenerator {
  bar: BarData | null = null;
  interval: Interval;
  callback: (bar: BarData) => void;

  constructor(params: Params) {
    this.interval = params.interval;
    this.callback = params.callback;

    // if (msMap[this.interval] > msMap[Interval.DAILY_1]) {
    //   throw new Error('不支持超过1日K线的合并');
    // }
  }

  update(newBar: BarData) {
    // 只处理1分钟K线
    if (newBar.interval !== Interval.MINUTE_1) {
      return;
    }

    if (this.bar) {
      this.bar.close = newBar.close;
      this.bar.high = Math.max(this.bar.high, newBar.high);
      this.bar.low = Math.min(this.bar.low, newBar.low);
      this.bar.volume += newBar.volume;
    } else {
      if (newBar.timestamp % msMap[this.interval] === 0) {
        this.bar = {
          ...newBar,
          interval: this.interval,
        };
      }
    }

    if (this.bar && (newBar.timestamp + msOfMinute) % msMap[this.interval] === 0) {
      this.callback(this.bar);
      this.bar = null;
    }
  }
}
