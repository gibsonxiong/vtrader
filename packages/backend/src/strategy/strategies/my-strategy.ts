// import { Direction, Interval, Offset, OrderStatus } from '../../types/common';
// import type { BarData, OrderData } from '../../types/common';
// import { Strategy, param } from '../strategy';
// import { ArrayManger } from '../array-manager';
// import { rsi } from 'technicalindicators';
// import { BarGenerator } from '../bar-generator';
// import { Context } from '../context';

// /**
//  * 双均线策略
//  * 参考vnpy的双均线策略实现
//  */
// export default class MyStrategy extends Strategy {
//   @param({
//     type: String,
//     default: 14,
//   })
//   rsiWindow!: number;

//   preloadCount(): number {
//     return this.rsiWindow;
//   }

//   amLength(): number {
//     return this.rsiWindow + 1;
//   }

//   /**
//    * 策略初始化
//    */
//   public onInit(): void {
//     console.log('rsiWindow', this.rsiWindow);
//   }

//   public onOrder(order: OrderData, ctx: Context): void {
//     if (order.status === OrderStatus.NOTTRADED) return;
//     console.log(`[${order.offset === Offset.OPEN ? '开' : '平'}${order.direction === Direction.LONG ? '多' : '空'}${order.symbol}] 价格：${order.price} 交易额：${order.price * order.volume} 订单[${order.orderId}] ：${order.status}`);

//     console.log(`全部：${ctx.wallet.total} 可用：${ctx.wallet.available}`);
//     console.log('');
//   }

//   /**
//    * K线数据更新
//    */
//   public onBar(bar: BarData, ctx: Context): void {
//     if (!ctx.am?.inited) return;

//     const rsiResult = rsi({
//       values: ctx.am.close,
//       period: this.rsiWindow,
//     });
    
//     console.log(rsiResult[rsiResult.length - 1]);

//     if (ctx.longHolding.pos === 0 && rsiResult[rsiResult.length - 1] > 70) {
//       ctx.buy({
//         price: bar.close,
//         volume: (ctx.wallet.available * 0.95) / bar.close
//       });
//     }

//     if (ctx.longHolding.pos > 0 && rsiResult[rsiResult.length - 1] < 30) {
//       ctx.sell({
//         price: bar.close, 
//         volume: ctx.longHolding.pos
//       });
//     }
//   }
// }
