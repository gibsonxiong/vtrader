import { OrderData, OrderStatus } from '@vtrader/shared';
import { Response } from '@vtrader/shared';
import { BigNumber } from 'bignumber.js';

let orderCount: number = 0;

export function genOrderId(): string {
  return String(orderCount++);
}

export function canOrderCancel(order: OrderData) {
  return order.status === OrderStatus.NOTTRADED || order.status === OrderStatus.PARTTRADED;
}

export function roundTo(source: number, target: number, roundMode?: BigNumber.RoundingMode): number {
  const _source = new BigNumber(String(source));
  const _target = new BigNumber(String(target));

  if (_source.isNaN() || _target.isNaN()) {
    return NaN;
  }

  if (_target.isZero()) {
    return 0;
  }

  const result = _source.div(target).integerValue(roundMode).times(target).toNumber();

  return result;
}

export function floorTo(source: number, target: number): number {
  return roundTo(source, target, BigNumber.ROUND_FLOOR);
}

export function ceilTo(source: number, target: number): number {
  return roundTo(source, target, BigNumber.ROUND_CEIL);
}

export function calculateStd(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function response<T>(data?: T, code: number = 0, msg: string = '成功'): Response<T> {
  return {
    code,
    msg,
    data: data as T,
  };
}
